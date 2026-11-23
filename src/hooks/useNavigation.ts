"use client";

import { useCallback } from "react";
import { EVENTS } from "@/data/events/events";
import { STORY } from "@/data/events/story";
import { tweenTime } from "@/lib/animation";
import { toYear } from "@/lib/time";
import { useAtlasStore } from "@/store/useAtlasStore";
import type { HistoricalEvent } from "@/types/history";

/** Small offset so the event itself is "on" when we land on its date. */
const LAND = 0.004;

/** Shared navigation actions used by the timeline, keyboard shortcuts and panels. */
export function useNavigation() {
  const goToEvent = useCallback((ev: HistoricalEvent, opts: { select?: boolean } = {}) => {
    const s = useAtlasStore.getState();
    s.setPlaying(false);
    tweenTime(toYear(ev.date) + LAND, { duration: 1.6 });
    if (s.mode === "explore") {
      if (opts.select !== false) s.select({ kind: "event", id: ev.id });
      else s.flyTo(ev.camera, 2200);
    }
  }, []);

  const stepEvent = useCallback(
    (dir: 1 | -1) => {
      const s = useAtlasStore.getState();
      if (s.mode === "story") {
        const i = Math.min(STORY.length - 1, Math.max(0, s.storyIndex + dir));
        if (i !== s.storyIndex) s.setStoryIndex(i);
        return;
      }
      const t = s.time;
      const list = dir === 1 ? EVENTS : [...EVENTS].reverse();
      const ev = list.find((e) => (dir === 1 ? toYear(e.date) > t + LAND + 1e-4 : toYear(e.date) + LAND < t - 1e-4));
      if (ev) goToEvent(ev);
    },
    [goToEvent],
  );

  return { goToEvent, stepEvent };
}
