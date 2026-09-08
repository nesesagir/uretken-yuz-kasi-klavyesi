import type { BlinkEvent } from "@/types";
import { clamp01 } from "@/lib/vision/geometry";

const ENTER = 0.3;
const EXIT = 0.48;
const COOLDOWN_MS = 280;
const MIN_RANGE = 0.006;
const WARMUP_FRAMES = 24;

/** Deliberate hold. Typical selection blinks stay below this. */
export const LONG_BLINK_MS = 450;

/**
 * Emits on eyelid *opening*, with duration.
 * Short → communication. Long → fail-safe only. Never both.
 */
export class BlinkEngine {
  private min = Number.POSITIVE_INFINITY;
  private max = Number.NEGATIVE_INFINITY;
  private frames = 0;
  private eyesShut = false;
  private closedAt: number | null = null;
  private cooldownUntil = 0;
  private lastScaled = 1;

  get scaled(): number {
    return this.lastScaled;
  }

  get ready(): boolean {
    return this.frames >= WARMUP_FRAMES;
  }

  closedMs(now: number): number {
    if (!this.eyesShut || this.closedAt === null) return 0;
    return now - this.closedAt;
  }

  reset(): void {
    this.min = Number.POSITIVE_INFINITY;
    this.max = Number.NEGATIVE_INFINITY;
    this.frames = 0;
    this.eyesShut = false;
    this.closedAt = null;
    this.cooldownUntil = 0;
    this.lastScaled = 1;
  }

  update(openness: number, now: number): BlinkEvent | null {
    this.frames += 1;
    this.min = Math.min(this.min, openness);
    this.max = Math.max(this.max, openness);

    const range = this.max - this.min;
    let scaled: number;
    if (range < MIN_RANGE) {
      scaled = this.max > 1e-8 ? clamp01(openness / this.max) : 1;
    } else {
      scaled = clamp01((openness - this.min) / range);
    }
    this.lastScaled = scaled;

    if (!this.ready) return null;

    if (!this.eyesShut && scaled < ENTER && now >= this.cooldownUntil) {
      this.eyesShut = true;
      this.closedAt = now;
      return null;
    }

    if (this.eyesShut && scaled > EXIT) {
      this.eyesShut = false;
      const durationMs = this.closedAt !== null ? now - this.closedAt : 0;
      this.closedAt = null;
      this.cooldownUntil = now + COOLDOWN_MS;
      return {
        kind: durationMs >= LONG_BLINK_MS ? "long" : "short",
        durationMs,
      };
    }

    return null;
  }
}
