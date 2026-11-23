"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";

export interface GlobeData {
  /** Flat [lng, lat, region, lng, lat, region, …]. region: 0 other, 1 Japan, 2 China, 3 Korea, 4 Taiwan */
  dots: number[];
  coast: number[][][];
}

const D2R = Math.PI / 180;
function ll(lat: number, lng: number, r: number, out = new THREE.Vector3()) {
  const phi = (90 - lat) * D2R;
  const th = (lng + 180) * D2R;
  return out.set(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
}

/** Expansion arcs from Tokyo, in chronological order. */
const ARCS: { lat: number; lng: number }[] = [
  { lat: 25.03, lng: 121.57 }, // Taipei 1895
  { lat: 38.81, lng: 121.25 }, // Lüshun 1905
  { lat: 37.57, lng: 126.98 }, // Seoul 1910
  { lat: 36.07, lng: 120.38 }, // Qingdao 1914
  { lat: 41.8, lng: 123.43 }, // Mukden 1931
  { lat: 43.82, lng: 125.32 }, // Changchun 1932
  { lat: 39.9, lng: 116.41 }, // Beijing 1937
  { lat: 32.06, lng: 118.8 }, // Nanjing 1937
  { lat: 30.59, lng: 114.3 }, // Wuhan 1938
];
const TOKYO = { lat: 35.68, lng: 139.76 };

/** Deterministic PRNG (mulberry32) so geometry building stays pure. */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dotVertex = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uSpread;
  uniform float uPixelRatio;
  attribute float region;
  attribute float rnd;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * normalize(position));
    float facing = dot(n, normalize(-mv.xyz));
    vAlpha = smoothstep(0.02, 0.5, facing);
    vec3 base = vec3(0.29, 0.35, 0.43);
    vec3 red = vec3(0.86, 0.27, 0.27);
    vec3 amber = vec3(0.85, 0.64, 0.37);
    vec3 c = base;
    float size = 1.0;
    if (region > 0.5 && region < 1.5) { c = red; size = 1.35; }
    else if (region > 1.5 && region < 2.5) { c = mix(vec3(0.45, 0.43, 0.40), amber, uSpread * 0.6); size = 1.1; }
    else if (region > 2.5) { c = mix(amber, red, uSpread); size = 1.25; }
    vColor = c * (0.82 + 0.18 * sin(uTime * 1.4 + rnd * 40.0));
    gl_PointSize = uSize * size * uPixelRatio * (3.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const dotFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(vColor, smoothstep(0.5, 0.15, d) * vAlpha);
  }
`;

const sphereVertex = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const sphereFragment = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    float f = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
    vec3 c = mix(vec3(0.035, 0.065, 0.11), vec3(0.09, 0.18, 0.28), pow(f, 3.0));
    gl_FragColor = vec4(c, 1.0);
  }
`;
const atmoFragment = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    float i = pow(0.66 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.2);
    gl_FragColor = vec4(vec3(0.24, 0.48, 0.66) * i, i);
  }
