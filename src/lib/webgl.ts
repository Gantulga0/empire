let cached: boolean | undefined;

/** Returns true when the browser can create a WebGL context (needed by MapLibre and Three.js). Cached. */
export function detectWebGL(): boolean {
  if (cached === undefined) cached = probe();
  return cached;
}

function probe(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      (canvas.getContext("webgl2") as WebGL2RenderingContext | null) ??
      (canvas.getContext("webgl") as WebGLRenderingContext | null);
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
