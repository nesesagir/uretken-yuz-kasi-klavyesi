export type LiveAlert = {
  kind: "sos" | "alarm";
  text: string;
  at: number;
};

const TTL_MS = 90_000;

type LiveAlertSlot = {
  last: LiveAlert | null;
};

const slot: LiveAlertSlot = (() => {
  const globalRef = globalThis as typeof globalThis & { __uykkLiveAlert?: LiveAlertSlot };
  if (!globalRef.__uykkLiveAlert) {
    globalRef.__uykkLiveAlert = { last: null };
  }
  return globalRef.__uykkLiveAlert;
})();

export function setLiveAlert(kind: "sos" | "alarm", text: string): void {
  slot.last = { kind, text, at: Date.now() };
}

export function getLiveAlert(): LiveAlert | null {
  const last = slot.last;
  if (!last) return null;
  if (Date.now() - last.at > TTL_MS) {
    slot.last = null;
    return null;
  }
  return last;
}
