import React, {
  memo,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
} from 'react';
import { Pause, Play, RotateCcw, Eye, X, Quote, MapPin } from 'lucide-react';
import { PHILOSOPHY_ARTWORKS, GALLERY_ERAS } from '../database/galleryData';

// =========================================================
// LAYOUT
// =========================================================
const CARD_WIDTH = 320;
const CARD_HEIGHT = 430;
const GAP_X = 28;
const GAP_Y = 32;
const STEP_X = CARD_WIDTH + GAP_X;
const STEP_Y = CARD_HEIGHT + GAP_Y;
const OVERSCAN_X = 300; // px of extra tiles mounted beyond the viewport
const OVERSCAN_Y = 360;
const DOT_SIZE = 40;

// =========================================================
// FEEL — tweak these
// =========================================================
const DEADZONE = 40; // px radius around center where drift is stationary
const MAX_BASE_SPEED = 540; // px/sec at the viewport perimeter
const ACCEL = 5.6; // how quickly drift speed eases toward its target (per second)
const FLING_DECAY = 3.2; // how quickly release momentum fades (per second)
const MAX_FLING = 4000; // px/sec cap on release momentum
const DRAG_THRESHOLD = 5; // px of movement before a press becomes a drag
const CARD_IMG_W = 500; // thumbnail width requested for cards (modal stays full-res)

// =========================================================
// HELPERS
// =========================================================
const ARTWORK_BY_ID = new Map(PHILOSOPHY_ARTWORKS.map((a) => [a.id, a]));

const mod = (a, n) => ((a % n) + n) % n;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

// Row stride coprime to pool size so no row or column repeats an image
function getStride(count) {
  if (count <= 2) return 1;
  let s = Math.max(2, Math.floor(Math.sqrt(count)));
  while (gcd(s, count) !== 1 || s >= count) {
    s++;
    if (s >= count) {
      s = 1;
      break;
    }
  }
  return s;
}

