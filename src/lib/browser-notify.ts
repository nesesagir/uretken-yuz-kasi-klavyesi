const CHANNEL = "uykk-emergency";

export function publishEmergency(kind: "sos" | "alarm", title: string, body: string): void {
  if (typeof window === "undefined") return;
  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage({ kind, title, body, at: Date.now() });
    channel.close();
  } catch {
    /* unsupported */
  }
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, tag: `uykk-${kind}`, requireInteraction: true });
  } catch {
    /* ignored */
  }
}

export async function requestAlertPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || typeof Notification === "undefined") return "unsupported";
  if (Notification.permission === "granted") return "granted";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function subscribeEmergency(
  onEvent: (event: { kind: "sos" | "alarm"; title: string; body: string }) => void,
): () => void {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return () => {};
  const channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = (message: MessageEvent) => {
    const data = message.data as { kind?: string; title?: string; body?: string };
    if (data.kind !== "sos" && data.kind !== "alarm") return;
    onEvent({ kind: data.kind, title: String(data.title ?? ""), body: String(data.body ?? "") });
  };
  return () => channel.close();
}
