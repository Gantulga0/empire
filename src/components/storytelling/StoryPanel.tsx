"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { EVENT_BY_ID } from "@/data/events/events";
import { STORY } from "@/data/events/story";
import { revealChildren } from "@/lib/animation";
import { formatDate } from "@/lib/time";
import { useAtlasStore } from "@/store/useAtlasStore";
import SourceList from "@/components/layout/SourceList";

export default function StoryPanel() {
  const index = useAtlasStore((s) => s.storyIndex);
  const autoplay = useAtlasStore((s) => s.storyAutoplay);
  const setIndex = useAtlasStore((s) => s.setStoryIndex);
  const setAutoplay = useAtlasStore((s) => s.setStoryAutoplay);
  const [collapsed, setCollapsed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const ch = STORY[index];
  const ev = ch ? EVENT_BY_ID[ch.eventId] : undefined;

  useEffect(() => {
    revealChildren(ref.current);
    ref.current?.scrollTo({ top: 0 });
  }, [index]);

  if (!ch || !ev) return null;
  const n = String(index + 1).padStart(2, "0");
  const total = String(STORY.length).padStart(2, "0");

  return (
    <aside
      aria-label="Түүхэн аялал"
      aria-live="polite"
      className="panel pointer-events-auto flex max-h-full w-full flex-col overflow-hidden rounded-xl md:w-[440px] xl:w-[470px]"
    >
      {/* Progress */}
      <div className="flex gap-1 px-5 pt-4" role="tablist" aria-label="Бүлгүүд">
        {STORY.map((c, i) => (
          <button
            key={c.eventId}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`${i + 1}. ${EVENT_BY_ID[c.eventId]?.title}`}
            onClick={() => setIndex(i)}
            className="group h-3 flex-1 py-1"
          >
            <span
              className={`block h-[3px] rounded-full transition-colors ${i < index ? "bg-ochre/70" : i === index ? "bg-ink" : "bg-faint/35 group-hover:bg-faint"}`}
            />
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between px-5 pt-3">
        <span className="eyebrow">
          Түүхэн аялал · <span className="text-ink">{n}</span> / {total}
        </span>
        <button
          type="button"
          className="btn-icon md:hidden"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Дэлгэх" : "Хураах"}
        >
          <ChevronDown size={16} className={`transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div ref={ref} key={index} className={`scroll-thin flex-1 overflow-y-auto px-5 pb-4 pt-2 ${collapsed ? "hidden md:block" : ""}`}>
        <div data-reveal className="font-mono text-sm tracking-wide text-ochre">
          {formatDate(ev.date, ev.precision)}
          {ev.endDate && ` – ${formatDate(ev.endDate)}`}
        </div>
        <h2 data-reveal className="mt-1.5 font-display text-[2.1rem] font-semibold leading-[1.04] text-ink md:text-[2.5rem]">
          {ev.title}
        </h2>
        <p data-reveal className="mt-4 text-[15px] leading-relaxed text-ink/85 md:text-[15.5px]">
          {ev.summary}
        </p>
        <div data-reveal className="mt-5 border-l-2 border-imperial/70 pl-4">
          <div className="eyebrow mb-1 !text-imperial">Яагаад чухал вэ?</div>
          <p className="font-display text-[1.15rem] italic leading-snug text-ink/90">{ev.significance}</p>
        </div>
        {ev.context && (
          <p data-reveal className="mt-4 text-[12.5px] leading-relaxed text-muted">
            {ev.context}
          </p>
        )}
        <div className="mt-5">
          <SourceList ids={ev.sourceIds} />
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-hairline px-4 py-3">
        <button
          type="button"
          className="btn-icon"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
          aria-label="Өмнөх бүлэг"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => setAutoplay(!autoplay)}
          aria-pressed={autoplay}
          className="inline-flex items-center gap-2 rounded-lg border border-hairline px-3 py-1.5 text-[12px] text-muted transition hover:text-ink"
        >
          {autoplay ? <Pause size={13} /> : <Play size={13} />}
          {autoplay ? "Автомат: асаалттай" : "Автоматаар тоглуулах"}
        </button>
        <button
          type="button"
          onClick={() => (index < STORY.length - 1 ? setIndex(index + 1) : useAtlasStore.getState().setMode("explore"))}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-night transition hover:bg-white"
        >
          {index < STORY.length - 1 ? "Дараагийнх" : "Чөлөөтэй судлах"}
          <ChevronRight size={15} />
        </button>
      </div>
    </aside>
  );
}
