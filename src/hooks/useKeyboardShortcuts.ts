"use client";

import { useEffect } from "react";
import { useAtlasStore } from "@/store/useAtlasStore";
import { useNavigation } from "./useNavigation";

/**
 * Space – play/pause · ←/→ – previous/next event (or chapter) · Esc – close panel.
 * Ignored while typing or when a range slider has focus (it handles arrows itself).
 */
export function useKeyboardShortcuts() {
  const { stepEvent } = useNavigation();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useAtlasStore.getState();
      if (s.phase !== "atlas") return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === " " && tag !== "BUTTON") {
        e.preventDefault();
        if (s.mode === "story") s.setStoryAutoplay(!s.storyAutoplay);
        else s.setPlaying(!s.playing);
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        stepEvent(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        stepEvent(-1);
      } else if (e.key === "Escape") {
        if (s.sourcesOpen) s.setSourcesOpen(false);
        else if (s.selection) s.select(null);
        else if (s.layersOpen) s.setLayersOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stepEvent]);
}
