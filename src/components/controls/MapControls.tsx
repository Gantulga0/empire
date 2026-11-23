"use client";

import { Box, Home, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { mapRef } from "@/lib/mapRef";
import { useAtlasStore } from "@/store/useAtlasStore";

export default function MapControls() {
  const resetView = useAtlasStore((s) => s.resetView);
  const [tilted, setTilted] = useState(false);

  const toggleTilt = () => {
    const map = mapRef.current;
    if (!map) return;
    const next = !tilted;
    setTilted(next);
    map.easeTo({ pitch: next ? 50 : 0, duration: 900 });
  };

  return (
    <div className="panel pointer-events-auto flex flex-col rounded-xl p-1" role="toolbar" aria-label="Газрын зургийн удирдлага" aria-orientation="vertical">
      <button type="button" className="btn-icon" onClick={() => mapRef.current?.zoomIn()} aria-label="Ойртуулах" title="Ойртуулах">
        <Plus size={17} />
      </button>
      <button type="button" className="btn-icon" onClick={() => mapRef.current?.zoomOut()} aria-label="Холдуулах" title="Холдуулах">
        <Minus size={17} />
      </button>
      <div className="mx-2 my-0.5 h-px bg-hairline" />
      <button type="button" className="btn-icon" onClick={toggleTilt} aria-pressed={tilted} aria-label="Хэвгий харагдац" title="2D / 3D харагдац">
        <Box size={16} />
      </button>
      <button type="button" className="btn-icon" onClick={() => { setTilted(false); resetView(); }} aria-label="Камерыг анхны байрлалд" title="Анхны харагдац">
        <Home size={16} />
      </button>
    </div>
  );
}
