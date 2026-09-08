import { BASELINE_MIN_SAMPLES, BASELINE_MS } from "@/lib/constants";

export type SignalStats = {
  mean: number;
  std: number;
  min: number;
  max: number;
};

export type BaselineSnapshot = {
  eye: SignalStats;
  jaw: SignalStats;
  eyelid: SignalStats;
  jawEnter: number;
  jawExit: number;
  eyelidPanic: number;
};

function stats(values: number[]): SignalStats {
  const n = values.length;
  if (!n) return { mean: 0, std: 0, min: 0, max: 0 };
  let sum = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    sum += value;
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  const mean = sum / n;
  let variance = 0;
  for (const value of values) variance += (value - mean) ** 2;
  return { mean, std: Math.sqrt(variance / n), min, max };
}

export function deriveThresholds(
  eye: SignalStats,
  jaw: SignalStats,
  eyelid: SignalStats,
): BaselineSnapshot {
  const jawEnter = jaw.mean + Math.max(2.6 * jaw.std, 0.16);
  const jawExit = Math.min(jawEnter - 0.04, jaw.mean + Math.max(1.3 * jaw.std, 0.07));
  const eyelidPanic = Math.max(
    eyelid.mean + Math.max(4.2 * eyelid.std, 0.22),
    0.4,
  );
  return { eye, jaw, eyelid, jawEnter, jawExit, eyelidPanic };
}

/**
 * Listens to resting-face motion (spasm/noise) and freezes trigger floors.
 * Voluntary action must rise above this personal baseline.
 */
export class BaselineCalibrator {
  private eye: number[] = [];
  private jaw: number[] = [];
  private eyelid: number[] = [];
  private collectedMs = 0;
  private lastAt = 0;
  private frozen: BaselineSnapshot | null = null;

  reset(): void {
    this.eye = [];
    this.jaw = [];
    this.eyelid = [];
    this.collectedMs = 0;
    this.lastAt = 0;
    this.frozen = null;
  }

  get ready(): boolean {
    return this.frozen !== null;
  }

  get progress(): number {
    if (this.frozen) return 1;
    return Math.min(1, this.collectedMs / BASELINE_MS);
  }

  get snapshot(): BaselineSnapshot | null {
    return this.frozen;
  }

  sample(now: number, signals: { eye: number; jaw: number; eyelid: number }): void {
    if (this.frozen) return;
    if (this.lastAt > 0) this.collectedMs += Math.min(80, now - this.lastAt);
    this.lastAt = now;
    this.eye.push(signals.eye);
    this.jaw.push(signals.jaw);
    this.eyelid.push(signals.eyelid);
    if (
      this.collectedMs >= BASELINE_MS &&
      this.eye.length >= BASELINE_MIN_SAMPLES
    ) {
      this.frozen = deriveThresholds(
        stats(this.eye),
        stats(this.jaw),
        stats(this.eyelid),
      );
    }
  }

  pause(): void {
    this.lastAt = 0;
  }
}
