"use client";

import { memo, useMemo } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { EVENTS } from "@/data/events/events";
import { PLACES } from "@/data/geography/places";
import { killTimeTween } from "@/lib/animation";
import { JAPANESE_HELD, latestEvent, placeState } from "@/lib/history-model";
import { TIME_MAX, TIME_MIN, formatDate, formatTimeLabel, toYear } from "@/lib/time";
import { PLAYBACK_SPEEDS, useAtlasStore } from "@/store/useAtlasStore";
import { useNavigation } from "@/hooks/useNavigation";
import type { HistoricalEvent } from "@/types/history";

const ERAS = [
  { from: "1894-07-25", to: "1895-04-17", label: "Япон-Хятадын 1-р дайн", color: "#DB4545" },
  { from: "1904-02-08", to: "1905-09-05", label: "Орос-Японы дайн", color: "#7C8DA3" },
  { from: "1914-08-23", to: "1922-12-10", label: "Шаньдуны асуудал", color: "#D9A35F" },
  { from: "1931-09-18", to: "1937-07-07", label: "Манжуурын эзлэлт", color: "#E0703F" },
  { from: "1937-07-07", to: "1945-08-15", label: "Хятад-Японы дайн", color: "#DB4545" },
];

const DECADES = [1894, 1900, 1910, 1920, 1930, 1940, 1945];
const pct = (t: number) => ((t - TIME_MIN) / (TIME_MAX - TIME_MIN)) * 100;
const EVENT_YEARS = EVENTS.map((e) => toYear(e.date));

/** Event ticks re-render only when the playhead crosses an event, not every frame. */
const EventTicks = memo(function EventTicks({
  passed,
  onPick,
}: {
  passed: number;
  onPick: (ev: HistoricalEvent) => void;
}) {
  return (
    <>
      {EVENTS.map((ev, i) => (
        <button
          key={ev.id}
          type="button"
          onClick={() => onPick(ev)}
          className="group absolute top-[18px] z-[3] -translate-x-1/2 -translate-y-1/2 p-1.5"
          style={{ left: `${pct(EVENT_YEARS[i])}%` }}
          aria-label={`${formatDate(ev.date, ev.precision)} — ${ev.title}`}
        >
          <span
            className={`block rounded-full transition ${ev.major ? "h-2.5 w-2.5" : "h-1.5 w-1.5"} ${i < passed ? "bg-ochre" : "bg-faint"} group-hover:scale-150 group-hover:bg-ink`}
          />
          <span className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-night/95 px-2 py-1 text-[11px] text-ink shadow-lg ring-1 ring-hairline group-hover:block group-focus-visible:block">
            <span className="font-mono text-ochre">{ev.date.slice(0, 4)}</span> {ev.short}
          </span>
        </button>
      ))}
    </>
  );
});

