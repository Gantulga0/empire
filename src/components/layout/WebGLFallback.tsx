import { EVENTS } from "@/data/events/events";
import { formatDate } from "@/lib/time";

/** Text-only chronology shown when WebGL (map + globe) is unavailable. */
export default function WebGLFallback({ reason }: { reason?: string }) {
  return (
    <main className="scroll-thin h-full overflow-y-auto bg-night px-5 py-10 md:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="eyebrow">The Empire&apos;s Shadow</div>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink md:text-5xl">Японы Хятад дахь нөлөө ба түрэмгийлэл</h1>
        <p className="mt-1 font-mono text-ochre">1894 — 1945</p>
        <div className="mt-6 rounded-xl border border-imperial/40 bg-imperial/10 p-4 text-[14px] leading-relaxed text-ink/90">
          Таны хөтөч эсвэл төхөөрөмж WebGL график дэмжихгүй байгаа тул интерактив газрын зураг ачаалагдсангүй. Доорх он
          цагийн жагсаалтаар үзнэ үү, эсвэл техник хангамжийн хурдасгуурыг идэвхжүүлсэн өөр хөтөч ашиглана уу.
          {reason && <div className="mt-2 font-mono text-[11px] text-faint">{reason}</div>}
        </div>
        <ol className="mt-8 space-y-6 border-l border-hairline pl-6">
          {EVENTS.map((ev) => (
            <li key={ev.id}>
              <div className="font-mono text-xs text-ochre">{formatDate(ev.date, ev.precision)}</div>
              <h2 className="font-display text-2xl font-semibold text-ink">{ev.title}</h2>
              <p className="mt-1 text-[14px] leading-relaxed text-ink/80">{ev.summary}</p>
              <p className="mt-1 text-[13px] italic text-muted">{ev.significance}</p>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
