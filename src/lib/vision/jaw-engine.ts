import { JAW_SELECT_MIN_MS, JAW_SOS_HOLD_MS } from "@/lib/constants";

export type JawSelectEvent = {
  kind: "select";
  durationMs: number;
};

/**
 * Masseter / light jaw motion. Emits on release so a hold can still become SOS.
 */
export class JawEngine {
  private active = false;
  private startedAt: number | null = null;
  private cooldownUntil = 0;
  private lastScore = 0;

  get clenched(): boolean {
    return this.active;
  }

  holdMs(now: number): number {
    if (!this.active || this.startedAt === null) return 0;
    return now - this.startedAt;
  }

  get score(): number {
    return this.lastScore;
  }

  reset(): void {
    this.active = false;
    this.startedAt = null;
    this.cooldownUntil = 0;
    this.lastScore = 0;
  }

  update(
    score: number,
    now: number,
    enter: number,
    exit: number,
  ): JawSelectEvent | null {
    this.lastScore = score;

    if (!this.active && score >= enter && now >= this.cooldownUntil) {
      this.active = true;
      this.startedAt = now;
      return null;
    }

    if (this.active && score < exit) {
      const durationMs = this.startedAt !== null ? now - this.startedAt : 0;
      this.active = false;
      this.startedAt = null;
      this.cooldownUntil = now + 480;
      if (durationMs >= JAW_SELECT_MIN_MS && durationMs < JAW_SOS_HOLD_MS) {
        return { kind: "select", durationMs };
      }
    }

    return null;
  }
}
