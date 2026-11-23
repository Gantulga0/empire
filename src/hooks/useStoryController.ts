"use client";

import { useEffect } from "react";
import { STORY } from "@/data/events/story";
import { killTimeTween, prefersReducedMotion, tweenTime } from "@/lib/animation";
import { toYear } from "@/lib/time";
import { useAtlasStore } from "@/store/useAtlasStore";

/** Seconds a chapter stays on screen during autoplay (after its animation). */
const AUTOPLAY_HOLD = 9;
export const CHAPTER_ANIM = 3.4;

/**
 * Drives Story mode: on every chapter change, fly the camera and animate the
 * timeline across the chapter's period so the map changes happen in order.
 */
export function useStoryController() {
  const mode = useAtlasStore((s) => s.mode);
  const index = useAtlasStore((s) => s.storyIndex);
  const autoplay = useAtlasStore((s) => s.storyAutoplay);
  const phase = useAtlasStore((s) => s.phase);
  const mapReady = useAtlasStore((s) => s.mapReady);

  useEffect(() => {
    if (mode !== "story" || phase !== "atlas" || !mapReady) return;
    const ch = STORY[index];
    if (!ch) return;
    const s = useAtlasStore.getState();
    s.setPlaying(false);
    s.select(null);
    s.flyTo(ch.camera, 3200);
    tweenTime(toYear(ch.time), { from: ch.timeFrom ? toYear(ch.timeFrom) : undefined, duration: CHAPTER_ANIM });
    return () => killTimeTween();
  }, [mode, index, phase, mapReady]);

  useEffect(() => {
    if (mode !== "story" || !autoplay) return;
    const hold = (prefersReducedMotion() ? 0 : CHAPTER_ANIM) + AUTOPLAY_HOLD;
    const id = window.setTimeout(() => {
      const s = useAtlasStore.getState();
      if (s.storyIndex < STORY.length - 1) s.setStoryIndex(s.storyIndex + 1);
      else s.setStoryAutoplay(false);
    }, hold * 1000);
    return () => window.clearTimeout(id);
  }, [mode, autoplay, index]);
}
