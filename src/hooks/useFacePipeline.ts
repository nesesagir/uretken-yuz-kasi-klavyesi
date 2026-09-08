"use client";

import { CAMERA_CONSTRAINTS, FACE_LOST_MS, METRIC_THROTTLE_MS, SLEEP_EYES_CLOSED_MS, SLEEP_SCALED_SHUT, WAKE_HOLD_MS } from "@/lib/constants";
import { FailSafeService } from "@/lib/safety/fail-safe-service";
import { SosService } from "@/lib/safety/sos-service";
import { BaselineCalibrator } from "@/lib/vision/baseline";
import { BlinkEngine } from "@/lib/vision/blink-engine";
import {
  bothEyesShut,
  eyelidRaiseScore,
  faceWidth,
  masseterScore,
  normalizedEyeOpenness,
} from "@/lib/vision/geometry";
import { JawEngine } from "@/lib/vision/jaw-engine";
import {
  createFaceLandmarker,
  type LandmarkerHandle,
} from "@/lib/vision/landmarker";
import type {
  EmergencyState,
  FaceMetrics,
  PipelinePhase,
  SosState,
  TriggerMode,
} from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";

type Options = {
  active: boolean;
  triggerMode: TriggerMode;
  sleeping: boolean;
  onSelect: () => void;
  onSleep: () => void;
  onWake: () => void;
  onFailSafeChange: (state: EmergencyState) => void;
  onSosChange: (state: SosState) => void;
  onSafetyCancel: () => void;
};

const idleSos = (): SosState => ({ active: false, reason: null });

