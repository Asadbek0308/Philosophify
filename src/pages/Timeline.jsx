import React, {
  memo,
  useState,
  useRef,
  useMemo,
  useEffect,
  useLayoutEffect,
  useCallback,
} from 'react';
import {
  Clock,
  Search,
  MapPin,
  Quote,
  Sparkles,
  Layers,
  ArrowRight,
  ArrowLeft,
  Tag,
  Play,
  Pause,
  Shuffle,
  ChevronDown,
  ChevronsDown,
  ChevronUp,
  ChevronsUp,
  RotateCcw,
  Compass,
  X,
  History,
} from 'lucide-react';
import { TIMELINE_DATA, TIMELINE_ERAS } from '../database/timelineData';

// ============================================================================
// ENGINE CONSTANTS & PHYSICS TUNING
// ============================================================================
const STEP_Y = 68; // px per milestone slot on the tape
const OVERSCAN_Y = 360; // extra px of rows mounted beyond the viewport
const ROW_BLOCK = 6; // rows are mounted in blocks, so React updates a few times a second
const ACCEL = 6.0; // ease rate toward the held-button / tour speed (per second)
const FLING_DECAY = 3.4; // fade rate of release momentum (per second)
const MAX_FLING = 4500; // px/sec cap on release momentum
const DRAG_THRESHOLD = 5; // px of movement before a press becomes a drag
const NORMAL_SPEED = 580; // px/sec for Up / Down buttons
const SUPER_SPEED = 3400; // px/sec for Fast / Super buttons
const TOUR_SPEED = 90; // px/sec for the gentle auto-tour
const WHEEL_EASE = 14; // how quickly wheel input is eased into the camera (per second)
const WHEEL_GAIN = 1.1; // px of travel per px of wheel delta

const mod = (a, n) => ((a % n) + n) % n;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Which rows must be mounted for a camera position (quantised to blocks)
function computeRange(camY, h) {
  const a = Math.floor((-camY - OVERSCAN_Y) / STEP_Y);
  const b = Math.ceil((-camY + h + OVERSCAN_Y) / STEP_Y);
  return {
    r0: Math.floor(a / ROW_BLOCK) * ROW_BLOCK,
    r1: (Math.floor(b / ROW_BLOCK) + 1) * ROW_BLOCK,
  };
}

const ERA_ACCENTS = {
  ancient: '#f59e0b',
  medieval: '#10b981',
  enlightenment: '#06b6d4',
  nineteenth: '#8b5cf6',
  twentieth: '#ec4899',
};

// ============================================================================
// ROW STYLES
// The active row is toggled with a data attribute straight from the animation
// loop, so highlighting is exact at any speed and never goes through React.
// Only transform / color / opacity are animated (no layout properties).
// ============================================================================
const TIMELINE_CSS = `
.tl-row { contain: layout style; }
.tl-inner { transition: background-color .15s ease, border-color .15s ease; }
.tl-row:hover .tl-inner { background: rgba(255,255,255,.05); border-color: rgba(255,255,255,.15); }
.tl-row[data-active="true"] .tl-inner { background: rgba(255,255,255,.10); border-color: rgba(255,255,255,.30); }

.tl-tick { width: 20px; height: 2px; background: rgba(255,255,255,.3); transform-origin: left center; transform: scale(.5,.5); transition: transform .15s ease, background-color .15s ease; }
.tl-row:hover .tl-tick { transform: scale(.7,.5); background: rgba(255,255,255,.6); }
.tl-row[data-active="true"] .tl-tick { transform: scale(1,1); background: #fff; }

.tl-pip { transition: transform .15s ease; }
.tl-row[data-active="true"] .tl-pip { transform: scale(1.5); }

.tl-year { color: rgba(255,255,255,.5); transform-origin: left center; transition: color .15s ease, transform .15s ease; }
.tl-row:hover .tl-year { color: rgba(255,255,255,.8); }
.tl-row[data-active="true"] .tl-year { color: #fff; transform: scale(1.15); }

.tl-name { color: rgba(255,255,255,.7); transition: color .15s ease; }
.tl-row:hover .tl-name { color: #fff; }
.tl-row[data-active="true"] .tl-name { color: #fff; }
`;

