"use client";

import { useEffect } from "react";
import { useAtlasStore } from "@/store/useAtlasStore";
import { killTimeTween } from "@/lib/animation";
import { TIME_MAX } from "@/lib/time";

/** Years advanced per second at 1× speed. */
export const BASE_RATE = 0.75;

/** Advances the timeline while `playing` is true. */
export function usePlayback() {
  const playing = useAtlasStore((s) => s.playing);

  useEffect(() => {
    if (!playing) return;
    killTimeTween();
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const s = useAtlasStore.getState();
      const next = s.time + dt * BASE_RATE * s.speed;
      if (next >= TIME_MAX) {
        s.setTime(TIME_MAX);
        s.setPlaying(false);
        return;
      }
      s.setTime(next);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
}