// Deterministic pseudorandom permutation for spatial variety
function getPermutation(count) {
  const arr = Array.from({ length: count }, (_, i) => i);
  let seed = 1337;
  for (let i = count - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

// Which grid cells need to be mounted for a given camera + viewport
function computeRange(x, y, w, h) {
  return {
    c0: Math.floor((-x - CARD_WIDTH - OVERSCAN_X) / STEP_X),
    c1: Math.floor((-x + w + OVERSCAN_X) / STEP_X),
    r0: Math.floor((-y - CARD_HEIGHT - OVERSCAN_Y) / STEP_Y),
    r1: Math.floor((-y + h + OVERSCAN_Y) / STEP_Y),
  };
}

const sameRange = (a, b) =>
  a && b && a.c0 === b.c0 && a.c1 === b.c1 && a.r0 === b.r0 && a.r1 === b.r1;

// Wikimedia thumbnails: ask for a card-sized image instead of the 1280px original
const shrink = (url) =>
  url
    ? url
        .replace(/\/1280px-/, `/${CARD_IMG_W}px-`)
        .replace(/([?&]width=)1280/, `$1${CARD_IMG_W}`)
    : url;

// Try the small card version first, then fall back to the full-size URLs
function buildSources(item) {
  const list = [shrink(item.imageUrl), shrink(item.fallbackUrl), item.imageUrl, item.fallbackUrl];
  return [...new Set(list.filter(Boolean))];
}

function onImgError(e, sources) {
  const img = e.currentTarget;
  const next = Number(img.dataset.stage || 0) + 1;
  if (next < sources.length) {
    img.dataset.stage = String(next);
    img.src = sources[next];
    return;
  }
  img.style.display = 'none';
  img.parentElement?.classList.add('bg-zinc-900');
}

const reveal = (e) => {
  e.currentTarget.style.opacity = '1';
};

// Cached images can finish loading before React attaches onLoad
const revealIfLoaded = (el) => {
  if (el && el.complete && el.naturalWidth) el.style.opacity = '1';
};

// =========================================================
// TILE — memoised, positioned once, never re-rendered while the camera moves
// =========================================================
const Tile = memo(function Tile({ item, x, y }) {
  const sources = useMemo(() => buildSources(item), [item]);

  return (
    <div
      data-art={item.id}
      className="absolute top-0 left-0"
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        transform: `translate3d(${x}px, ${y}px, 0)`,
      }}
    >
      <div className="group w-full h-full rounded-2xl bg-zinc-950 border border-white/15 hover:border-white/60 p-3.5 flex flex-col justify-between shadow-xl transition-[transform,border-color] duration-300 hover:scale-[1.02] cursor-pointer">
        {/* Artwork image */}
        <div className="w-full h-60 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 relative">
          <img
            ref={revealIfLoaded}
            src={sources[0]}
            data-stage="0"
            alt={item.title}
            decoding="async"
            draggable={false}
            referrerPolicy="no-referrer"
            onLoad={reveal}
            onError={(e) => onImgError(e, sources)}
            style={{ opacity: 0 }}
            className="w-full h-full object-cover transition-[opacity,transform] duration-500 ease-out group-hover:scale-105"
          />

          {/* School of thought badge */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="badge badge-xs badge-img-overlay font-mono text-[9px] px-2 py-1 shadow-md">
              {item.school.split('&')[0].trim()}
            </span>
          </div>

          {/* Hover overlay (no backdrop blur: it is very expensive on a moving layer) */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <span className="btn btn-xs rounded-lg bg-white text-black font-bold gap-1 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
              <Eye className="w-3 h-3" />
              <span>Inspect Dossier</span>
            </span>
          </div>
        </div>

        {/* Text & metadata */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-white/50">
            <span className="truncate max-w-[180px]">{item.artist}</span>
            <span className="shrink-0">{item.year}</span>
          </div>
          <h3 className="font-bold text-sm text-white leading-tight line-clamp-1">{item.title}</h3>
          <p className="text-[11px] text-white/60 line-clamp-2 leading-relaxed italic">
            {item.quote}
          </p>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9.5px] font-mono text-white/40">
          <span className="truncate">{item.category}</span>
          <span className="flex items-center gap-1 shrink-0">
            <MapPin className="w-2.5 h-2.5" />
            <span className="truncate max-w-[100px]">{item.location.split(',')[0]}</span>
          </span>
        </div>
      </div>
    </div>
  );
});

// =========================================================
// GALLERY
// =========================================================
export default function Gallery() {
  // DOM refs — the camera is written straight to these, never through React state
  const containerRef = useRef(null);
  const planeRef = useRef(null);
  const dotsRef = useRef(null);
  const hudRef = useRef(null);

  // Simulation state (all mutable, none of it triggers a render)
  const camRef = useRef({ x: 0, y: 0 });
  const sizeRef = useRef({ w: 1200, h: 800 });
  const velRef = useRef({ vx: 0, vy: 0 }); // cursor-driven drift velocity
  const flingRef = useRef({ vx: 0, vy: 0 }); // momentum after releasing a drag
  const targetRef = useRef({ vx: 0, vy: 0 }); // drift velocity the cursor is asking for
  const pointerRef = useRef(null); // last mouse position
  const dragRef = useRef(null);
  const resetRef = useRef(null);
  const rangeRef = useRef(null);
  const dirtyRef = useRef(false);
  const snappedRef = useRef(true);
  const modalOpenRef = useRef(false);
  const pausedRef = useRef(false);
  const speedRef = useRef(1);

  // React state — only things that change what is mounted or styled
  const [range, setRange] = useState(() => computeRange(0, 0, 1200, 800));
  const [isPaused, setIsPaused] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [activeArtwork, setActiveArtwork] = useState(null);
  const [selectedEra, setSelectedEra] = useState('All Eras');

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);
  useEffect(() => {
    speedRef.current = speedMultiplier;
  }, [speedMultiplier]);

  // ---------------------------------------------------------
  // Mount more/fewer tiles only when the visible grid range changes
  // ---------------------------------------------------------
  const syncRange = useCallback(() => {
    const c = camRef.current;
    const s = sizeRef.current;
    const next = computeRange(c.x, c.y, s.w, s.h);
    if (!sameRange(rangeRef.current, next)) {
      rangeRef.current = next;
      setRange(next);
    }
  }, []);

  // Track the container size (not the window: the page has a header above it)
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const measure = () => {
      const r = el.getBoundingClientRect();
      sizeRef.current = { w: r.width, h: r.height };
      syncRange();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [syncRange]);

  // ---------------------------------------------------------
  // Cursor -> desired drift velocity (opposite to the cursor, scaled by distance)
  // ---------------------------------------------------------
  const updateTarget = useCallback((clientX, clientY) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const dist = Math.hypot(dx, dy);

    if (dist <= DEADZONE) {
      targetRef.current = { vx: 0, vy: 0 };
      return;
    }
    const maxDist = Math.max(100, Math.hypot(rect.width / 2, rect.height / 2) - DEADZONE);
    const norm = Math.min(1, (dist - DEADZONE) / maxDist);
    const speed = Math.pow(norm, 1.2) * MAX_BASE_SPEED;
    const angle = Math.atan2(dy, dx);
    targetRef.current = { vx: -Math.cos(angle) * speed, vy: -Math.sin(angle) * speed };
  }, []);

  const openArtwork = useCallback((item) => {
    modalOpenRef.current = true;
    dragRef.current = null;
    targetRef.current = { vx: 0, vy: 0 };
    velRef.current = { vx: 0, vy: 0 };
    flingRef.current = { vx: 0, vy: 0 };
    setActiveArtwork(item);
  }, []);

  const closeArtwork = useCallback(() => {
    modalOpenRef.current = false;
    setActiveArtwork(null);
  }, []);

  // ---------------------------------------------------------
  // THE LOOP: one rAF, direct DOM writes, React only hears about range changes
  // ---------------------------------------------------------
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let hudAt = 0;
    let hudText = '';

    const apply = (cam) => {
      const plane = planeRef.current;
      const dots = dotsRef.current;
      if (plane) plane.style.transform = `translate3d(${cam.x}px, ${cam.y}px, 0)`;
      if (dots) {
        dots.style.transform = `translate3d(${mod(cam.x, DOT_SIZE)}px, ${mod(
          cam.y,
          DOT_SIZE
        )}px, 0)`;
      }
      syncRange();
    };

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (dt <= 0) return;

      const cam = camRef.current;
      let changed = dirtyRef.current;
      dirtyRef.current = false;
      let speed = 0;

      const reset = resetRef.current;
      if (reset) {
        // Eased glide back to the origin
        const t = clamp((now - reset.start) / reset.dur, 0, 1);
        const e = 1 - Math.pow(1 - t, 4);
        cam.x = reset.fromX * (1 - e);
        cam.y = reset.fromY * (1 - e);
        if (t >= 1) resetRef.current = null;
        changed = true;
      } else if (!(dragRef.current && dragRef.current.active) && !modalOpenRef.current) {
        const vel = velRef.current;
        const tgt = targetRef.current;
        const fl = flingRef.current;

        // Frame-rate independent easing (same feel at 60 / 120 / 144 Hz)
        const k = 1 - Math.exp(-dt * ACCEL);
        const gate = pausedRef.current ? 0 : speedRef.current;
        vel.vx += (tgt.vx * gate - vel.vx) * k;
        vel.vy += (tgt.vy * gate - vel.vy) * k;

        const fd = Math.exp(-dt * FLING_DECAY);
        fl.vx *= fd;
        fl.vy *= fd;
        if (Math.abs(fl.vx) < 4) fl.vx = 0;
        if (Math.abs(fl.vy) < 4) fl.vy = 0;

        const vx = vel.vx + fl.vx;
        const vy = vel.vy + fl.vy;
        speed = Math.hypot(vx, vy);

        if (Math.abs(vx) > 0.05 || Math.abs(vy) > 0.05) {
          cam.x += vx * dt;
          cam.y += vy * dt;
          changed = true;
        }
      }

      if (changed) {
        snappedRef.current = false;
        apply(cam);
      } else if (!snappedRef.current) {
        // Come to rest on whole pixels so text and borders stay crisp
        cam.x = Math.round(cam.x);
        cam.y = Math.round(cam.y);
        snappedRef.current = true;
        apply(cam);
      }

      // Throttled HUD readout (direct text write, no React render)
      if (now - hudAt > 90) {
        hudAt = now;
        const text = `X: ${Math.round(cam.x)} • Y: ${Math.round(cam.y)} • ${Math.round(
          speed
        )} px/s`;
        if (text !== hudText && hudRef.current) {
          hudText = text;
          hudRef.current.textContent = text;
        }
      }
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [syncRange]);

  // ---------------------------------------------------------
  // POINTER: hover steering + drag with momentum + click-to-open
  // ---------------------------------------------------------
  const handlePointerDown = (e) => {
    if (e.button !== 0 || modalOpenRef.current) return;
    if (e.target.closest('[data-hud]')) return;
    const art = e.target.closest('[data-art]');
    resetRef.current = null;
    dragRef.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      active: false,
      art: art ? art.dataset.art : null,
      camX: 0,
      camY: 0,
      px: 0,
      py: 0,
      samples: [],
    };
  };

  const handlePointerMove = (e) => {
    if (e.pointerType === 'touch') return;
    pointerRef.current = { x: e.clientX, y: e.clientY };
    if (dragRef.current || modalOpenRef.current) return;
    updateTarget(e.clientX, e.clientY);
  };

  const handlePointerLeave = () => {
    targetRef.current = { vx: 0, vy: 0 };
  };

  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.id) return;

      if (!d.active) {
        if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < DRAG_THRESHOLD) return;
        // Press turned into a drag: stop the drift and take over the camera
        d.active = true;
        d.camX = camRef.current.x;
        d.camY = camRef.current.y;
        d.px = e.clientX;
        d.py = e.clientY;
        velRef.current = { vx: 0, vy: 0 };
        flingRef.current = { vx: 0, vy: 0 };
        if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
      }

      const cam = camRef.current;
      cam.x = d.camX + (e.clientX - d.px);
      cam.y = d.camY + (e.clientY - d.py);
      dirtyRef.current = true;

      const s = d.samples;
      s.push({ t: e.timeStamp, x: cam.x, y: cam.y });
      while (s.length > 2 && e.timeStamp - s[0].t > 100) s.shift();
    };

    const finish = (e, cancelled) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.id) return;
      dragRef.current = null;

      if (d.active) {
        if (containerRef.current) containerRef.current.style.cursor = '';
        // Throw: momentum from the last ~100ms of movement
        const s = d.samples;
        if (!cancelled && s.length >= 2 && e.timeStamp - s[s.length - 1].t < 80) {
          const a = s[0];
          const b = s[s.length - 1];
          const dt = (b.t - a.t) / 1000;
          if (dt > 0.01) {
            flingRef.current = {
              vx: clamp((b.x - a.x) / dt, -MAX_FLING, MAX_FLING),
              vy: clamp((b.y - a.y) / dt, -MAX_FLING, MAX_FLING),
            };
          }
        }
      } else if (!cancelled && d.art) {
        // A press that never moved is a click on the card that was pressed
        const item = ARTWORK_BY_ID.get(d.art);
        if (item) {
          openArtwork(item);
          return;
        }
      }

      // Resume steering from where the cursor actually is now
      if (e.pointerType !== 'touch' && !modalOpenRef.current) {
        pointerRef.current = { x: e.clientX, y: e.clientY };
        updateTarget(e.clientX, e.clientY);
      }
    };

    const onUp = (e) => finish(e, false);
    const onCancel = (e) => finish(e, true);
    const onBlur = () => {
      dragRef.current = null;
      if (containerRef.current) containerRef.current.style.cursor = '';
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('blur', onBlur);
    };
  }, [openArtwork, updateTarget]);

  // Smooth glide back to the origin
  const resetToCenter = () => {
    velRef.current = { vx: 0, vy: 0 };
    flingRef.current = { vx: 0, vy: 0 };
    resetRef.current = {
      fromX: camRef.current.x,
      fromY: camRef.current.y,
      start: performance.now(),
      dur: 900,
    };
  };

  // Keyboard: Space pauses the drift, Esc closes the dossier
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === ' ' && !modalOpenRef.current) {
        if (e.target instanceof HTMLElement && e.target.closest('button, input, textarea')) return;
        e.preventDefault();
        setIsPaused((p) => !p);
      } else if (e.key === 'Escape' && modalOpenRef.current) {
        closeArtwork();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeArtwork]);

  // ---------------------------------------------------------
  // Tiles for the current range (memoised; only changes when the range does)
  // ---------------------------------------------------------
  const pool = useMemo(() => {
    if (selectedEra === 'All Eras') return PHILOSOPHY_ARTWORKS;
    const filtered = PHILOSOPHY_ARTWORKS.filter((item) => item.era === selectedEra);
    return filtered.length ? filtered : PHILOSOPHY_ARTWORKS;
  }, [selectedEra]);
  const count = pool.length;
  const perm = useMemo(() => getPermutation(count), [count]);
  const stride = useMemo(() => getStride(count), [count]);

  const tiles = useMemo(() => {
    const out = [];
    for (let col = range.c0; col <= range.c1; col++) {
      for (let row = range.r0; row <= range.r1; row++) {
        const idx = mod(col + row * stride, count);
        const item = pool[perm[idx]];
        out.push(
          <Tile key={`${col}_${row}_${item.id}`} item={item} x={col * STEP_X} y={row * STEP_Y} />
        );
      }
    }
    return out;
  }, [range, pool, count, perm, stride]);

  const modalSources = useMemo(
    () =>
      activeArtwork
        ? [...new Set([activeArtwork.imageUrl, activeArtwork.fallbackUrl].filter(Boolean))]
        : [],
    [activeArtwork]
  );

  return (
    <>
      <style>{`
        @keyframes gl-fade { from { opacity: 0 } to { opacity: 1 } }
        .gl-fade { animation: gl-fade .2s ease-out }
      `}</style>

      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onDragStart={(e) => e.preventDefault()}
        className="relative w-full h-[calc(100vh-5rem)] overflow-hidden select-none font-serif cursor-grab bg-black text-white"
        style={{ touchAction: 'none' }}
      >
        {/* BACKGROUND DOT MATRIX: a compositor-only translate, no repaint */}
        <div
          ref={dotsRef}
          aria-hidden="true"
          className="absolute pointer-events-none opacity-[0.06] will-change-transform"
          style={{
            inset: `-${DOT_SIZE}px 0 0 -${DOT_SIZE}px`,
            backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1.2px, transparent 0)',
            backgroundSize: `${DOT_SIZE}px ${DOT_SIZE}px`,
          }}
        />

        {/* INFINITE CARD PLANE: one transformed layer, tiles sit at fixed coordinates */}
        <div
          ref={planeRef}
          className="absolute top-0 left-0 will-change-transform"
          style={{ width: 0, height: 0 }}
        >
          {tiles}
        </div>

        {/* TOP-LEFT TITLE CHIP */}
        <div
          data-hud
          className="absolute top-6 left-6 z-20 bg-zinc-950/95 border border-white/20 rounded-2xl p-3.5 shadow-2xl max-w-sm"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-white text-black font-black flex items-center justify-center text-xs shadow-md">
              Φ
            </div>
            <h1 className="text-sm font-bold font-serif text-white tracking-wide">
              INFINITE PHILOSOPHY GALLERY
            </h1>
          </div>
          <p className="text-[11px] text-white/60 font-mono leading-relaxed">
            Move your cursor away from center to drift opposite to it; speed grows with distance.
            Drag to pan and throw. Press{' '}
            <kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-mono text-[9px]">
              Space
            </kbd>{' '}
            to pause.
          </p>
        </div>

        {/* TOP-RIGHT ERA FILTER */}
        <div
          data-hud
          className="absolute top-6 right-6 z-20 flex items-center gap-1.5 overflow-x-auto max-w-md bg-zinc-950/95 border border-white/20 rounded-2xl p-1.5 shadow-2xl"
        >
          {GALLERY_ERAS.map((era) => (
            <button
              key={era}
              onClick={() => setSelectedEra(era)}
              className={`px-3 py-1 rounded-xl text-[10px] font-mono whitespace-nowrap transition-colors cursor-pointer ${
                selectedEra === era
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {era}
            </button>
          ))}
        </div>

        {/* BOTTOM-CENTER CONTROL BAR */}
        <div
          data-hud
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-zinc-950/95 border border-white/20 rounded-2xl p-2 shadow-2xl"
        >
          <button
            onClick={() => setIsPaused((p) => !p)}
            className={`btn btn-xs rounded-xl gap-1.5 font-mono cursor-pointer transition-colors ${
              isPaused
                ? 'bg-white text-black font-bold'
                : 'btn-outline border-white/30 text-white hover:bg-white hover:text-black'
            }`}
            title="Toggle drift (Space)"
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            <span>{isPaused ? 'Resume Drift' : 'Pause Drift'}</span>
          </button>

          <div className="w-px h-4 bg-white/20" />

          <div className="flex items-center gap-1 text-[10px] font-mono text-white/60">
            <span>Speed:</span>
            {[
              { label: '0.5x', val: 0.5 },
              { label: '1.0x', val: 1.0 },
              { label: '1.8x', val: 1.8 },
            ].map((sp) => (
              <button
                key={sp.label}
                onClick={() => setSpeedMultiplier(sp.val)}
                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  speedMultiplier === sp.val
                    ? 'bg-white text-black font-bold'
                    : 'hover:bg-white/10 text-white/70'
                }`}
              >
                {sp.label}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-white/20" />

          <button
            onClick={resetToCenter}
            className="btn btn-xs btn-ghost text-white/70 hover:text-white hover:bg-white/10 rounded-xl gap-1 font-mono cursor-pointer"
            title="Glide back to the origin (0,0)"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Origin</span>
          </button>

          <div className="w-px h-4 bg-white/20" />

          <div
            ref={hudRef}
            className="px-2 font-mono text-[9.5px] text-white/40 whitespace-nowrap tabular-nums"
          >
            X: 0 • Y: 0 • 0 px/s
          </div>
        </div>
      </div>

      {/* LIGHTBOX */}
      {activeArtwork && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeArtwork.title}
          onClick={closeArtwork}
          className="gl-fade fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl bg-zinc-950 border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
          >
            {/* Image */}
            <div className="md:w-3/5 bg-black flex items-center justify-center p-4 relative border-b md:border-b-0 md:border-r border-white/10">
              <img
                key={activeArtwork.id}
                src={modalSources[0]}
                data-stage="0"
                alt={activeArtwork.title}
                decoding="async"
                draggable={false}
                referrerPolicy="no-referrer"
                onError={(e) => onImgError(e, modalSources)}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
              />
              <div className="absolute top-4 left-4">
                <span className="badge badge-sm font-mono modal-era-badge">
                  {activeArtwork.era}
                </span>
              </div>
            </div>

            {/* Dossier */}
            <div className="md:w-2/5 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/50">
                    Artwork Dossier
                  </span>
                  <button
                    onClick={closeArtwork}
                    className="w-8 h-8 rounded-full border border-white/20 hover:bg-white hover:text-black flex items-center justify-center text-white transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h2 className="text-2xl font-serif font-black text-white leading-tight">
                    {activeArtwork.title}
                  </h2>
                  {activeArtwork.greekTitle && (
                    <div className="text-xs font-mono text-white/50 mt-0.5">
                      {activeArtwork.greekTitle}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-xs font-mono text-white/70 border-y border-white/10 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/40">Artist:</span>
                    <span className="font-semibold text-white">{activeArtwork.artist}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/40">Date:</span>
                    <span>{activeArtwork.year}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/40">Medium:</span>
                    <span>{activeArtwork.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/40">Location:</span>
                    <span className="truncate max-w-[180px]">{activeArtwork.location}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black border border-white/15 relative">
                  <Quote className="w-5 h-5 text-white/20 absolute top-3 right-3 pointer-events-none" />
                  <p className="text-xs font-serif italic text-white leading-relaxed pr-6">
                    {activeArtwork.quote}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 block">
                    Philosophical Context
                  </span>
                  <p className="text-xs text-white/80 leading-relaxed font-light">
                    {activeArtwork.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {activeArtwork.tags.map((tag) => (
                    <span
                      key={tag}
                      className="badge badge-xs bg-white/5 border border-white/15 text-white/70 font-mono text-[9.5px]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button
                  onClick={closeArtwork}
                  className="btn btn-sm bg-white text-black hover:bg-zinc-200 border-none font-bold rounded-xl gap-1.5 cursor-pointer"
                >
                  <span>Close Inspection</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}