export default function Timeline() {
  const time = useAtlasStore((s) => s.time);
  const playing = useAtlasStore((s) => s.playing);
  const speed = useAtlasStore((s) => s.speed);
  const mode = useAtlasStore((s) => s.mode);
  const model = useAtlasStore((s) => s.model);
  const { goToEvent, stepEvent } = useNavigation();

  const label = formatTimeLabel(time);
  const current = latestEvent(time);
  // Recomputed once per month of timeline, not once per animation frame.
  const monthKey = Math.floor(time * 12);
  const heldCount = useMemo(() => {
    if (!model) return null;
    const t = (monthKey + 0.5) / 12;
    return PLACES.filter(
      (p) =>
        p.kind !== "site" &&
        p.tier <= 2 &&
        p.id !== "tokyo" &&
        p.id !== "shimonoseki" &&
        JAPANESE_HELD.has(placeState(p, t, model).status),
    ).length;
  }, [model, monthKey]);
  const passedCount = EVENT_YEARS.filter((y) => y <= time).length;

  const onScrub = (v: number) => {
    killTimeTween();
    const s = useAtlasStore.getState();
    if (s.playing) s.setPlaying(false);
    if (s.mode === "story") s.setStoryAutoplay(false);
    s.setTime(v);
  };

  const togglePlay = () => {
    const s = useAtlasStore.getState();
    if (s.mode === "story") {
      s.setStoryAutoplay(!s.storyAutoplay);
      return;
    }
    if (!s.playing && s.time >= TIME_MAX - 0.01) s.setTime(TIME_MIN);
    s.setPlaying(!s.playing);
  };
  const storyAutoplay = useAtlasStore((s) => s.storyAutoplay);
  const isPlaying = mode === "story" ? storyAutoplay : playing;

  return (
    <section
      aria-label="Он цагийн хэлхээс"
      className="panel pointer-events-auto rounded-xl px-4 pb-3 pt-3 md:px-6 md:pb-4"
    >
      <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
        {/* Current date */}
        <div className="flex min-w-[9.5rem] items-baseline gap-3" aria-live="polite">
          <span className="font-mono text-[2.1rem] leading-none tracking-tight text-ink md:text-[2.6rem]">{label.year}</span>
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">{label.month}</span>
        </div>

        {/* Caption */}
        <div className="hidden min-w-0 flex-1 md:block">
          {current && (
            <button
              type="button"
              onClick={() => goToEvent(current)}
              className="group block max-w-full truncate text-left"
              title="Үйл явдлыг нээх"
            >
              <span className="eyebrow mr-3 text-ochre">{formatDate(current.date, current.precision)}</span>
              <span className="font-display text-lg italic text-ink/90 group-hover:text-ink">{current.title}</span>
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="ml-auto flex items-center gap-1">
          {heldCount !== null && (
            <div className="mr-3 hidden text-right lg:block" title="Тухайн үед Японы хяналтад байсан гол хотуудын тоо (энэ атлас дахь)">
              <div className="font-mono text-lg leading-none text-imperial">{heldCount}</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-faint">хяналтад буй хот</div>
            </div>
          )}
          <button type="button" className="btn-icon" onClick={() => stepEvent(-1)} aria-label={mode === "story" ? "Өмнөх бүлэг" : "Өмнөх үйл явдал"}>
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink text-night transition hover:bg-white"
            aria-label={isPlaying ? "Түр зогсоох" : "Тоглуулах"}
          >
            {isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" className="translate-x-[1px]" />}
          </button>
          <button type="button" className="btn-icon" onClick={() => stepEvent(1)} aria-label={mode === "story" ? "Дараагийн бүлэг" : "Дараагийн үйл явдал"}>
            <ChevronRight size={18} />
          </button>
          {mode === "explore" && (
            <div className="ml-2 flex rounded-lg border border-hairline p-0.5" role="group" aria-label="Тоглуулах хурд">
              {PLAYBACK_SPEEDS.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  aria-pressed={speed === sp}
                  onClick={() => useAtlasStore.getState().setSpeed(sp)}
                  className={`rounded-md px-2 py-1 font-mono text-[11px] transition ${speed === sp ? "bg-surface-2 text-ink" : "text-faint hover:text-muted"}`}
                >
                  {sp}×
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Track */}
      <div className="relative mt-2 select-none">
        {/* Era bands */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px]">
          {ERAS.map((e) => (
            <div
              key={e.from}
              className="absolute top-0 h-full rounded-full"
              style={{ left: `${pct(toYear(e.from))}%`, width: `${pct(toYear(e.to)) - pct(toYear(e.from))}%`, background: e.color, opacity: 0.85 }}
              title={e.label}
            />
          ))}
        </div>
        {/* Baseline + progress */}
        <div className="pointer-events-none absolute inset-x-0 top-[18px] h-px bg-hairline" />
        <div
          className="pointer-events-none absolute left-0 top-[17px] h-[3px] rounded-full bg-gradient-to-r from-ochre/10 via-ochre/50 to-imperial"
          style={{ width: `${pct(time)}%` }}
        />
        {/* Event markers */}
        <EventTicks passed={passedCount} onPick={goToEvent} />
        <input
          type="range"
          className="timeline-range"
          min={TIME_MIN}
          max={TIME_MAX}
          step={1 / 365}
          value={time}
          onChange={(e) => onScrub(Number(e.target.value))}
          aria-label="Он сонгох"
          aria-valuetext={`${label.year} оны ${label.month}`}
        />
        {/* Decade ticks */}
        <div className="pointer-events-none relative mt-0.5 h-4">
          {DECADES.map((y) => (
            <span
              key={y}
              className="absolute -translate-x-1/2 font-mono text-[10px] text-faint"
              style={{ left: `${pct(y === 1945 ? 1945.5 : y)}%` }}
            >
              {y}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
