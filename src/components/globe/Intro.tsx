"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";
import { useReducedMotion } from "@/hooks/useMediaQuery";
import { useAtlasStore, type Mode } from "@/store/useAtlasStore";
import ErrorBoundary from "@/components/layout/ErrorBoundary";
import type { GlobeData } from "./GlobeScene";

const GlobeScene = dynamic(() => import("./GlobeScene"), { ssr: false });

export default function Intro({ webgl }: { webgl: boolean }) {
  const setPhase = useAtlasStore((s) => s.setPhase);
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<GlobeData | null>(null);
  const [exiting, setExiting] = useState(false);
  const [globeFailed, setGlobeFailed] = useState(false);
  const [globeReady, setGlobeReady] = useState(false);
  const exitingRef = useRef(false);

  // Hold the cinematic moves until the map underneath has compiled its shaders (or
  // failed, or 4 s have passed) so the warm-up never lands mid-animation.
  const mapSettled = useAtlasStore((s) => s.mapWarm || Boolean(s.mapError));
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setTimedOut(true), 4000);
    return () => window.clearTimeout(id);
  }, []);
  const go = reduced || mapSettled || timedOut;

  useEffect(() => {
    if (!webgl) return;
    let alive = true;
    fetch("/data/globe.json")
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(String(r.status))),
      )
      .then((d: GlobeData) => alive && setData(d))
      .catch(() => alive && setGlobeFailed(true));
    return () => {
      alive = false;
    };
  }, [webgl]);

  // Typography reveal
  useEffect(() => {
    const items = textRef.current?.querySelectorAll("[data-intro]");
    if (!items || !go) return;
    if (reduced) {
      gsap.set(items, { opacity: 1, y: 0 });
      return;
    }
    const tl = gsap.timeline({ delay: 0.9 });
    tl.fromTo(
      items,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 1.3,
        ease: "power3.out",
        stagger: 0.22,
      },
    );
    return () => {
      tl.kill();
    };
  }, [reduced, go]);

  const finish = (mode: Mode, fast: boolean) => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    const s = useAtlasStore.getState();
    s.setMode(mode);
    if (mode === "story") s.setStoryIndex(0);
    setExiting(true);
    // Bring the atlas live *underneath* the intro right away, so its one-off mount cost
    // and camera flight start while the overlay still covers it; then only fade out.
    setPhase("atlas");
    const done = () => s.closeIntro();
    if (reduced) return done();
    const items = textRef.current?.querySelectorAll("[data-intro]");
    if (items)
      gsap.to(items, {
        opacity: 0,
        y: -16,
        duration: fast ? 0.25 : 0.6,
        stagger: fast ? 0 : 0.05,
        ease: "power2.in",
      });
    gsap.to(rootRef.current, {
      opacity: 0,
      duration: fast ? 0.45 : 1.1,
      delay: fast ? 0.1 : 0.9,
      ease: "power2.inOut",
      onComplete: done,
    });
  };

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 z-30 overflow-hidden bg-night"
      role="dialog"
      aria-label="Танилцуулга"
    >
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_68%_45%,rgba(40,80,120,0.22),transparent_60%)]" />

      {/* Globe */}
      <div
        className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out md:left-[30%] ${globeReady ? "opacity-100" : "opacity-0"}`}
      >
        {webgl && data && !globeFailed && (
          <ErrorBoundary fallback={null} onError={() => setGlobeFailed(true)}>
            <GlobeScene
              data={data}
              exiting={exiting}
              reduced={reduced}
              onReady={() => setGlobeReady(true)}
              go={go}
              onError={() => setGlobeFailed(true)}
            />
          </ErrorBoundary>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(8,14,23,0.92)_0%,rgba(8,14,23,0.55)_38%,transparent_65%)] max-md:bg-[linear-gradient(0deg,rgba(8,14,23,0.95)_10%,rgba(8,14,23,0.4)_55%,transparent_80%)]" />

      {/* Skip */}
      <button
        type="button"
        onClick={() => finish("explore", true)}
        className="absolute right-4 top-4 z-20 rounded-full border border-hairline px-4 py-1.5 text-[12px] tracking-wide text-muted transition hover:border-muted hover:text-ink md:right-8 md:top-7"
      >
        Алгасах
      </button>

      {/* Typography */}
      <div
        ref={textRef}
        className="pointer-events-none relative z-10 flex h-full flex-col [&_button]:pointer-events-auto justify-end px-6 pb-12 md:justify-center md:px-[7vw] md:pb-0"
      >
        <div data-intro className="eyebrow mb-6 opacity-0">
          Интерактив түүхэн атлас · Түүхийн семинар
        </div>
        <h1
          data-intro
          className="font-display text-[2.7rem] font-semibold leading-[0.92] tracking-[0.06em] text-ink opacity-0 sm:text-[4rem] lg:text-[5.6rem] xl:text-[6.4rem]"
        >
          THE EMPIRE&apos;S
          <br />
          SHADOW
        </h1>
        <p
          data-intro
          className="mt-6 max-w-xl font-display text-[1.25rem] font-medium uppercase leading-snug tracking-[0.14em] text-ink/85 opacity-0 md:text-[1.55rem]"
        >
          Японы Хятад дахь нөлөө ба түрэмгийлэл
        </p>
        <div data-intro className="mt-5 flex items-center gap-4 opacity-0">
          <span className="font-mono text-lg tracking-[0.2em] text-imperial md:text-xl">
            1894 — 1945
          </span>
          <span className="h-px w-16 bg-imperial/60" />
        </div>
        <p
          data-intro
          className="mt-6 max-w-md text-[14.5px] leading-relaxed text-muted opacity-0"
        >
          Тавин жилийн турш Японы эзэнт гүрний тэлэлт Хятадын газрын зургийг
          хэрхэн өөрчилсөн бэ? Гэрээ, төмөр зам, эзлэлтийг он цагийн дарааллаар
          газрын зураг дээр судална.
        </p>
        <div
          data-intro
          className="mt-9 flex flex-wrap items-center gap-4 opacity-0"
        >
          <button
            type="button"
            onClick={() => finish("story", false)}
            className="group inline-flex items-center gap-3 rounded-full bg-ink py-3 pl-6 pr-5 text-[15px] font-medium text-night shadow-[0_0_40px_-10px_rgba(241,235,221,0.5)] transition hover:bg-white"
            autoFocus
          >
            Түүхийг судлах
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
