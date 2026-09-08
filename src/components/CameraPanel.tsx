"use client";

import { t } from "@/lib/copy";
import type { FaceMetrics, Locale, PipelinePhase } from "@/types";

type Props = {
  locale: Locale;
  phase: PipelinePhase;
  metrics: FaceMetrics | null;
  patternCount: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  error?: string | null;
  showMeters?: boolean;
};

function Meter({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "mint" | "cyan" | "danger";
}) {
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(value * 100)}</span>
      </div>
      <div className="meter-track mt-1.5">
        <i className={`meter-fill tone-${tone}`} style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </div>
  );
}

export function CameraPanel({
  locale,
  phase,
  metrics,
  patternCount,
  videoRef,
  canvasRef,
  error,
  showMeters = true,
}: Props) {
  const ui = t(locale);
  const caption =
    phase === "requesting-camera"
      ? ui.awaitingPermission
      : phase === "loading-model"
        ? ui.loadingModel
        : phase === "awaiting-face"
          ? ui.awaitingFace
          : phase === "calibrating"
            ? ui.calibrating
            : phase === "live"
              ? ui.live
              : phase === "error"
                ? error === "model"
                  ? ui.noModel
                  : ui.noCamera
                : ui.startHint;

  const live = phase === "live";

  return (
    <section className="surface flex min-h-0 flex-col overflow-hidden rounded-3xl">
      <div className="camera-stage">
        <video ref={videoRef} playsInline muted autoPlay />
        <canvas ref={canvasRef} />
        <div className="camera-vignette" />
        <p
          className={`absolute bottom-3 left-3 m-0 rounded-full px-3 py-1 text-xs tracking-wide ${
            live ? "bg-slate-950/80 text-teal-500" : "bg-slate-950/80 text-slate-300"
          }`}
        >
          {caption}
        </p>
      </div>
      {showMeters ? (
      <div className="grid gap-3 p-4">
        <p className="m-0 text-xs uppercase tracking-wider text-slate-500">
          {ui.meshOn}
          {metrics ? ` · ${metrics.fps} ${ui.fps}` : ""}
        </p>
        <Meter label={ui.openness} value={metrics?.opennessScaled ?? 0} tone="mint" />
        <Meter label={ui.jawMeter} value={metrics?.jawScaled ?? 0} tone="cyan" />
        <Meter label={ui.eyelidMeter} value={metrics?.eyelidRaise ?? 0} tone="danger" />
        <div className="safety-dots flex items-center gap-2" aria-label={ui.safety}>
          <span className="mr-1 text-xs text-slate-600">{ui.safety}</span>
          {[0, 1, 2].map((index) => (
            <i key={index} className={index < patternCount ? "is-lit" : ""} />
          ))}
        </div>
      </div>
      ) : null}
    </section>
  );
}
