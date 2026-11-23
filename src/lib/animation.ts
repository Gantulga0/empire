import gsap from "gsap";
import { useAtlasStore } from "@/store/useAtlasStore";
import { clampTime } from "./time";

/**
 * Central animation helpers. All timeline-driven motion funnels through
 * `tweenTime`, so the map always renders a *real* historical state — the
 * animation only interpolates the timeline value, never fakes the content.
 */

let timeTween: gsap.core.Tween | null = null;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function killTimeTween() {
  timeTween?.kill();
  timeTween = null;
}

/** Animate the timeline value to `target` (decimal year). */
export function tweenTime(target: number, opts: { from?: number; duration?: number; onComplete?: () => void } = {}) {
  killTimeTween();
  const store = useAtlasStore.getState();
  const to = clampTime(target);
  if (opts.from !== undefined) store.setTime(opts.from);
  const proxy = { t: opts.from ?? store.time };
  const duration = prefersReducedMotion() ? 0 : (opts.duration ?? 1.4);
  if (duration === 0) {
    store.setTime(to);
    opts.onComplete?.();
    return;
  }
  timeTween = gsap.to(proxy, {
    t: to,
    duration,
    ease: "power2.inOut",
    onUpdate: () => useAtlasStore.getState().setTime(proxy.t),
    onComplete: () => {
      timeTween = null;
      opts.onComplete?.();
    },
  });
}

/** Staggered panel entrance used by info / story panels. */
export function revealChildren(root: HTMLElement | null, selector = "[data-reveal]") {
  if (!root || prefersReducedMotion()) return;
  const items = root.querySelectorAll(selector);
  gsap.fromTo(
    items,
    { opacity: 0, y: 14 },
    { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.06, overwrite: true },
  );
}
