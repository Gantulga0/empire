"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ArrowRight, Clock, MapPin, X } from "lucide-react";
import { EVENT_BY_ID } from "@/data/events/events";
import { PLACE_BY_ID } from "@/data/geography/places";
import { REGIMES } from "@/data/historical/regimes";
import { CATEGORY_META, TERRITORY_INFO } from "@/data/historical/territories";
import { revealChildren } from "@/lib/animation";
import { STATUS_LABEL, eventsAt, placeState, type PlaceStatus } from "@/lib/history-model";
import { formatDate, isActive } from "@/lib/time";
import { useNavigation } from "@/hooks/useNavigation";
import { useAtlasStore } from "@/store/useAtlasStore";
import SourceList from "./SourceList";

const STATUS_COLOR: Record<PlaceStatus, string> = {
  japan: "#DB4545",
  colony: "#DB4545",
  leased: "#58B6CE",
  puppet: "#E0703F",
  occupied: "#DB4545",
  protectorate: "#D9A35F",
  sphere: "#D9A35F",
  foreign: "#7C8DA3",
  free: "#9AA8B9",
};

function Badge({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 40%, transparent)` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {children}
    </span>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div data-reveal>
      <div className="eyebrow mb-1 !text-ochre">{title}</div>
      <div className="text-[13.5px] leading-relaxed text-ink/85">{children}</div>
    </div>
  );
}

function PlaceBody({ id }: { id: string }) {
  const p = PLACE_BY_ID[id];
  // Select primitives so the panel re-renders only when the status actually changes.
  const year = useAtlasStore((s) => Math.floor(s.time));
  const status = useAtlasStore((s) => (s.model && PLACE_BY_ID[id] ? placeState(PLACE_BY_ID[id], s.time, s.model).status : null));
  const territoryId = useAtlasStore((s) =>
    s.model && PLACE_BY_ID[id] ? (placeState(PLACE_BY_ID[id], s.time, s.model).territoryId ?? null) : null,
  );
  const select = useAtlasStore((s) => s.select);
  const { goToEvent } = useNavigation();
  if (!p) return null;
  const st = status ? { status, territoryId } : null;
  const events = eventsAt(id);
  const yr = String(year);

  return (
    <>
      <header data-reveal>
        <div className="eyebrow mb-2 flex items-center gap-1.5">
          <MapPin size={11} /> {p.kind === "site" ? "Түүхэн газар" : p.kind === "capital" ? "Нийслэл / засгийн суудал" : "Хот"}
        </div>
        <h2 className="font-display text-[2rem] font-semibold leading-[1.05] text-ink">{p.name}</h2>
        {p.alt && <p className="mt-1 font-display text-lg italic text-muted">{p.alt}</p>}
      </header>
      {st && (
        <div data-reveal className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-faint">{yr} онд:</span>
          <Badge color={STATUS_COLOR[st.status]}>{STATUS_LABEL[st.status]}</Badge>
          {st.territoryId && TERRITORY_INFO[st.territoryId] && (
            <button type="button" onClick={() => select({ kind: "territory", id: st.territoryId! })} className="text-[11px] text-muted underline underline-offset-2 hover:text-ink">
              {TERRITORY_INFO[st.territoryId].name}
            </button>
          )}
        </div>
      )}
      {p.note && <p data-reveal className="text-[14px] leading-relaxed text-ink/85">{p.note}</p>}
      {p.occupations?.length ? (
        <Block title="Японы цэргийн эзлэлт">
          <ul className="space-y-1">
            {p.occupations.map((o) => (
              <li key={o.from} className="flex gap-2">
                <span className="font-mono text-[12px] text-imperial">
                  {formatDate(o.from, o.precision)} – {o.to && o.to !== "1945-08-15" ? formatDate(o.to, "day") : "1945"}
                </span>
                {o.note && <span className="text-[12px] text-muted">{o.note}</span>}
              </li>
            ))}
          </ul>
        </Block>
      ) : null}
      {p.port && (
        <Block title="Боомт">
          <span className="text-rail">{p.port.label}</span>
        </Block>
      )}
      {events.length > 0 && (
        <div data-reveal>
          <div className="eyebrow mb-1.5 !text-ochre">Холбогдох үйл явдал</div>
          <ul className="space-y-1">
            {events.map((ev) => (
              <li key={ev.id}>
                <button
                  type="button"
                  onClick={() => goToEvent(ev)}
                  className="group flex w-full items-baseline gap-3 rounded-md px-2 py-1.5 text-left hover:bg-white/[0.04]"
                >
                  <span className="font-mono text-[11px] text-ochre">{ev.date.slice(0, 4)}</span>
                  <span className="flex-1 text-[13px] text-ink/90 group-hover:text-ink">{ev.title}</span>
                  <ArrowRight size={13} className="text-faint group-hover:text-ink" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <SourceList ids={["geonames", ...new Set(events.flatMap((e) => e.sourceIds))].slice(0, 5)} />
      {p.approximate && <p className="text-[11px] italic text-faint">Байршил ойролцоо.</p>}
    </>
  );
}

function TerritoryBody({ id }: { id: string }) {
  const info = TERRITORY_INFO[id];
  const terr = useAtlasStore((s) => s.model?.territoryById[id]);
  if (!info || !terr) return null;
  const meta = CATEGORY_META[terr.properties.category];
  return (
    <>
      <header data-reveal>
        <div className="eyebrow mb-2">Нутаг дэвсгэр</div>
        <h2 className="font-display text-[2rem] font-semibold leading-[1.05] text-ink">{info.name}</h2>
      </header>
      <div data-reveal className="flex flex-wrap items-center gap-2">
        <Badge color={meta.color}>{meta.label}</Badge>
        <span className="font-mono text-[11px] text-faint">
          {formatDate(terr.properties.start)} – {terr.properties.end >= "1946" ? "…" : formatDate(terr.properties.end)}
        </span>
      </div>
      <Block title="Эрх зүйн байдал">{info.status}</Block>
      <p data-reveal className="text-[14px] leading-relaxed text-ink/85">{info.summary}</p>
      <Block title="Энэ төрөл юу гэсэн үг вэ?">
        <span className="text-muted">{meta.definition}</span>
      </Block>
      <div data-reveal className="rounded-lg border border-hairline bg-white/[0.02] p-3 text-[11.5px] leading-relaxed text-faint">
        <span className="font-medium text-muted">{terr.properties.approximate ? "Хил ойролцоо. " : "Газарзүйн хувьд нарийвчлалтай. "}</span>
        {terr.properties.method}
      </div>
      <SourceList ids={[...info.sourceIds, "natural-earth"]} />
    </>
  );
}

function EventBody({ id }: { id: string }) {
  const ev = EVENT_BY_ID[id];
  const select = useAtlasStore((s) => s.select);
  const { goToEvent } = useNavigation();
  if (!ev) return null;
  return (
    <>
      <header data-reveal>
        <div className="eyebrow mb-2 flex items-center gap-1.5 !text-ochre">
          <Clock size={11} /> {formatDate(ev.date, ev.precision)}
          {ev.endDate && <> – {formatDate(ev.endDate)}</>}
        </div>
        <h2 className="font-display text-[2rem] font-semibold leading-[1.05] text-ink">{ev.title}</h2>
      </header>
      <p data-reveal className="text-[14px] leading-relaxed text-ink/85">{ev.summary}</p>
      <Block title="Яагаад чухал вэ?">{ev.significance}</Block>
      {ev.context && <Block title="Холбогдох нөхцөл">{ev.context}</Block>}
      <div data-reveal className="flex flex-wrap gap-1.5">
        {ev.placeIds.map((pid) => (
          <button
            key={pid}
            type="button"
            onClick={() => select({ kind: "place", id: pid })}
            className="inline-flex items-center gap-1 rounded-full border border-hairline px-2.5 py-1 text-[12px] text-muted hover:border-muted hover:text-ink"
          >
            <MapPin size={11} /> {PLACE_BY_ID[pid]?.name ?? pid}
          </button>
        ))}
      </div>
      <div data-reveal>
        <button
          type="button"
          onClick={() => goToEvent(ev, { select: false })}
          className="inline-flex items-center gap-2 rounded-lg bg-ink/95 px-3.5 py-2 text-[13px] font-medium text-night transition hover:bg-white"
        >
          Газрын зураг дээр харах <ArrowRight size={14} />
        </button>
      </div>
      <SourceList ids={ev.sourceIds} />
    </>
  );
}

function RegimeBody({ id }: { id: string }) {
  const r = REGIMES.find((x) => x.id === id);
  const select = useAtlasStore((s) => s.select);
  const active = useAtlasStore((s) => (r ? isActive(s.time, r.from, r.to) : false));
  if (!r) return null;
  return (
    <>
      <header data-reveal>
        <div className="eyebrow mb-2">Хүүхэлдэй засаг</div>
        <h2 className="font-display text-[1.8rem] font-semibold leading-[1.08] text-ink">{r.name}</h2>
      </header>
      <div data-reveal className="flex flex-wrap items-center gap-2">
        <Badge color="#E0703F">{active ? "Тухайн үед үйл ажиллагаатай" : "Тухайн үед байгаагүй"}</Badge>
        <span className="font-mono text-[11px] text-faint">
          {formatDate(r.from)} – {formatDate(r.to)}
        </span>
      </div>
      <p data-reveal className="text-[14px] leading-relaxed text-ink/85">{r.summary}</p>
      <div data-reveal>
        <button
          type="button"
          onClick={() => select({ kind: "place", id: r.seatPlaceId })}
          className="inline-flex items-center gap-1 rounded-full border border-hairline px-2.5 py-1 text-[12px] text-muted hover:text-ink"
        >
          <MapPin size={11} /> Суудал: {PLACE_BY_ID[r.seatPlaceId]?.name}
        </button>
      </div>
      <SourceList ids={r.sourceIds} />
    </>
  );
}

export default function InfoPanel() {
  const selection = useAtlasStore((s) => s.selection);
  const select = useAtlasStore((s) => s.select);
  const ref = useRef<HTMLDivElement>(null);
  const key = selection ? `${selection.kind}:${selection.id}` : "";

  useEffect(() => {
    if (key) {
      revealChildren(ref.current);
      ref.current?.scrollTo({ top: 0 });
    }
  }, [key]);

  if (!selection) return null;

  return (
    <aside
      aria-label="Дэлгэрэнгүй мэдээлэл"
      className="panel animate-fade-up pointer-events-auto relative flex max-h-full w-full flex-col overflow-hidden rounded-xl md:w-[380px]"
    >
      <button
        type="button"
        onClick={() => select(null)}
        className="btn-icon absolute right-2 top-2 z-10"
        aria-label="Хаах (Esc)"
      >
        <X size={16} />
      </button>
      <div ref={ref} key={key} className="scroll-thin flex-1 space-y-4 overflow-y-auto p-5 pr-6">
        {selection.kind === "place" && <PlaceBody id={selection.id} />}
        {selection.kind === "territory" && <TerritoryBody id={selection.id} />}
        {selection.kind === "event" && <EventBody id={selection.id} />}
        {selection.kind === "regime" && <RegimeBody id={selection.id} />}
      </div>
    </aside>
  );
}
