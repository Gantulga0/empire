import type { Map as MLMap } from "maplibre-gl";

/** Generate pattern + icon images on a canvas (no external sprite sheet needed). */
function draw(size: number, paint: (ctx: CanvasRenderingContext2D, s: number) => void): ImageData {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  paint(ctx, size);
  return ctx.getImageData(0, 0, size, size);
}

function hatch(color: string, width: number, gap: number) {
  return draw(gap, (ctx, s) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "square";
    for (let o = -s; o <= s; o += s) {
      ctx.beginPath();
      ctx.moveTo(o, s);
      ctx.lineTo(o + s, 0);
      ctx.stroke();
    }
  });
}

function cross(color: string, width: number, gap: number) {
  return draw(gap, (ctx, s) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    for (let o = -s; o <= s; o += s) {
      ctx.beginPath();
      ctx.moveTo(o, s);
      ctx.lineTo(o + s, 0);
      ctx.moveTo(o, 0);
      ctx.lineTo(o + s, s);
      ctx.stroke();
    }
  });
}

function dots(color: string, r: number, gap: number) {
  return draw(gap, (ctx, s) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(s / 4, s / 4, r, 0, Math.PI * 2);
    ctx.arc((3 * s) / 4, (3 * s) / 4, r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function arrowhead(color: string) {
  return draw(64, (ctx, s) => {
    ctx.fillStyle = color;
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    // Points "up" (north) — rotated in the layer by the travel bearing.
    ctx.moveTo(s / 2, 6);
    ctx.lineTo(s - 12, s - 10);
    ctx.lineTo(s / 2, s - 22);
    ctx.lineTo(12, s - 10);
    ctx.closePath();
    ctx.fill();
  });
}

export function registerImages(map: MLMap) {
  const add = (id: string, img: ImageData) => {
    if (!map.hasImage(id)) map.addImage(id, img, { pixelRatio: 2 });
  };
  add("pat-hatch-puppet", hatch("rgba(240,128,80,0.95)", 2.2, 14));
  add("pat-hatch-amber", hatch("rgba(217,163,95,0.9)", 2, 14));
  add("pat-dots-amber", dots("rgba(217,163,95,0.95)", 1.7, 14));
  add("pat-cross-red", cross("rgba(235,95,95,0.95)", 1.6, 12));
  add("pat-cross-slate", cross("rgba(150,168,190,0.8)", 1.4, 12));
  add("arrowhead", arrowhead("#E25050"));
}
