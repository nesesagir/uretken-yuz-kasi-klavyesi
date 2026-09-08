import { SLEEP_SHUT_RATIO } from "@/lib/constants";
import type { Point } from "@/types";

export const LM = {
  leftCheek: 234,
  rightCheek: 454,
  rightEyeUpper: 159,
  rightEyeLower: 145,
  leftEyeUpper: 386,
  leftEyeLower: 374,
  chin: 152,
  nose: 1,
  upperLip: 13,
  lowerLip: 14,
} as const;

export function euclidean(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function faceWidth(landmarks: Point[]): number {
  const a = landmarks[LM.leftCheek];
  const b = landmarks[LM.rightCheek];
  if (!a || !b) return 0;
  return euclidean(a, b);
}

function lidAperture(
  landmarks: Point[],
  upper: number,
  lower: number,
  width: number,
): number {
  const u = landmarks[upper];
  const l = landmarks[lower];
  if (!u || !l || width < 1e-8) return 0;
  return euclidean(u, l) / width;
}

/**
 * Mean vertical eyelid gap, divided by face width.
 * Independent of how far the user sits from the camera.
 */
export function normalizedEyeOpenness(landmarks: Point[]): number {
  const width = faceWidth(landmarks);
  if (width < 1e-8) return 0;
  const right = lidAperture(
    landmarks,
    LM.rightEyeUpper,
    LM.rightEyeLower,
    width,
  );
  const left = lidAperture(landmarks, LM.leftEyeUpper, LM.leftEyeLower, width);
  return (left + right) / 2;
}

/**
 * True only when both eyelids are shut, compared with the user's resting open eye.
 * Looking down or a normal blink must not count as sleep.
 */
export function bothEyesShut(landmarks: Point[], restOpen: number): boolean {
  const width = faceWidth(landmarks);
  if (width < 1e-8 || restOpen < 1e-8) return false;
  const thresh = Math.max(restOpen * SLEEP_SHUT_RATIO, 0.006);
  const right = lidAperture(landmarks, LM.rightEyeUpper, LM.rightEyeLower, width);
  const left = lidAperture(landmarks, LM.leftEyeUpper, LM.leftEyeLower, width);
  return left < thresh && right < thresh;
}

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Mouth opening as a 0–1 stand-in for light jaw motion when blendshapes
 * are missing. Masseter clench with teeth together is read from blendshapes.
 */
export function geometricJawMotion(landmarks: Point[]): number {
  const width = faceWidth(landmarks);
  const upper = landmarks[LM.upperLip];
  const lower = landmarks[LM.lowerLip];
  if (!upper || !lower || width < 1e-8) return 0;
  const gap = euclidean(upper, lower) / width;
  return clamp01((gap - 0.015) / 0.22);
}

export function masseterScore(
  landmarks: Point[],
  blend: Record<string, number>,
): number {
  const jawOpen = blend.jawOpen ?? 0;
  const jawForward = blend.jawForward ?? 0;
  const press =
    ((blend.mouthPressLeft ?? 0) + (blend.mouthPressRight ?? 0)) / 2;
  return Math.max(jawOpen, jawForward * 0.9, press, geometricJawMotion(landmarks));
}

export function eyelidRaiseScore(
  landmarks: Point[],
  blend: Record<string, number>,
): number {
  const wide =
    ((blend.eyeWideLeft ?? 0) + (blend.eyeWideRight ?? 0)) / 2;
  const geometric = clamp01((normalizedEyeOpenness(landmarks) - 0.025) / 0.07);
  return Math.max(wide, geometric * 0.85);
}