export function useFacePipeline({
  active,
  triggerMode,
  sleeping,
  onSelect,
  onSleep,
  onWake,
  onFailSafeChange,
  onSosChange,
  onSafetyCancel,
}: Options) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectRef = useRef(onSelect);
  const sleepCbRef = useRef(onSleep);
  const wakeCbRef = useRef(onWake);
  const failSafeCbRef = useRef(onFailSafeChange);
  const sosCbRef = useRef(onSosChange);
  const safetyCancelRef = useRef(onSafetyCancel);
  const triggerRef = useRef(triggerMode);
  const sleepingRef = useRef(sleeping);
  const failSafeRef = useRef(new FailSafeService());
  const sosRef = useRef(new SosService());
  const [phase, setPhase] = useState<PipelinePhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<FaceMetrics | null>(null);
  const [baselineProgress, setBaselineProgress] = useState(0);

  selectRef.current = onSelect;
  sleepCbRef.current = onSleep;
  wakeCbRef.current = onWake;
  failSafeCbRef.current = onFailSafeChange;
  sosCbRef.current = onSosChange;
  safetyCancelRef.current = onSafetyCancel;
  triggerRef.current = triggerMode;
  sleepingRef.current = sleeping;

  const cancelEmergency = useCallback((): EmergencyState => {
    const next = failSafeRef.current.cancel();
    failSafeCbRef.current(next);
    return next;
  }, []);

  const cancelSos = useCallback((): SosState => {
    const next = sosRef.current.cancel();
    sosCbRef.current(next);
    return next;
  }, []);

  const injectLongBlink = useCallback(() => {
    const next = failSafeRef.current.noteLongBlink(performance.now());
    failSafeCbRef.current(next);
    return next;
  }, []);

  const injectSos = useCallback(() => {
    const next = sosRef.current.inject("eyelid-raise");
    sosCbRef.current(next);
    return next;
  }, []);

  useEffect(() => {
    if (!active) {
      setPhase("idle");
      setBaselineProgress(0);
      return;
    }

    let cancelled = false;
    let stream: MediaStream | null = null;
    let handle: LandmarkerHandle | null = null;
    let raf = 0;
    const blink = new BlinkEngine();
    const jaw = new JawEngine();
    const baseline = new BaselineCalibrator();
    const failSafe = new FailSafeService();
    const sos = new SosService();
    failSafeRef.current = failSafe;
    sosRef.current = sos;

    let lastTs = -1;
    let frames = 0;
    let fps = 0;
    let fpsAt = performance.now();
    let metricsAt = 0;
    let progressAt = 0;
    let lastEm: EmergencyState | null = null;
    let lastSos: SosState | null = null;
    let lastPhase: PipelinePhase = "requesting-camera";
    let sleepSent = false;
    let wakeSent = false;
    let ignoreJawUntilOpen = false;
    let sleepHoldoffUntil = 0;
    let lastBlinkAt = 0;
    let fullyShutAt: number | null = null;
    let lostFaceAt: number | null = null;

    const releaseCamera = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      handle?.close();
      handle = null;
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.srcObject = null;
      }
    };

    const setPhaseSafe = (next: PipelinePhase) => {
      if (next === lastPhase) return;
      lastPhase = next;
      setPhase(next);
    };

    const publishFailSafe = (em: EmergencyState) => {
      const changed =
        !lastEm ||
        lastEm.phase !== em.phase ||
        lastEm.patternCount !== em.patternCount ||
        Math.abs(lastEm.graceRemainingMs - em.graceRemainingMs) > 90;
      if (!changed) return;
      lastEm = em;
      failSafeCbRef.current(em);
    };

    const publishSos = (state: SosState) => {
      const changed =
        !lastSos || lastSos.active !== state.active || lastSos.reason !== state.reason;
      if (!changed) return;
      lastSos = state;
      sosCbRef.current(state);
    };

    async function waitForVideoElement() {
      for (let i = 0; i < 90 && !cancelled; i += 1) {
        if (videoRef.current) return videoRef.current;
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve());
        });
      }
      return videoRef.current;
    }

    async function boot() {
      setError(null);
      setPhaseSafe("requesting-camera");
      const mountedVideo = await waitForVideoElement();
      if (cancelled) return;
      if (!mountedVideo) {
        setError("camera");
        setPhaseSafe("error");
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
      } catch {
        if (!cancelled) {
          setError("camera");
          setPhaseSafe("error");
        }
        return;
      }
      if (cancelled) {
        releaseCamera();
        return;
      }

      const video = videoRef.current;
      if (!video) {
        releaseCamera();
        if (!cancelled) {
          setError("camera");
          setPhaseSafe("error");
        }
        return;
      }
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play().catch(() => undefined);
      if (cancelled) {
        releaseCamera();
        return;
      }

      setPhaseSafe("loading-model");
      try {
        handle = await createFaceLandmarker();
      } catch {
        if (!cancelled) {
          setError("model");
          setPhaseSafe("error");
        }
        return;
      }
      if (cancelled) {
        releaseCamera();
        return;
      }
      setPhaseSafe("awaiting-face");

      const loop = () => {
        raf = requestAnimationFrame(loop);
        const frameVideo = videoRef.current;
        const canvas = canvasRef.current;
        if (!frameVideo || !canvas || !handle || frameVideo.readyState < 2) return;

        const now = performance.now();
        if (now <= lastTs) return;
        lastTs = now;

        const width = frameVideo.videoWidth;
        const height = frameVideo.videoHeight;
        if (!width || !height) return;
        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const frame = handle.detect(frameVideo, now);
        if (!frame) {
          ctx.clearRect(0, 0, width, height);
          baseline.pause();
          fullyShutAt = null;
          if (lostFaceAt === null) lostFaceAt = now;
          if (now - lostFaceAt >= FACE_LOST_MS && (lastPhase === "live" || lastPhase === "calibrating")) {
            setPhaseSafe("awaiting-face");
          }
          publishFailSafe(failSafe.tick(now));
          return;
        }
        lostFaceAt = null;

        const { landmarks, blendshapes } = frame;
        handle.draw(ctx, landmarks, width, height);

        const openness = normalizedEyeOpenness(landmarks);
        const jawScore = masseterScore(landmarks, blendshapes);
        const eyelid = eyelidRaiseScore(landmarks, blendshapes);

        if (!baseline.ready) {
          setPhaseSafe("calibrating");
          baseline.sample(now, { eye: openness, jaw: jawScore, eyelid });
          if (now - progressAt >= 120) {
            progressAt = now;
            setBaselineProgress(baseline.progress);
          }
          publishFailSafe(failSafe.tick(now));
          return;
        }

        const floors = baseline.snapshot;
        const blinkEvent = blink.update(openness, now);
        if (blinkEvent) {
          sos.noteBlink(now);
          lastBlinkAt = now;
        }

        const jawEvent = floors
          ? jaw.update(jawScore, now, floors.jawEnter, floors.jawExit)
          : null;

        const resting = sleepingRef.current;

        if (resting) {
          fullyShutAt = null;
          if (floors && jaw.holdMs(now) >= WAKE_HOLD_MS && !wakeSent) {
            wakeSent = true;
            ignoreJawUntilOpen = true;
            sleepHoldoffUntil = now + 6_000;
            sleepSent = true;
            sos.clearJawHold();
            wakeCbRef.current();
          }
        } else {
          wakeSent = false;
          const geoShut = Boolean(floors && bothEyesShut(landmarks, floors.eye.mean));
          const scaledShut = blink.scaled < SLEEP_SCALED_SHUT;
          const shut = geoShut || scaledShut;
          if (shut) {
            if (fullyShutAt === null) fullyShutAt = now;
          } else {
            fullyShutAt = null;
          }
          const shutMs = fullyShutAt === null ? 0 : now - fullyShutAt;
          const holdSleep =
            now < sleepHoldoffUntil || failSafe.collecting() || blinkEvent?.kind === "long";
          if (!holdSleep && shutMs >= SLEEP_EYES_CLOSED_MS) {
            if (!sleepSent) {
              sleepSent = true;
              sleepCbRef.current();
            }
          } else if (!shut) {
            sleepSent = false;
          }
        }

        const swallowJawSelect = ignoreJawUntilOpen;
        if (ignoreJawUntilOpen && !jaw.clenched) {
          ignoreJawUntilOpen = false;
        }

        let sosState = idleSos();
        if (floors) {
          sosState = sos.update({
            now,
            jaw: jawScore,
            jawEnter: floors.jawEnter,
            eyelid,
            eyelidPanic: floors.eyelidPanic,
          });
        }
        publishSos(sosState);

        const mode = triggerRef.current;
        const safetyLatched = failSafe.isLatched() || sosState.active;
        const blinkBlocksJaw = blink.closedMs(now) > 0 || now - lastBlinkAt < 550;

        if (safetyLatched) {
          if (!swallowJawSelect && jawEvent?.kind === "select") {
            safetyCancelRef.current();
          }
        } else if (!sleepingRef.current) {
          if (mode === "blink" && blinkEvent?.kind === "short") {
            selectRef.current();
          }
          if (
            mode === "jaw" &&
            !swallowJawSelect &&
            !blinkBlocksJaw &&
            jawEvent?.kind === "select"
          ) {
            selectRef.current();
          }
        }

        if (blinkEvent?.kind === "long" && !sleepingRef.current) {
          publishFailSafe(failSafe.noteLongBlink(now));
        } else {
          publishFailSafe(failSafe.tick(now));
        }

        frames += 1;
        if (now - fpsAt >= 1000) {
          fps = frames;
          frames = 0;
          fpsAt = now;
        }

        setPhaseSafe("live");

        if (now - metricsAt >= METRIC_THROTTLE_MS) {
          metricsAt = now;
          setBaselineProgress(1);
          setMetrics({
            openness,
            opennessScaled: blink.scaled,
            jawScore,
            jawScaled: floors
              ? Math.min(1, jawScore / Math.max(floors.jawEnter, 0.08))
              : jawScore,
            eyelidRaise: eyelid,
            faceWidth: faceWidth(landmarks),
            fps,
            blinking: blink.scaled < 0.35,
            clenching: jaw.clenched,
            baselineReady: true,
          });
        }
      };

      raf = requestAnimationFrame(loop);
    }

    void boot();

    return () => {
      cancelled = true;
      releaseCamera();
    };
  }, [active]);

  return {
    videoRef,
    canvasRef,
    phase,
    error,
    metrics,
    baselineProgress,
    cancelEmergency,
    cancelSos,
    injectLongBlink,
    injectSos,
  };
}
