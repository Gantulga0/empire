"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { SOURCES } from "@/data/historical/sources";
import { useAtlasStore } from "@/store/useAtlasStore";

const KIND_LABEL = {
  primary: "Анхдагч эх сурвалж (гэрээ, баримт бичиг)",
  scholarly: "Эрдэм шинжилгээний бүтээл",
  reference: "Лавлах",
  dataset: "Геоөгөгдөл",
} as const;

const LIMITATIONS = [
  "Колони, түрээсийн нутгийн хил нь эрэг хавийн шугам (Natural Earth) болон гэрээнд заасан цэгүүдээр тодорхойлогдсон. Ляодун (1895), Квантун, Жяожоу, Манж Го-гийн баруун хил ойролцоо бөгөөд тасархай хүрээгээр тэмдэглэв.",
  "Нөлөөллийн бүс нь хилтэй байгаагүй тул орчин үеийн мужийн хилээр (Шаньдун, Фүжянь, Ляонин+Жилинь) ойролцоогоор харуулав.",
  "1937–1945 оны Японы эзлэлт ихэнхдээ хот, төмөр замыг хамарсан («цэг ба шугам»), хөдөө нутагт партизаны хүчин идэвхтэй байсан. Иймээс таамаг полигон зураагүй — эзлэгдсэн хотуудыг баримтжсан огноогоор, төмөр замыг хоёр төгсгөл нь эзлэгдсэн үед Японы хяналтад гэж харуулав.",
  "Төмөр замууд нь баримтжсан өртөөнүүдийг шулуунаар холбосон схем бөгөөд бодит замын трасс биш.",
  "Цэргийн давшилтын сум нь баримтжсан тулалдаан/эзлэлтийн газруудыг он цагийн дарааллаар холбосон чиглэл. Ангиудын бодит маршрутыг илэрхийлэхгүй.",
  "Зарим огноо (сарын нарийвчлалтай гэж тэмдэглэсэн) нь эх сурвалжуудад зөрүүтэй байдаг.",
  "Хотын координат нь орчин үеийн хотын төвөөр (GeoNames) өгөгдсөн.",
  "Орчин үеийн хил (тасархай саарал) нь зөвхөн газарзүйн лавлагаа бөгөөд түүхэн хил биш.",
];

export default function SourcesDialog() {
  const open = useAtlasStore((s) => s.sourcesOpen);
  const setOpen = useAtlasStore((s) => s.setSourcesOpen);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  if (!open) return null;
  const groups = (Object.keys(KIND_LABEL) as (keyof typeof KIND_LABEL)[]).map((k) => ({
    k,
    items: SOURCES.filter((s) => s.kind === k),
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-8" role="dialog" aria-modal="true" aria-labelledby="sources-title">
      <button type="button" className="absolute inset-0 bg-night/85" aria-label="Хаах" onClick={() => setOpen(false)} />
      <div className="panel animate-fade-up relative flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl">
        <div className="flex items-start justify-between border-b border-hairline px-6 py-5">
          <div>
            <div className="eyebrow mb-1">Арга зүй</div>
            <h2 id="sources-title" className="font-display text-3xl font-semibold text-ink">
              Эх сурвалж ба өгөгдлийн хязгаарлалт
            </h2>
          </div>
          <button ref={closeRef} type="button" className="btn-icon" onClick={() => setOpen(false)} aria-label="Хаах">
            <X size={18} />
          </button>
        </div>
        <div className="scroll-thin space-y-7 overflow-y-auto px-6 py-6">
          <section>
            <h3 className="eyebrow mb-3 !text-imperial">Өгөгдлийн хязгаарлалт</h3>
            <ul className="space-y-2">
              {LIMITATIONS.map((l) => (
                <li key={l} className="flex gap-3 text-[13.5px] leading-relaxed text-ink/85">
                  <span className="mt-2 h-1 w-1 flex-none rounded-full bg-imperial" />
                  {l}
                </li>
              ))}
            </ul>
          </section>
          {groups.map(({ k, items }) => (
            <section key={k}>
              <h3 className="eyebrow mb-3 !text-ochre">{KIND_LABEL[k]}</h3>
              <ul className="space-y-2.5">
                {items.map((s) => (
                  <li key={s.id} className="text-[13px] leading-relaxed text-ink/85">
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline decoration-hairline underline-offset-2 hover:decoration-muted">
                        {s.citation}
                      </a>
                    ) : (
                      s.citation
                    )}
                    {s.note && <div className="text-[12px] text-faint">{s.note}</div>}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <section className="border-t border-hairline pt-5 text-[12px] leading-relaxed text-faint">
            Газрын зургийн хөдөлгүүр: MapLibre GL JS (BSD-3). Танилцуулгын бөмбөрцөг: Three.js / React Three Fiber.
            Natural Earth өгөгдөл нийтийн эзэмшилд. GeoNames — CC BY 4.0. Рельеф: Terrain Tiles (Mapzen, AWS Open Data).
          </section>
        </div>
      </div>
    </div>
  );
}
