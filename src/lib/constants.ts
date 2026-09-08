/** Grid dwell: 5–8s thinking time (neurology: 5–10s reaction lag). */
export const SCAN_MS_MIN = 5_000;
export const SCAN_MS_MAX = 8_000;
export const SCAN_MS_DEFAULT = 6_000;
export const SCAN_MS_STEP = 1_000;

/** Resting-face noise window before any trigger is armed. */
export const BASELINE_MS = 5_000;
export const BASELINE_MIN_SAMPLES = 40;

/** Masseter select: brief clench, below SOS hold. Ignore blink-sized twitches. */
export const JAW_SELECT_MIN_MS = 400;
export const JAW_SOS_HOLD_MS = 4_000;

/** Rest: eyelids shut vs personal open-eye baseline, held continuously. */
export const SLEEP_EYES_CLOSED_MS = 5_000;
export const SLEEP_SHUT_RATIO = 0.58;
export const SLEEP_SCALED_SHUT = 0.18;
export const WAKE_HOLD_MS = 3_000;

/** Ignore single missed mesh frames so scan/UI do not stall. */
export const FACE_LOST_MS = 450;

export const METRIC_THROTTLE_MS = 80;
export const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: "user",
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 30, max: 60 },
  },
};