// ============================================================================
// TAPE ROW (memoised, positioned once, never re-rendered while the reel moves)
// ============================================================================
const TapeNode = memo(function TapeNode({ item, row }) {
  const accentColor = ERA_ACCENTS[item.era] || '#ffffff';

  return (
    <div
      data-row={row}
      className="tl-row absolute left-0 right-0 cursor-pointer select-none"
      style={{
        height: `${STEP_Y}px`,
        transform: `translate3d(0, ${row * STEP_Y}px, 0)`,
      }}
    >
      <div className="tl-inner w-full h-full px-4 flex items-center justify-between border-b border-white/5">
        {/* Left: ruler tick, era pip, year */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="tl-tick" />
            <div
              className="tl-pip w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
          </div>
          <span className="tl-year font-mono text-xs tabular-nums tracking-wider">
            {item.yearDisplay}
          </span>
        </div>

        {/* Right: thinker / school */}
        <div className="flex flex-col items-end max-w-[170px] truncate">
          <span className="tl-name text-xs font-serif font-medium truncate">{item.thinker}</span>
          <span className="text-[9.5px] font-mono text-white/40 truncate max-w-[150px]">
            {item.school.split('&')[0].trim()}
          </span>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// TAPE TRACK: owns the mounted-range state, so the rest of the page
// (dossier, controls) does NOT re-render when rows scroll in and out
// ============================================================================
const TapeTrack = memo(function TapeTrack({
  items,
  trackRef,
  initialRange,
  registerSetRange,
  onRendered,
}) {
  const [range, setRange] = useState(initialRange);
  const count = items.length;

  useLayoutEffect(() => {
    const set = (next) =>
      setRange((prev) => (prev.r0 === next.r0 && prev.r1 === next.r1 ? prev : next));
    registerSetRange(set);
    return () => registerSetRange(null);
  }, [registerSetRange]);

  const nodes = useMemo(() => {
    if (!count) return null;
    const out = [];
    for (let r = range.r0; r <= range.r1; r++) {
      const item = items[mod(r, count)];
      out.push(<TapeNode key={`${r}_${item.id}`} item={item} row={r} />);
    }
    return out;
  }, [range, items, count]);

  // Re-apply the active-row highlight whenever rows are (re)mounted
  useLayoutEffect(() => {
    onRendered();
  }, [nodes, onRendered]);

  return (
    <div ref={trackRef} className="absolute top-0 left-0 right-0 will-change-transform">
      {nodes}
    </div>
  );
});

// ============================================================================
// DOSSIER (memoised: only re-renders when the active milestone changes)
// ============================================================================
const Dossier = memo(function Dossier({ item, onTagClick }) {
  return (
    <div className="rounded-3xl border border-white/15 bg-zinc-950 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
      {/* Header chips */}
      <div className="flex flex-wrap items-center gap-2.5 mb-6">
        <span className="badge badge-lg bg-white text-black font-mono font-black border-none text-sm px-3.5 py-1 shadow-md">
          {item.yearDisplay}
        </span>
        <span className="badge badge-lg badge-outline border-white/30 text-white font-mono text-xs px-3">
          {item.eraName}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-white/60 font-mono">
          <MapPin className="w-3.5 h-3.5 text-white/40" />
          <span>{item.location}</span>
        </span>
      </div>

      {/* Headline & thinker */}
      <div className="space-y-2 mb-6">
        <div className="text-[11px] font-mono uppercase tracking-widest text-white/50 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5" />
          <span>{item.school}</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-serif font-black text-white leading-tight">
          {item.title}
        </h2>
        <div className="text-sm italic text-white/70">
          Formulated by{' '}
          <span className="font-semibold text-white not-italic underline decoration-white/30 underline-offset-4">
            {item.thinker}
          </span>
        </div>
      </div>

      {/* Core axiom */}
      {item.axiom && (
        <div className="p-5 sm:p-6 rounded-2xl bg-black border border-white/15 mb-6 relative shadow-inner">
          <Quote className="w-8 h-8 text-white/10 absolute top-4 right-4 pointer-events-none" />
          <blockquote className="text-sm sm:text-lg font-serif italic text-white leading-relaxed pr-6">
            {item.axiom}
          </blockquote>
        </div>
      )}

      {/* Context & paradigm shift */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-2.5 p-5 rounded-2xl bg-white/[0.02] border border-white/10">
          <h3 className="text-xs font-mono uppercase tracking-widest text-white font-bold flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-white/60" /> Historical Context & Doctrine
          </h3>
          <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-light">
            {item.description}
          </p>
        </div>

        <div className="space-y-2.5 p-5 rounded-2xl bg-white/[0.02] border border-white/10">
          <h3 className="text-xs font-mono uppercase tracking-widest text-white font-bold flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-white/60" /> Paradigm Shift & Influence
          </h3>
          <div className="space-y-2.5">
            <div className="text-xs text-white leading-relaxed">
              <span className="font-semibold text-white/90">Shift: </span>
              <span className="text-white/70">{item.paradigmShift}</span>
            </div>
            <div className="text-xs leading-relaxed border-t border-white/10 pt-2">
              <span className="font-semibold text-white/90">Legacy: </span>
              <span className="text-white/70">{item.influence}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-1.5 pt-4 border-t border-white/10">
        <span className="text-[11px] font-mono text-white/40 mr-1.5 flex items-center gap-1">
          <Tag className="w-3 h-3" /> Tags:
        </span>
        {item.tags.map((tag) => (
          <button
            key={tag}
            onClick={() => onTagClick(tag)}
            className="badge badge-xs bg-zinc-900 hover:bg-white hover:text-black border border-white/20 text-white/70 text-[10px] font-mono transition-colors cursor-pointer"
          >
            #{tag}
          </button>
        ))}
      </div>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function Timeline() {
  const [selectedEra, setSelectedEra] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoTour, setIsAutoTour] = useState(false);

  const q = searchQuery.toLowerCase().trim().replace(/^#/, '');
  const filteredItems = useMemo(() => {
    return TIMELINE_DATA.filter((item) => {
      if (selectedEra !== 'all' && item.era !== selectedEra) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.thinker.toLowerCase().includes(q) ||
        item.school.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.yearDisplay.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [selectedEra, q]);

  const total = filteredItems.length;

  const eraCounts = useMemo(() => {
    const counts = { all: TIMELINE_DATA.length };
    TIMELINE_ERAS.forEach((e) => {
      if (e.id !== 'all') {
        counts[e.id] = TIMELINE_DATA.filter((item) => item.era === e.id).length;
      }
    });
    return counts;
  }, []);

  const activeItem = total ? filteredItems[Math.min(activeIndex, total - 1)] : null;

  // --------------------------------------------------------------------------
  // REFS: everything the animation loop touches lives here, outside React state
  // --------------------------------------------------------------------------
  const tapeViewportRef = useRef(null);
  const tapeTrackRef = useRef(null);
  const hudVelocityRef = useRef(null);

  const itemsRef = useRef(filteredItems);
  const camYRef = useRef(0);
  const velRef = useRef(0); // button / auto-tour velocity
  const flingRef = useRef(0); // momentum after releasing a drag
  const wheelRemainRef = useRef(0); // wheel travel still to be eased in (px)
  const heldDirRef = useRef(null); // 'down' | 'superdown' | 'up' | 'superup' | null
  const autoTourRef = useRef(false);
  const dragRef = useRef(null);
  const glideRef = useRef(null);
  const glideTargetRowRef = useRef(0);
  const dirtyRef = useRef(false);
  const snappedRef = useRef(true);
  const viewportHRef = useRef(700);
  const activeRowRef = useRef(0);
  const activeElRef = useRef(null);
  const lastDispatchedIdxRef = useRef(0);
  const lastDispatchTimeRef = useRef(0);

  // Mounted-row range: the state itself lives inside <TapeTrack>
  const rangeRef = useRef(computeRange(700 / 2 - STEP_Y / 2, 700));
  const initialRangeRef = useRef(rangeRef.current);
  const setRangeFnRef = useRef(null);

  useLayoutEffect(() => {
    itemsRef.current = filteredItems;
  }, [filteredItems]);

  useEffect(() => {
    autoTourRef.current = isAutoTour;
  }, [isAutoTour]);

  const registerSetRange = useCallback((fn) => {
    setRangeFnRef.current = fn;
    if (fn) fn(rangeRef.current);
  }, []);

  const updateRange = useCallback((camY, h) => {
    const next = computeRange(camY, h);
    const cur = rangeRef.current;
    if (next.r0 !== cur.r0 || next.r1 !== cur.r1) {
      rangeRef.current = next;
      setRangeFnRef.current?.(next);
    }
  }, []);

  // Compositor-only camera move
  const applyCamY = useCallback(
    (y) => {
      if (tapeTrackRef.current) {
        tapeTrackRef.current.style.transform = `translate3d(0, ${y}px, 0)`;
      }
      updateRange(y, viewportHRef.current);
    },
    [updateRange]
  );

  // Highlight the row under the reticle by toggling a data attribute
  const setActiveRowDom = useCallback((row) => {
    const track = tapeTrackRef.current;
    if (!track) return;
    const prev = activeElRef.current;
    const next = track.querySelector(`[data-row="${row}"]`);
    if (prev && prev !== next) prev.removeAttribute('data-active');
    if (next) next.setAttribute('data-active', 'true');
    activeElRef.current = next;
  }, []);

  const reapplyActive = useCallback(() => {
    setActiveRowDom(activeRowRef.current);
  }, [setActiveRowDom]);

  // Measure the viewport. The first measure centers the reel on milestone 1,
  // later ones keep whatever is under the reticle there.
  useLayoutEffect(() => {
    const el = tapeViewportRef.current;
    if (!el) return undefined;
    let first = true;
    const measure = () => {
      const h = el.clientHeight;
      if (!h) return;
      if (first) {
        first = false;
        camYRef.current = h / 2 - STEP_Y / 2;
      } else {
        const dh = (h - viewportHRef.current) / 2;
        camYRef.current += dh;
        if (glideRef.current) {
          glideRef.current.fromY += dh;
          glideRef.current.toY += dh;
        }
      }
      viewportHRef.current = h;
      applyCamY(camYRef.current);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [applyCamY]);

  // --------------------------------------------------------------------------
  // MOTION HELPERS
  // --------------------------------------------------------------------------
  const stopMotion = useCallback(() => {
    glideRef.current = null;
    velRef.current = 0;
    flingRef.current = 0;
    wheelRemainRef.current = 0;
    heldDirRef.current = null;
  }, []);

  // Back to milestone 1 after the dataset changes
  const resetView = useCallback(() => {
    stopMotion();
    camYRef.current = viewportHRef.current / 2 - STEP_Y / 2;
    applyCamY(camYRef.current);
    activeRowRef.current = 0;
    lastDispatchedIdxRef.current = 0;
    setActiveIndex(0);
  }, [stopMotion, applyCamY]);

  const handleEraSelect = useCallback(
    (eraId) => {
      setSelectedEra(eraId);
      resetView();
    },
    [resetView]
  );

  const handleSearchChange = useCallback(
    (query) => {
      setSearchQuery(query);
      resetView();
    },
    [resetView]
  );

  // Eased glide that centers a row under the reticle
  const glideToRow = useCallback((targetRow, duration = 650) => {
    velRef.current = 0;
    flingRef.current = 0;
    wheelRemainRef.current = 0;
    heldDirRef.current = null;
    if (autoTourRef.current) setIsAutoTour(false);

    glideTargetRowRef.current = targetRow;
    glideRef.current = {
      fromY: camYRef.current,
      toY: viewportHRef.current / 2 - targetRow * STEP_Y - STEP_Y / 2,
      start: performance.now(),
      dur: duration,
    };
  }, []);

  // Relative step (wraps around the loop; chains correctly on rapid key presses)
  const stepBy = useCallback(
    (n) => {
      if (!itemsRef.current.length || !n) return;
      const base = glideRef.current ? glideTargetRowRef.current : activeRowRef.current;
      glideToRow(base + n, clamp(350 + Math.abs(n) * 18, 420, 1100));
    },
    [glideToRow]
  );

  // Absolute jump inside the current cycle (Dawn / Present)
  const jumpToIndex = useCallback(
    (index) => {
      const len = itemsRef.current.length;
      if (!len) return;
      const cycle = Math.floor(activeRowRef.current / len);
      glideToRow(cycle * len + clamp(index, 0, len - 1), 700);
    },
    [glideToRow]
  );

  // Random milestone via the shortest way around the loop
  const jumpToRandom = () => {
    const len = itemsRef.current.length;
    if (len < 2) return;
    const base = glideRef.current ? glideTargetRowRef.current : activeRowRef.current;
    const cur = mod(base, len);
    let idx = Math.floor(Math.random() * (len - 1));
    if (idx >= cur) idx += 1;
    let delta = idx - cur;
    if (delta > len / 2) delta -= len;
    else if (delta < -len / 2) delta += len;
    stepBy(delta);
  };

  // --------------------------------------------------------------------------
  // THE LOOP: one rAF for the whole page, direct DOM writes
  // --------------------------------------------------------------------------
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let hudAt = 0;
    let hudText = '';

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (dt <= 0) return;

      const prevCam = camYRef.current;
      let changed = dirtyRef.current; // set by drag handlers
      dirtyRef.current = false;

      const glide = glideRef.current;
      if (glide) {
        // 1. Programmed eased glide
        const t = clamp((now - glide.start) / glide.dur, 0, 1);
        const ease = 1 - Math.pow(1 - t, 4);
        camYRef.current = glide.fromY + (glide.toY - glide.fromY) * ease;
        changed = true;
        if (t >= 1) glideRef.current = null;
      } else if (!(dragRef.current && dragRef.current.active)) {
        // 2. Held buttons, auto-tour, fling and wheel
        let targetV = 0;
        const held = heldDirRef.current;
        if (held === 'down') targetV = NORMAL_SPEED;
        else if (held === 'superdown') targetV = SUPER_SPEED;
        else if (held === 'up') targetV = -NORMAL_SPEED;
        else if (held === 'superup') targetV = -SUPER_SPEED;
        else if (autoTourRef.current) targetV = TOUR_SPEED;

        // Moving the tape up (negative Y) moves time forward
        const k = 1 - Math.exp(-dt * ACCEL);
        velRef.current += (-targetV - velRef.current) * k;

        flingRef.current *= Math.exp(-dt * FLING_DECAY);
        if (Math.abs(flingRef.current) < 2) flingRef.current = 0;

        // Wheel input is eased in (works for notched wheels and trackpads alike)
        let wheelStep = 0;
        const wr = wheelRemainRef.current;
        if (wr !== 0) {
          wheelStep = wr * (1 - Math.exp(-dt * WHEEL_EASE));
          wheelRemainRef.current = Math.abs(wr - wheelStep) < 0.1 ? 0 : wr - wheelStep;
        }

        const totalV = velRef.current + flingRef.current;
        if (Math.abs(totalV) > 0.1 || wheelStep !== 0) {
          camYRef.current += totalV * dt + wheelStep;
          changed = true;
        }
      }

      const speed = Math.abs(camYRef.current - prevCam) / dt;

      if (changed) {
        snappedRef.current = false;
        applyCamY(camYRef.current);
      } else if (!snappedRef.current) {
        // Come to rest on a whole pixel so text stays razor-crisp
        camYRef.current = Math.round(camYRef.current);
        snappedRef.current = true;
        applyCamY(camYRef.current);
      }

      // Row under the reticle: highlight it instantly (direct DOM)
      const row = Math.round((viewportHRef.current / 2 - camYRef.current - STEP_Y / 2) / STEP_Y);
      if (row !== activeRowRef.current) {
        activeRowRef.current = row;
        setActiveRowDom(row);
      }

      // Tell React which milestone is active, but throttled while moving fast
      const len = itemsRef.current.length;
      if (len) {
        const idx = mod(row, len);
        const throttle = speed > 400 ? 120 : 35;
        if (idx !== lastDispatchedIdxRef.current && now - lastDispatchTimeRef.current > throttle) {
          lastDispatchedIdxRef.current = idx;
          lastDispatchTimeRef.current = now;
          setActiveIndex(idx);
        }
      }

      // Throttled velocity readout (direct text write)
      if (now - hudAt > 70) {
        hudAt = now;
        const text = `${Math.round(speed)} px/s`;
        if (text !== hudText && hudVelocityRef.current) {
          hudText = text;
          hudVelocityRef.current.textContent = text;
        }
      }
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [applyCamY, setActiveRowDom]);

  // --------------------------------------------------------------------------
  // POINTER: drag + throw + click-to-glide (window listeners, no pointer capture,
  // so row clicks keep working and a drag never ends in a stray click)
  // --------------------------------------------------------------------------
  const handleTapePointerDown = (e) => {
    if (e.button !== 0) return;
    glideRef.current = null;
    flingRef.current = 0; // pressing catches a moving reel
    wheelRemainRef.current = 0;
    const rowEl = e.target.closest('[data-row]');
    dragRef.current = {
      id: e.pointerId,
      startY: e.clientY,
      camY: camYRef.current,
      active: false,
      row: rowEl ? Number(rowEl.dataset.row) : null,
      samples: [],
    };
  };

  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.id) return;

      if (!d.active) {
        if (Math.abs(e.clientY - d.startY) < DRAG_THRESHOLD) return;
        d.active = true;
        d.startY = e.clientY; // start from here: no jump when the drag begins
        d.camY = camYRef.current;
        velRef.current = 0;
        flingRef.current = 0;
        heldDirRef.current = null;
        if (autoTourRef.current) setIsAutoTour(false);
        if (tapeViewportRef.current) tapeViewportRef.current.style.cursor = 'grabbing';
      }

      camYRef.current = d.camY + (e.clientY - d.startY);
      dirtyRef.current = true;

      const s = d.samples;
      s.push({ t: e.timeStamp, y: camYRef.current });
      while (s.length > 2 && e.timeStamp - s[0].t > 100) s.shift();
    };

    const finish = (e, cancelled) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.id) return;
      dragRef.current = null;

      if (d.active) {
        if (tapeViewportRef.current) tapeViewportRef.current.style.cursor = '';
        const s = d.samples;
        if (!cancelled && s.length >= 2 && e.timeStamp - s[s.length - 1].t < 80) {
          const a = s[0];
          const b = s[s.length - 1];
          const dt = (b.t - a.t) / 1000;
          if (dt > 0.01) {
            flingRef.current = clamp((b.y - a.y) / dt, -MAX_FLING, MAX_FLING);
          }
        }
      } else if (!cancelled && d.row !== null) {
        // A press that never moved is a click on the row that was pressed
        glideToRow(d.row, 650);
      }
    };

    const onUp = (e) => finish(e, false);
    const onCancel = (e) => finish(e, true);
    const onBlur = () => {
      dragRef.current = null;
      if (tapeViewportRef.current) tapeViewportRef.current.style.cursor = '';
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
  }, [glideToRow]);

  // Wheel: native non-passive listener (React's onWheel is passive, so
  // preventDefault there is ignored)
  useEffect(() => {
    const el = tapeViewportRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      glideRef.current = null;
      heldDirRef.current = null;
      if (autoTourRef.current) setIsAutoTour(false);
      const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? viewportHRef.current : 1;
      wheelRemainRef.current = clamp(
        wheelRemainRef.current - e.deltaY * unit * WHEEL_GAIN,
        -6000,
        6000
      );
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // --------------------------------------------------------------------------
  // HELD BUTTONS
  // --------------------------------------------------------------------------
  const startHold = (direction) => {
    glideRef.current = null;
    wheelRemainRef.current = 0;
    heldDirRef.current = direction;
    if (autoTourRef.current) setIsAutoTour(false);
  };

  const endHold = () => {
    heldDirRef.current = null;
  };

  // --------------------------------------------------------------------------
  // KEYBOARD
  // --------------------------------------------------------------------------
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t instanceof HTMLElement && t.closest('input, textarea, select')) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        stepBy(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        stepBy(-1);
      } else if (e.key === 'PageDown') {
        e.preventDefault();
        stepBy(10);
      } else if (e.key === 'PageUp') {
        e.preventDefault();
        stepBy(-10);
      } else if (e.key === ' ') {
        // A focused button already handles Space itself
        if (t instanceof HTMLElement && t.closest('button')) return;
        e.preventDefault();
        setIsAutoTour((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stepBy]);

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------
  return (
    <div className="w-full h-[calc(100vh-5rem)] flex flex-col lg:flex-row overflow-hidden bg-black text-white font-serif select-none">
      <style>{TIMELINE_CSS}</style>

      {/* ====================================================================
          LEFT COLUMN: VERTICAL INFINITE REEL
          ==================================================================== */}
      <div className="w-full lg:w-96 flex flex-col shrink-0 border-b lg:border-b-0 lg:border-r border-white/15 bg-zinc-950 relative h-96 lg:h-full">
        {/* TOP CONTROLS */}
        <div className="p-3.5 border-b border-white/10 flex flex-col gap-3 bg-zinc-950 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-white text-black font-black flex items-center justify-center text-xs shadow-md">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Chronos Reel
                </h1>
                <div className="text-[10px] font-mono text-white/50 flex items-center gap-1">
                  <span>{total} Milestones</span>
                  <span>•</span>
                  <span ref={hudVelocityRef} className="text-white/70 tabular-nums">
                    0 px/s
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-base font-black font-mono text-white tracking-tight">
                {activeItem ? activeItem.yearDisplay : '—'}
              </span>
              <span className="text-[10.5px] font-mono text-white/60 truncate max-w-[130px]">
                {activeItem ? activeItem.thinker : 'No match'}
              </span>
            </div>
          </div>

          {/* Velocity buttons */}
          <div className="flex items-center justify-between gap-1 bg-black/60 p-1.5 rounded-2xl border border-white/10">
            <button
              onPointerDown={() => startHold('superup')}
              onPointerUp={endHold}
              onPointerLeave={endHold}
              onPointerCancel={endHold}
              className="btn btn-xs bg-zinc-900 hover:bg-white hover:text-black border border-white/15 text-white/80 rounded-xl px-2 font-mono gap-0.5 cursor-pointer transition-colors active:scale-95"
              title="Super Up (Fast Reverse) - Hold down"
            >
              <ChevronsUp className="w-3.5 h-3.5" />
              <span className="text-[9px] font-bold">Fast</span>
            </button>

            <button
              onPointerDown={() => startHold('up')}
              onPointerUp={endHold}
              onPointerLeave={endHold}
              onPointerCancel={endHold}
              className="btn btn-xs btn-outline border-white/20 hover:bg-white hover:text-black text-white rounded-xl px-2 font-mono cursor-pointer transition-colors active:scale-95"
              title="Up (Reverse) - Hold down"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span className="text-[9px]">Up</span>
            </button>

            <button
              onClick={() => setIsAutoTour((p) => !p)}
              className={`btn btn-xs rounded-xl px-2.5 font-mono gap-1 cursor-pointer transition-colors ${
                isAutoTour
                  ? 'bg-white text-black font-bold shadow-md'
                  : 'btn-outline border-white/30 text-white hover:bg-white hover:text-black'
              }`}
              title="Toggle continuous auto-voyage (Space)"
            >
              {isAutoTour ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span className="text-[9px]">{isAutoTour ? 'Pause' : 'Tour'}</span>
            </button>

            <button
              onPointerDown={() => startHold('down')}
              onPointerUp={endHold}
              onPointerLeave={endHold}
              onPointerCancel={endHold}
              className="btn btn-xs btn-outline border-white/20 hover:bg-white hover:text-black text-white rounded-xl px-2 font-mono cursor-pointer transition-colors active:scale-95"
              title="Down (Forward in Time) - Hold down"
            >
              <span className="text-[9px]">Down</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            <button
              onPointerDown={() => startHold('superdown')}
              onPointerUp={endHold}
              onPointerLeave={endHold}
              onPointerCancel={endHold}
              className="btn btn-xs bg-white text-black hover:bg-zinc-200 border-none font-bold rounded-xl px-2 font-mono gap-0.5 cursor-pointer transition-colors active:scale-95 shadow-md"
              title="Super Down (High Velocity Forward) - Hold down"
            >
              <span className="text-[9px] font-bold">Super</span>
              <ChevronsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* THE REEL VIEWPORT */}
        <div
          ref={tapeViewportRef}
          onPointerDown={handleTapePointerDown}
          className="flex-1 w-full relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
        >
          {/* Subtle background grid */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1.2px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Virtualized, hardware-transformed track */}
          <TapeTrack
            items={filteredItems}
            trackRef={tapeTrackRef}
            initialRange={initialRangeRef.current}
            registerSetRange={registerSetRange}
            onRendered={reapplyActive}
          />

          {/* Empty state */}
          {!total && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6 pointer-events-none">
              <Search className="w-5 h-5 text-white/30" />
              <span className="text-xs font-mono text-white/50">No milestones match</span>
            </div>
          )}

          {/* Fixed center reticle */}
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[68px] border-y-2 border-white/60 bg-white/[0.04] pointer-events-none flex items-center justify-between px-1.5 z-10 shadow-lg"
          >
            <div className="flex items-center gap-1 text-white">
              <div className="w-2 h-2 rotate-45 bg-white shadow-sm" />
              <div className="w-3 h-0.5 bg-white" />
            </div>
            <div className="flex-1 h-px bg-white/20 mx-2" />
            <div className="flex items-center gap-1 text-white">
              <div className="w-3 h-0.5 bg-white" />
              <div className="w-2 h-2 rotate-45 bg-white shadow-sm" />
            </div>
          </div>

          {/* Vignette gradients */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none z-10" />
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none z-10" />
        </div>

        {/* BOTTOM DOCK */}
        <div className="p-2.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono bg-zinc-950 z-20">
          <button
            onClick={() => jumpToIndex(0)}
            className="btn btn-xs btn-ghost text-white/60 hover:text-white hover:bg-white/10 rounded-lg gap-1 font-mono cursor-pointer"
            title="Jump to 600 BC (Ancient Dawn)"
          >
            <History className="w-3 h-3" />
            <span>Dawn (600 BC)</span>
          </button>

          <button
            onClick={jumpToRandom}
            className="btn btn-xs btn-ghost text-white/60 hover:text-white hover:bg-white/10 rounded-lg gap-1 font-mono cursor-pointer"
            title="Random Philosophical Epiphany"
          >
            <Shuffle className="w-3 h-3" />
            <span>Random</span>
          </button>

          <button
            onClick={() => jumpToIndex(total - 1)}
            className="btn btn-xs btn-ghost text-white/60 hover:text-white hover:bg-white/10 rounded-lg gap-1 font-mono cursor-pointer"
            title="Jump to 2025 AD (Contemporary)"
          >
            <span>Present</span>
            <RotateCcw className="w-3 h-3 rotate-180" />
          </button>
        </div>
      </div>

      {/* ====================================================================
          RIGHT COLUMN: DOSSIER
          ==================================================================== */}
      <div className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-black selection:bg-white selection:text-black">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search thinker, doctrine, year (#stoicism)..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-zinc-950 border border-white/20 rounded-xl pl-8 pr-7 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white transition-colors font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-white/50 mr-2">
                Milestone{' '}
                <span className="text-white font-bold">{total ? activeIndex + 1 : 0}</span> of{' '}
                {total}
              </span>

              <button
                onClick={() => stepBy(-1)}
                disabled={!total}
                className="btn btn-sm btn-outline border-white/20 text-white hover:bg-white hover:text-black rounded-xl gap-1 disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                title="Previous Milestone (Arrow Up)"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="text-xs font-mono">Prev</span>
              </button>

              <button
                onClick={() => stepBy(1)}
                disabled={!total}
                className="btn btn-sm btn-outline border-white/20 text-white hover:bg-white hover:text-black rounded-xl gap-1 disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                title="Next Milestone (Arrow Down)"
              >
                <span className="text-xs font-mono">Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Era pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {TIMELINE_ERAS.map((era) => {
              const eraCount = eraCounts[era.id] || 0;
              const isSelected = selectedEra === era.id;
              return (
                <button
                  key={era.id}
                  onClick={() => handleEraSelect(era.id)}
                  className={`px-3 py-1 rounded-full border whitespace-nowrap font-mono text-[11px] transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-white text-black font-bold border-white shadow-sm'
                      : 'bg-zinc-950 text-white/60 border-white/15 hover:border-white/40 hover:text-white'
                  }`}
                >
                  {era.name} <span className="opacity-50">({eraCount})</span>
                </button>
              );
            })}
          </div>
        </div>

        {activeItem ? (
          <Dossier item={activeItem} onTagClick={handleSearchChange} />
        ) : (
          <div className="rounded-3xl border border-white/15 bg-zinc-950 p-10 text-center space-y-3">
            <Search className="w-6 h-6 text-white/30 mx-auto" />
            <div className="text-sm font-mono text-white/70">
              No milestones match{searchQuery ? ` “${searchQuery}”` : ' this filter'}.
            </div>
            <div className="flex items-center justify-center gap-2">
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="btn btn-sm btn-outline border-white/20 text-white hover:bg-white hover:text-black rounded-xl font-mono cursor-pointer"
                >
                  Clear search
                </button>
              )}
              {selectedEra !== 'all' && (
                <button
                  onClick={() => handleEraSelect('all')}
                  className="btn btn-sm btn-outline border-white/20 text-white hover:bg-white hover:text-black rounded-xl font-mono cursor-pointer"
                >
                  All eras
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}