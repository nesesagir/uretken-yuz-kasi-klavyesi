import { JAW_SOS_HOLD_MS } from "@/lib/constants";
import type { SosReason, SosState } from "@/types";

const idle = (): SosState => ({ active: false, reason: null });

/**
 * Vital SOS: sudden eyelid raise (panic) or prolonged masseter hold.
 * Isolated from the word grid. Does not wait for a grace countdown.
 */
export class SosService {
  private active = false;
  private reason: SosReason | null = null;
  private jawSince: number | null = null;
  private prevEyelid = 0;
  private prevEyelidAt = 0;
  private blinkQuietUntil = 0;

  reset(): SosState {
    this.active = false;
    this.reason = null;
    this.jawSince = null;
    this.prevEyelid = 0;
    this.prevEyelidAt = 0;
    this.blinkQuietUntil = 0;
    return idle();
  }

  cancel(): SosState {
    return this.reset();
  }

  noteBlink(now: number): void {
    this.blinkQuietUntil = now + 700;
  }

  clearJawHold(): void {
    this.jawSince = null;
  }

  inject(reason: SosReason): SosState {
    this.active = true;
    this.reason = reason;
    return this.snapshot();
  }

  update(input: {
    now: number;
    jaw: number;
    jawEnter: number;
    eyelid: number;
    eyelidPanic: number;
  }): SosState {
    if (this.active) return this.snapshot();

    const { now, jaw, jawEnter, eyelid, eyelidPanic } = input;

    if (jaw >= jawEnter) {
      if (this.jawSince === null) this.jawSince = now;
      else if (now - this.jawSince >= JAW_SOS_HOLD_MS) {
        this.active = true;
        this.reason = "jaw-hold";
        return this.snapshot();
      }
    } else {
      this.jawSince = null;
    }

    const dt = Math.max(1, now - (this.prevEyelidAt || now));
    const slope = (eyelid - this.prevEyelid) / dt;
    this.prevEyelid = eyelid;
    this.prevEyelidAt = now;

    if (now >= this.blinkQuietUntil && eyelid >= eyelidPanic && slope > 0.00045) {
      this.active = true;
      this.reason = "eyelid-raise";
    }

    return this.snapshot();
  }

  private snapshot(): SosState {
    return { active: this.active, reason: this.reason };
  }
}
