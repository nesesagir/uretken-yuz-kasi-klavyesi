"use client";

import { useCallback, useEffect, useState } from "react";

export function useSessionKiosk(active: boolean) {
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!active) return;

    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    async function armWake() {
      if (cancelled || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {
        /* unsupported or denied */
      }
    }

    void armWake();

    function onVisibility() {
      if (document.visibilityState === "visible") void armWake();
    }
    function onUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    function onFs() {
      setFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onUnload);
    document.addEventListener("fullscreenchange", onFs);
    onFs();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onUnload);
      document.removeEventListener("fullscreenchange", onFs);
      void lock?.release();
    };
  }, [active]);

  const enterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      /* ignored */
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      /* ignored */
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) await exitFullscreen();
    else await enterFullscreen();
  }, [enterFullscreen, exitFullscreen]);

  return { fullscreen, enterFullscreen, exitFullscreen, toggleFullscreen };
}
