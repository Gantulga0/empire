"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { detectWebGL } from "@/lib/webgl";
import { useAtlasStore } from "@/store/useAtlasStore";
import { usePlayback } from "@/hooks/usePlayback";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useStoryController } from "@/hooks/useStoryController";
import Intro from "@/components/globe/Intro";
import Timeline from "@/components/timeline/Timeline";
import LayerPanel from "@/components/controls/LayerPanel";
import MapControls from "@/components/controls/MapControls";
import StoryPanel from "@/components/storytelling/StoryPanel";
import InfoPanel from "./InfoPanel";
import SourcesDialog from "./SourcesDialog";
import TopBar from "./TopBar";
import WebGLFallback from "./WebGLFallback";

// MapLibre touches `window` on import — load it only in the browser.
const AtlasMap = dynamic(() => import("@/components/map/AtlasMap"), { ssr: false });

const noop = () => () => undefined;

export default function AppShell() {
  // null on the server, boolean on the client.
  const webgl = useSyncExternalStore(noop, detectWebGL, () => null);
  const phase = useAtlasStore((s) => s.phase);
  const introOpen = useAtlasStore((s) => s.introOpen);
  const mode = useAtlasStore((s) => s.mode);
  const mapReady = useAtlasStore((s) => s.mapReady);
  const mapError = useAtlasStore((s) => s.mapError);

  // The map mounts immediately, underneath the intro: its load + shader warm-up runs
  // while the globe is still a static establishing shot (see Intro's `go` gate), so
  // neither the intro animation nor the first story chapter stutters.
  usePlayback();
  useKeyboardShortcuts();
  useStoryController();

  if (webgl === false) return <WebGLFallback />;

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-night">
      {webgl && <AtlasMap />}

      {/* Cinematic vignette */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(5,9,15,0.75)_100%)]" />

      {phase === "atlas" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col gap-3 p-3 md:p-4">
          <TopBar />

          <div className="flex min-h-0 flex-1 flex-col justify-end gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex max-h-[46vh] min-h-0 flex-col md:max-h-full">
              {mode === "story" ? <StoryPanel /> : <LayerPanel />}
            </div>
            <div className="flex min-h-0 flex-row-reverse items-start gap-3 max-md:max-h-[52vh] md:max-h-full md:flex-row">
              {mode === "explore" && <InfoPanel />}
              <div className="hidden md:block">
                <MapControls />
              </div>
            </div>
          </div>

          <Timeline />
        </div>
      )}

      {phase === "atlas" && !mapReady && !mapError && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="panel flex items-center gap-3 rounded-full px-5 py-2.5 text-[13px] text-muted">
            <Loader2 size={15} className="animate-spin text-ochre" /> Газрын зураг ачаалж байна…
          </div>
        </div>
      )}

      {mapError && (
        <div className="absolute left-1/2 top-20 z-40 w-[min(92vw,520px)] -translate-x-1/2">
          <div className="panel flex gap-3 rounded-xl p-4 text-[13px] text-ink/90" role="alert">
            <AlertTriangle size={18} className="mt-0.5 flex-none text-imperial" />
            <div>
              Газрын зургийн өгөгдөл ачаалахад алдаа гарлаа. Хуудсыг дахин ачаална уу.
              <div className="mt-1 font-mono text-[11px] text-faint">{mapError}</div>
            </div>
          </div>
        </div>
      )}

      {introOpen && webgl !== null && <Intro webgl={Boolean(webgl)} />}
      {webgl === null && <div className="absolute inset-0 z-30 bg-night" />}

      <SourcesDialog />
    </main>
  );
}