`;

interface RigProps {
  exiting: boolean;
  reduced: boolean;
  /** Fired once the first frame (with compiled shaders) has been drawn. */
  onReady?: () => void;
  /** Gate for the camera move — held until the map below has finished its warm-up. */
  go?: boolean;
}

function Globe({ data, exiting, reduced, onReady, go = true }: { data: GlobeData } & RigProps) {
  const gl = useThree((s) => s.gl);
  const proxy = useRef({ lat: 8, lng: 72, dist: 7.6, spread: 0 });
  const dotsRef = useRef<THREE.Points>(null);
  const pinsRef = useRef<THREE.Points>(null);
  const arcRefs = useRef<(THREE.Line | null)[]>([]);
  const pointer = useRef({ x: 0, y: 0 });
  const arcProgress = useRef(ARCS.map(() => ({ p: 0 })));

  const dots = useMemo(() => {
    const n = data.dots.length / 3;
    const pos = new Float32Array(n * 3);
    const region = new Float32Array(n);
    const rnd = new Float32Array(n);
    const v = new THREE.Vector3();
    const rand = prng(7);
    for (let i = 0; i < n; i++) {
      ll(data.dots[i * 3 + 1], data.dots[i * 3], 1.003, v);
      pos.set([v.x, v.y, v.z], i * 3);
      region[i] = data.dots[i * 3 + 2];
      rnd[i] = rand();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("region", new THREE.BufferAttribute(region, 1));
    g.setAttribute("rnd", new THREE.BufferAttribute(rnd, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: dotVertex,
      fragmentShader: dotFragment,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 2.1 },
        uSpread: { value: 0 },
        uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
      },
    });
    return new THREE.Points(g, m);
  }, [data, gl]);

  const coast = useMemo(() => {
    const verts: number[] = [];
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    for (const ring of data.coast) {
      for (let i = 0; i < ring.length - 1; i++) {
        ll(ring[i][1], ring[i][0], 1.002, a);
        ll(ring[i + 1][1], ring[i + 1][0], 1.002, b);
        verts.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: "#35506d", transparent: true, opacity: 0.55 }));
  }, [data]);

  const arcs = useMemo(
    () =>
      ARCS.map((target) => {
        const start = ll(TOKYO.lat, TOKYO.lng, 1.004);
        const end = ll(target.lat, target.lng, 1.004);
        const mid = start.clone().add(end).multiplyScalar(0.5);
        const lift = 1 + start.distanceTo(end) * 0.55;
        mid.normalize().multiplyScalar(lift);
        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const g = new THREE.BufferGeometry().setFromPoints(curve.getPoints(64));
        g.setDrawRange(0, 0);
        const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: "#E25050", transparent: true, opacity: 0.95 }));
        return { line, end };
      }),
    [],
  );

  const pins = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(ARCS.length * 3);
    arcs.forEach((a, i) => pos.set([a.end.x, a.end.y, a.end.z], i * 3));
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ color: "#FF7A6A", size: 0.03, transparent: true, opacity: 0, depthWrite: false });
    return new THREE.Points(g, m);
  }, [arcs]);

  const stars = useMemo(() => {
    const n = 1400;
    const pos = new Float32Array(n * 3);
    const v = new THREE.Vector3();
    const rand = prng(42);
    for (let i = 0; i < n; i++) {
      const u = rand() * 2 - 1;
      const th = rand() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      v.set(r * Math.cos(th), u, r * Math.sin(th)).multiplyScalar(30 + rand() * 25);
      pos.set([v.x, v.y, v.z], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return new THREE.Points(g, new THREE.PointsMaterial({ color: "#7d90a6", size: 1.1, sizeAttenuation: false, transparent: true, opacity: 0.55 }));
  }, []);

  // Intro choreography. It starts only after the first frames are drawn: shader
  // compilation and buffer uploads happen on frame 1, and starting the camera move
  // before that produced a visible jump.
  const [ready, setReady] = useState(false);
  const frameCount = useRef(0);
  const started = ready && go;
  useEffect(() => {
    if (!started) return;
    const p = proxy.current;
    const arcsP = arcProgress.current;
    if (reduced) {
      Object.assign(p, { lat: 33, lng: 124, dist: 2.75, spread: 1 });
      arcsP.forEach((a) => (a.p = 1));
      return;
    }
    const tl = gsap.timeline();
    tl.to(p, { lat: 33, lng: 124, dist: 2.75, duration: 5.2, ease: "power3.inOut" }, 0.2);
    tl.to(arcsP, { p: 1, duration: 1.1, ease: "power2.out", stagger: 0.32 }, 3.2);
    tl.to(p, { spread: 1, duration: 3.5, ease: "sine.inOut" }, 3.4);
    return () => {
      tl.kill();
    };
  }, [reduced, started]);

  // Exit dive
  useEffect(() => {
    if (!exiting) return;
    const p = proxy.current;
    const tw = gsap.to(p, { lat: 36, lng: 121, dist: 1.32, duration: reduced ? 0 : 1.7, ease: "power3.in" });
    return () => {
      tw.kill();
    };
  }, [exiting, reduced]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((state) => {
    if (!ready && ++frameCount.current === 3) {
      setReady(true);
      onReady?.();
    }
    const p = proxy.current;
    const t = state.clock.elapsedTime;
    const cam = state.camera as THREE.PerspectiveCamera;
    // Keep a pleasant framing on narrow screens.
    const fov = state.size.width < 768 ? 48 : 34;
    if (cam.fov !== fov) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    const drift = reduced ? 0 : Math.sin(t * 0.12) * 2.2;
    const px = reduced ? 0 : pointer.current.x * 2.5;
    const py = reduced ? 0 : -pointer.current.y * 1.6;
    ll(p.lat + py, p.lng + drift + px, p.dist, cam.position);
    cam.lookAt(0, 0, 0);
    const mat = dotsRef.current?.material as THREE.ShaderMaterial | undefined;
    if (mat) {
      mat.uniforms.uTime.value = t;
      mat.uniforms.uSpread.value = p.spread;
    }
    arcRefs.current.forEach((line, i) => line?.geometry.setDrawRange(0, Math.floor(65 * arcProgress.current[i].p)));
    const done = arcProgress.current.some((a) => a.p >= 1);
    const pm = pinsRef.current?.material as THREE.PointsMaterial | undefined;
    if (pm) pm.opacity = done ? 0.95 : 0;
  });

  return (
    <>
      <primitive object={stars} />
      <mesh>
        <sphereGeometry args={[1, 96, 96]} />
        <shaderMaterial vertexShader={sphereVertex} fragmentShader={sphereFragment} />
      </mesh>
      <mesh scale={1.17}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          vertexShader={sphereVertex}
          fragmentShader={atmoFragment}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>
      <primitive object={coast} />
      <primitive ref={dotsRef} object={dots} />
      {arcs.map((a, i) => (
        <primitive
          key={i}
          object={a.line}
          ref={(el: THREE.Line | null) => {
            arcRefs.current[i] = el;
          }}
        />
      ))}
      <primitive ref={pinsRef} object={pins} />
    </>
  );
}

export default function GlobeScene({
  data,
  exiting,
  reduced,
  onError,
  onReady,
  go,
}: { data: GlobeData; onError?: () => void } & RigProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ fov: 34, near: 0.1, far: 200, position: [0, 0, 7] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener("webglcontextlost", () => onError?.(), { once: true });
      }}
      aria-hidden="true"
    >
      <Globe data={data} exiting={exiting} reduced={reduced} onReady={onReady} go={go} />
    </Canvas>
  );
}
