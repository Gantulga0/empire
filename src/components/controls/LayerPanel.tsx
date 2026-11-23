"use client";

import type { CSSProperties } from "react";
import { Layers, X } from "lucide-react";
import { useAtlasStore } from "@/store/useAtlasStore";
import type { BaseLayerKey, LayerKey } from "@/types/history";
import "./LayerPanel.css";

interface LayerDef {
  key: LayerKey;
  label: string;
  hint: string;
  swatch: string;
  color: string;
}

export const LAYER_DEFS: LayerDef[] = [
  { key: "colony", label: "Колони нутаг", hint: "Тайвань, Солонгос, Өмнөд Сахалин — албан ёсоор нэгтгэсэн", swatch: "solid", color: "#DB4545" },
  { key: "occupied", label: "Эзэлсэн нутаг", hint: "Цэргийн эзлэлтэд орсон хот ба бүс", swatch: "glow", color: "#DB4545" },
  { key: "puppet", label: "Хүүхэлдэй улс", hint: "Манж Го ба хүүхэлдэй засгуудын суудал", swatch: "hatch", color: "#E0703F" },
  { key: "sphere", label: "Нөлөөллийн бүс", hint: "Шаардсан онцгой эрхийн бүс, протекторат", swatch: "dots", color: "#D9A35F" },
  { key: "ports", label: "Гол боомт ба түрээс", hint: "Түрээсийн нутаг, гэрээт боомт, концесс", swatch: "cross", color: "#58B6CE" },
  { key: "railways", label: "Төмөр зам", hint: "Цэнхэр: Японы хяналтад · Саарал: бусад", swatch: "rail", color: "#58B6CE" },
  { key: "events", label: "Үйл явдал", hint: "Тухайн үеийн үйл явдал лугшиж харагдана", swatch: "pulse", color: "#D9A35F" },
  { key: "advances", label: "Цэргийн давшилт", hint: "Схемчилсэн чиглэл, баримтжсан хотуудаар", swatch: "arrow", color: "#E85A5A" },
];

const BASE_DEFS: { key: BaseLayerKey; label: string }[] = [
  { key: "relief", label: "Гадаргын рельеф" },
  { key: "rivers", label: "Гол мөрөн" },
  { key: "modernBorders", label: "Орчин үеийн хил (лавлагаа)" },
  { key: "labels", label: "Нэрс" },
];

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex h-4 w-7 flex-none items-center rounded-full transition ${on ? "bg-ochre/80" : "bg-faint/40"}`}
    >
      <span className={`absolute h-3 w-3 rounded-full bg-night transition-transform ${on ? "translate-x-[14px]" : "translate-x-[2px]"}`} />
    </span>
  );
}

export function LayerList({ compact = false }: { compact?: boolean }) {
  const layers = useAtlasStore((s) => s.layers);
  const base = useAtlasStore((s) => s.baseLayers);
  const toggle = useAtlasStore((s) => s.toggleLayer);
  const toggleBase = useAtlasStore((s) => s.toggleBaseLayer);

  return (
    <div className="space-y-4">
      <ul className="space-y-0.5">
        {LAYER_DEFS.map((d) => (
          <li key={d.key}>
            <button
              type="button"
              role="switch"
              aria-checked={layers[d.key]}
              onClick={() => toggle(d.key)}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/[0.04] focus-visible:bg-white/[0.04] lg:py-1"
            >
              <span className={`swatch swatch--${d.swatch}`} style={{ "--c": d.color } as CSSProperties} />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-ink">{d.label}</span>
                {!compact && <span className="layer-panel-hint block text-[11px] leading-snug text-muted">{d.hint}</span>}
              </span>
              <Toggle on={layers[d.key]} />
            </button>
          </li>
        ))}
      </ul>
      <div>
        <div className="eyebrow mb-1.5 px-2">Суурь зураг</div>
        <ul className="grid grid-cols-2 gap-x-2">
          {BASE_DEFS.map((d) => (
            <li key={d.key}>
              <button
                type="button"
                role="switch"
                aria-checked={base[d.key]}
                onClick={() => toggleBase(d.key)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[12px] text-muted transition hover:bg-white/[0.04] hover:text-ink"
              >
                <Toggle on={base[d.key]} />
                <span className="min-w-0 leading-snug">{d.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <p className="border-t border-hairline px-2 pt-3 text-[11px] leading-relaxed text-muted">
        Өнгөт тасархай хүрээ нь түүхэн хилийг ойролцоогоор харуулна. Цайвар саарал тасархай шугам нь орчин үеийн хил (газарзүйн лавлагаа).
      </p>
    </div>
  );
}

/** Desktop floating panel + mobile sheet. */
export default function LayerPanel() {
  const open = useAtlasStore((s) => s.layersOpen);
  const setOpen = useAtlasStore((s) => s.setLayersOpen);

  return (
    <>
      {/* Desktop */}
      <aside
        aria-label="Газрын зургийн давхарга"
        className="layer-panel-desktop panel scroll-thin pointer-events-auto hidden min-h-0 w-[300px] overflow-y-auto rounded-xl p-3 lg:block"
      >
        <div className="mb-2 flex items-center gap-2 px-2">
          <Layers size={14} className="text-ochre" />
          <h2 className="eyebrow !text-ink">Давхарга ба тайлбар</h2>
        </div>
        <LayerList />
      </aside>

      {/* Tablet / mobile sheet */}
      {open && (
        <div className="pointer-events-auto fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Давхарга">
          <button type="button" className="absolute inset-0 bg-night/60" aria-label="Хаах" onClick={() => setOpen(false)} />
          <div className="panel animate-fade-up absolute inset-x-3 bottom-3 max-h-[75vh] overflow-y-auto rounded-2xl p-4 scroll-thin sm:left-auto sm:right-3 sm:top-16 sm:bottom-auto sm:w-[340px]">
            <div className="mb-2 flex items-center justify-between px-2">
              <h2 className="eyebrow !text-ink">Давхарга ба тайлбар</h2>
              <button type="button" className="btn-icon" onClick={() => setOpen(false)} aria-label="Хаах">
                <X size={16} />
              </button>
            </div>
            <LayerList />
          </div>
        </div>
      )}
    </>
  );
}
