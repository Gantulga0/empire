import { BookOpen } from "lucide-react";
import { SOURCE_BY_ID } from "@/data/historical/sources";

export default function SourceList({ ids }: { ids: string[] }) {
  const sources = ids.map((id) => SOURCE_BY_ID[id]).filter(Boolean);
  if (!sources.length) return null;
  return (
    <div className="border-t border-hairline pt-3" data-reveal>
      <div className="eyebrow mb-1.5 flex items-center gap-1.5">
        <BookOpen size={11} /> Эх сурвалж
      </div>
      <ul className="space-y-1">
        {sources.map((s) => (
          <li key={s.id} className="text-[11.5px] leading-snug text-faint">
            {s.url ? (
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline decoration-hairline underline-offset-2 hover:text-muted">
                {s.citation}
              </a>
            ) : (
              s.citation
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
