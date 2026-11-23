"use client";

import { BookMarked, Compass, Layers, Maximize, Minimize, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { useAtlasStore, type Mode } from "@/store/useAtlasStore";

const MODES: { key: Mode; label: string; hint: string }[] = [
  { key: "story", label: "Түүхэн аялал", hint: "Үйл явдлаар дамжих удирдамжтай аялал" },
  { key: "explore", label: "Чөлөөтэй судлах", hint: "Он, давхарга, газруудыг өөрөө сонгох" },
];

export default function TopBar() {
  const mode = useAtlasStore((s) => s.mode);
  const setMode = useAtlasStore((s) => s.setMode);
  const setSourcesOpen = useAtlasStore((s) => s.setSourcesOpen);
  const layersOpen = useAtlasStore((s) => s.layersOpen);
  const setLayersOpen = useAtlasStore((s) => s.setLayersOpen);
  const setPhase = useAtlasStore((s) => s.setPhase);
  const [fs, setFs] = useState(false);

  useEffect(() => {
    const on = () => setFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  const toggleFs = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => undefined);
  };

  return (
    <header className="pointer-events-none flex items-start justify-between gap-3">
      {/* Brand */}
      <div className="pointer-events-auto min-w-0">
        <div className="font-display text-[1.05rem] font-semibold tracking-[0.24em] text-ink md:text-[1.2rem]">
          THE EMPIRE&apos;S SHADOW
        </div>
        <div className="mt-0.5 hidden truncate text-[11px] tracking-wide text-muted sm:block">
          Японы Хятад дахь нөлөө ба түрэмгийлэл · 1894–1945
        </div>
      </div>

      {/* Mode switch */}
      <nav
        aria-label="Горим"
        className="panel pointer-events-auto absolute left-1/2 top-3 hidden -translate-x-1/2 rounded-full p-1 md:flex"
      >
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            title={m.hint}
            aria-pressed={mode === m.key}
            onClick={() => setMode(m.key)}
            className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition ${
              mode === m.key ? "bg-ink text-night" : "text-muted hover:text-ink"
            }`}
          >
            {m.label}
          </button>
        ))}
      </nav>

      {/* Actions */}
      <div className="panel pointer-events-auto flex items-center gap-0.5 rounded-xl p-1">
        <button
          type="button"
          className="btn-icon md:!hidden"
          onClick={() => setMode(mode === "story" ? "explore" : "story")}
          aria-label={mode === "story" ? "Чөлөөтэй судлах" : "Түүхэн аялал"}
          title={mode === "story" ? "Чөлөөтэй судлах" : "Түүхэн аялал"}
        >
          <Compass size={17} />
        </button>
        <button
          type="button"
          className="btn-icon lg:!hidden"
          aria-pressed={layersOpen}
          onClick={() => setLayersOpen(!layersOpen)}
          aria-label="Давхарга"
          title="Давхарга"
        >
          <Layers size={17} />
        </button>
        <button type="button" className="btn-icon" onClick={() => setSourcesOpen(true)} aria-label="Эх сурвалж" title="Эх сурвалж">
          <BookMarked size={17} />
        </button>
        <button type="button" className="btn-icon hidden sm:inline-flex" onClick={toggleFs} aria-label="Бүтэн дэлгэц" title="Бүтэн дэлгэц (танилцуулгад)">
          {fs ? <Minimize size={17} /> : <Maximize size={17} />}
        </button>
        <button type="button" className="btn-icon" onClick={() => setPhase("intro")} aria-label="Танилцуулгыг дахин үзэх" title="Танилцуулга">
          <RotateCcw size={16} />
        </button>
      </div>
    </header>
  );
}
