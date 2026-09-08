import type { EmergencyState } from "@/types";

export const PATTERN_WINDOW_MS = 6_000;
export const PATTERN_COUNT = 3;
export const GRACE_MS = 5_000;

const idle = (): EmergencyState => ({
  phase: "idle",
  patternCount: 0,
  graceRemainingMs: 0,
});

/**
 * Isolated fail-safe: never reads the word grid or short blinks.
 * Trigger = 3 long blinks whose open timestamps fit inside the pattern window.
 * Short blinks never cancel grace or alarm.
 */
export class FailSafeService {
  private stamps: number[] = [];
  private phase: EmergencyState["phase"] = "idle";
  private graceEndsAt = 0;

  reset(): EmergencyState {
    this.stamps = [];
    this.phase = "idle";
    this.graceEndsAt = 0;
    return idle();
  }

  cancel(): EmergencyState {
    return this.reset();
  }

  collecting(): boolean {
    return this.phase === "armed" && this.stamps.length > 0;
  }

  /**
   * Grace countdown or sounding alarm — grid selection must not run.
   */
  isLatched(): boolean {
    return this.phase === "grace" || this.phase === "alarm";
  }

  /**
   * Long blink only. Short blinks must never call this.
   */
  noteLongBlink(now: number): EmergencyState {
    if (this.phase === "grace" || this.phase === "alarm") {
      return this.snapshot(now);
    }

    this.stamps.push(now);
    this.prune(now);

    if (this.stamps.length >= PATTERN_COUNT) {
      this.stamps = [];
      this.phase = "grace";
      this.graceEndsAt = now + GRACE_MS;
      return {
        phase: "grace",
        patternCount: PATTERN_COUNT,
        graceRemainingMs: GRACE_MS,
      };
    }

    this.phase = this.stamps.length > 0 ? "armed" : "idle";
    return this.snapshot(now);
  }

  tick(now: number): EmergencyState {
    if (this.phase === "alarm") return this.snapshot(now);

    if (this.phase === "grace") {
      const remaining = this.graceEndsAt - now;
      if (remaining <= 0) {
        this.phase = "alarm";
        return this.snapshot(now);
      }
      return {
        phase: "grace",
        patternCount: PATTERN_COUNT,
        graceRemainingMs: remaining,
      };
    }

    this.prune(now);
    this.phase = this.stamps.length > 0 ? "armed" : "idle";
    return this.snapshot(now);
  }

  private prune(now: number): void {
    this.stamps = this.stamps.filter((stamp) => now - stamp <= PATTERN_WINDOW_MS);
  }

  private snapshot(now: number): EmergencyState {
    if (this.phase === "grace") {
      return {
        phase: "grace",
        patternCount: PATTERN_COUNT,
        graceRemainingMs: Math.max(0, this.graceEndsAt - now),
      };
    }
    return {
      phase: this.phase,
      patternCount: this.stamps.length,
      graceRemainingMs: 0,
    };
  }
}
