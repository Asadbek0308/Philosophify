import React, {
  memo,
  useState,
  useRef,
  useMemo,
  useEffect,
  useLayoutEffect,
  useCallback,
} from 'react';
import { Link } from 'react-router-dom';
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
  Compass,
  X,
  History,
  Flag,
  User,
  Volume2,
  VolumeX,
  Network,
  Pin,
  PinOff,
  Globe2,
  GraduationCap,
  Check,
  Link2,
} from 'lucide-react';
import { TIMELINE_DATA, TIMELINE_ERAS, formatYear } from '../database/timelineData';

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
const NORMAL_SPEED = 580; // px/sec for Back / Forward buttons
const SUPER_SPEED = 3400; // px/sec for Fast buttons
const TOUR_SPEED = 90; // px/sec for the gentle auto-tour
const WHEEL_EASE = 14; // how quickly wheel input is eased into the camera (per second)
const WHEEL_GAIN = 1.1; // px of travel per px of wheel delta

const BLUR_START = 1500; // px/s at which motion blur begins
const BLUR_MAX = 2.5; // px of blur at full speed
const FADE_MAX_SPEED = 300; // the dossier only animates in when the reel is this slow
const YEAR_ROLL_MS = 380; // duration of the rolling year counter

const SOUND_KEY = 'philosophify_tl_sound';

const mod = (a, n) => ((a % n) + n) % n;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// There is no year 0: 1 BC (-1) is followed by 1 AD (1)
const yearsBetween = (a, b) => (a < 0 !== b < 0 ? Math.abs(a - b) - 1 : Math.abs(a - b));
const sliderToYear = (v) => (v === 0 ? 1 : v);

// Which rows must be mounted for a camera position (quantised to blocks)
function computeRange(camY, h) {
  const a = Math.floor((-camY - OVERSCAN_Y) / STEP_Y);
  const b = Math.ceil((-camY + h + OVERSCAN_Y) / STEP_Y);
  return {
    r0: Math.floor(a / ROW_BLOCK) * ROW_BLOCK,
    r1: (Math.floor(b / ROW_BLOCK) + 1) * ROW_BLOCK,
  };
}

const DEFAULT_INITIAL_RANGE = computeRange(700 / 2 - STEP_Y / 2, 700);

const ERA_ACCENTS = {
  ancient: '#f59e0b',
  medieval: '#10b981',
  enlightenment: '#06b6d4',
  nineteenth: '#8b5cf6',
  twentieth: '#ec4899',
};
const ERA_SHORT = {
  ancient: 'Antiquity',
  medieval: 'Medieval & Renaissance',
  enlightenment: 'Early Modern',
  nineteenth: '19th Century',
  twentieth: '20th Century',
};

const BY_ID = new Map(TIMELINE_DATA.map((d) => [d.id, d]));
const YEAR_MIN = Math.floor((TIMELINE_DATA[0]?.year ?? -600) / 50) * 50;
const YEAR_MAX = Math.ceil((TIMELINE_DATA.at(-1)?.year ?? 2025) / 25) * 25;

// Lower-cased search text per milestone, built once
const SEARCH_INDEX = new Map(
  TIMELINE_DATA.map((item) => [
    item.id,
    [
      item.title,
      item.thinker,
      item.school,
      item.location,
      item.yearDisplay,
      item.description,
      ...(item.tags || []),
    ]
      .join(' \u0001 ')
      .toLowerCase(),
  ])
);

// "Meanwhile elsewhere": nearby milestones from other people and places
function findContemporaries(item, max = 3) {
  const y = item.year;
  const windowYears = y < 0 ? 70 : y < 1500 ? 60 : y < 1800 ? 20 : 12;
  const place = item.location.split(/[,/]/)[0].trim();
  return TIMELINE_DATA.filter(
    (o) =>
      o.id !== item.id &&
      o.thinker !== item.thinker &&
      o.location.split(/[,/]/)[0].trim() !== place &&
      yearsBetween(o.year, y) <= windowYears
  )
    .sort((a, b) => yearsBetween(a.year, y) - yearsBetween(b.year, y))
    .slice(0, max);
}

// Tiny synthesized "tick" (no audio files needed)
function playTick(ctx) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1600, t);
  osc.frequency.exponentialRampToValueAtTime(900, t + 0.05);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.05, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.08);
}

// ============================================================================
// STYLES
// Everything reads the theme variables set by ThemeContext, so the page works
// in every theme. The active row is toggled with a data attribute straight
// from the animation loop, so highlighting never goes through React.
// ============================================================================
const mix = (v, pct) => `color-mix(in srgb, var(${v}) ${pct}%, transparent)`;

const TIMELINE_CSS = `
.tl-root { background: var(--theme-bg); color: var(--theme-text); }
.tl-panel { background: var(--theme-surface); }
.tl-sunken { background: var(--theme-bg); }
.tl-sub { background: var(--theme-surface-subtle); }
.tl-bd { border-color: var(--theme-border); }
.tl-muted { color: var(--theme-text-muted); }
.tl-faint { color: ${mix('--theme-text', 45)}; }
.tl-tint { background: ${mix('--theme-text', 3)}; }
.tl-accent-tint { background: ${mix('--theme-accent', 10)}; border-color: ${mix('--theme-accent', 45)}; }

.tl-btn { display:inline-flex; align-items:center; justify-content:center; gap:.3rem;
  border:1px solid var(--theme-border); background: var(--theme-surface-subtle); color: var(--theme-text);
  cursor:pointer; user-select:none; text-decoration:none; transition: background-color .15s ease, color .15s ease, border-color .15s ease, transform .1s ease; }
.tl-btn:hover:not(:disabled) { background: var(--theme-accent); color: var(--theme-accent-text); border-color: var(--theme-accent); }
.tl-btn:active:not(:disabled) { transform: scale(.96); }
.tl-btn:disabled { opacity:.3; cursor:not-allowed; }
.tl-btn-primary, .tl-btn[aria-pressed="true"] { background: var(--theme-accent); color: var(--theme-accent-text); border-color: var(--theme-accent); font-weight:700; }
.tl-btn-primary:hover:not(:disabled), .tl-btn[aria-pressed="true"]:hover { background: var(--theme-accent-hover); border-color: var(--theme-accent-hover); color: var(--theme-accent-text); }
.tl-btn-ghost { background: transparent; border-color: transparent; color: var(--theme-text-muted); }
.tl-btn-ghost:hover:not(:disabled) { background: var(--theme-surface-subtle); border-color: var(--theme-border); color: var(--theme-text); }

.tl-input { background: var(--theme-surface); border:1px solid var(--theme-border); color: var(--theme-text); }
.tl-input::placeholder { color: ${mix('--theme-text', 40)}; }
.tl-input:focus { outline:none; border-color: var(--theme-accent); }
.tl-range { accent-color: var(--theme-accent); width: 100%; cursor: pointer; }

.tl-root button:focus-visible, .tl-root a:focus-visible, .tl-root [tabindex]:focus-visible, .tl-root input:focus-visible { outline: 2px solid var(--theme-accent); outline-offset: 2px; }
.tl-root ::selection { background: var(--theme-accent); color: var(--theme-accent-text); }
.tl-scroll-x { scrollbar-width: none; }
.tl-scroll-x::-webkit-scrollbar { display: none; }

/* ---- Reel rows ---- */
.tl-row { contain: layout style; }
.tl-inner { border-bottom: 1px solid ${mix('--theme-text', 6)}; transition: background-color .15s ease; }
.tl-row:hover .tl-inner { background: ${mix('--theme-text', 5)}; }
.tl-row[data-active="true"] .tl-inner { background: ${mix('--theme-accent', 12)}; }
.tl-tick { width: 20px; height: 2px; background: ${mix('--theme-text', 30)}; transform-origin: left center; transform: scale(.5,.5); transition: transform .15s ease, background-color .15s ease; }
.tl-row:hover .tl-tick { transform: scale(.7,.5); background: ${mix('--theme-text', 60)}; }
.tl-row[data-active="true"] .tl-tick { transform: scale(1,1); background: var(--theme-accent); }
.tl-pip { transition: transform .15s ease; }
.tl-row[data-active="true"] .tl-pip { transform: scale(1.5); }
.tl-year { color: ${mix('--theme-text', 50)}; transform-origin: left center; transition: color .15s ease, transform .15s ease, filter .2s ease; }
.tl-row:hover .tl-year { color: ${mix('--theme-text', 80)}; }
.tl-row[data-active="true"] .tl-year { color: var(--theme-text); font-weight: 700; transform: scale(1.12); }
.tl-name { color: ${mix('--theme-text', 70)}; transition: color .15s ease; }
.tl-row:hover .tl-name, .tl-row[data-active="true"] .tl-name { color: var(--theme-text); }
.tl-quiz .tl-year { filter: blur(5px); }

.tl-track { transition: filter .12s linear; }

/* ---- Reticle & landing pulse ---- */
.tl-reticle { border-color: ${mix('--theme-accent', 70)}; background: ${mix('--theme-accent', 5)}; }
.tl-needle { background: var(--theme-accent); }
.tl-pulse { animation: tl-pulse .45s ease-out; }
.tl-pulse .tl-needle { animation: tl-needle .45s ease-out; }
@keyframes tl-pulse {
  0% { background: ${mix('--theme-accent', 22)}; box-shadow: 0 0 0 0 ${mix('--theme-accent', 45)}; }
  100% { background: ${mix('--theme-accent', 5)}; box-shadow: 0 0 0 14px transparent; }
}
@keyframes tl-needle { 0% { transform: scale(1.6) rotate(45deg); } 100% { transform: scale(1) rotate(45deg); } }
.tl-vignette-top { background: linear-gradient(to bottom, var(--theme-surface), transparent); }
.tl-vignette-bottom { background: linear-gradient(to top, var(--theme-surface), transparent); }
.tl-dots { background-image: radial-gradient(circle at 1px 1px, currentColor 1.2px, transparent 0); background-size: 24px 24px; }

/* ---- Era mini-map ---- */
.tl-mm { display:flex; gap:2px; height: 8px; border-radius: 9999px; overflow: visible; position: relative; }
.tl-mm-seg { height: 100%; border-radius: 9999px; cursor: pointer; opacity: .55; transition: opacity .15s ease, transform .15s ease; border: none; padding: 0; }
.tl-mm-seg:hover, .tl-mm-seg[data-current="true"] { opacity: 1; }
.tl-mm-seg:hover { transform: scaleY(1.5); }
.tl-mm-dot { position:absolute; top:50%; width: 14px; height: 14px; margin-left: -7px; border-radius: 9999px;
  background: var(--theme-text); border: 3px solid var(--theme-surface); transform: translateY(-50%);
  box-shadow: 0 1px 4px rgba(0,0,0,.35); pointer-events: none; transition: left .25s cubic-bezier(.2,.8,.2,1); }

/* ---- Dossier entrance (children stagger in) ---- */
.tl-enter > * { animation: tl-enter .32s cubic-bezier(.2,.8,.2,1) both; }
.tl-enter > *:nth-child(2) { animation-delay: .03s; }
.tl-enter > *:nth-child(3) { animation-delay: .06s; }
.tl-enter > *:nth-child(4) { animation-delay: .09s; }
.tl-enter > *:nth-child(5) { animation-delay: .12s; }
.tl-enter > *:nth-child(6) { animation-delay: .15s; }
.tl-enter > *:nth-child(7) { animation-delay: .18s; }
.tl-enter > *:nth-child(n+8) { animation-delay: .21s; }
@keyframes tl-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.tl-pop { animation: tl-pop .35s cubic-bezier(.2,.8,.2,1) both; }
@keyframes tl-pop { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .tl-enter > *, .tl-pulse, .tl-pulse .tl-needle, .tl-pop { animation: none !important; }
  .tl-mm-dot, .tl-track { transition: none !important; }
}
`;

// ============================================================================
// ROLLING YEAR COUNTER — tweens the number with direct text writes
// ============================================================================
const YearRoll = memo(function YearRoll({ item, hidden, className }) {
  const elRef = useRef(null);
  const shownRef = useRef(item ? item.year : 0);
  const rafRef = useRef(0);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return undefined;
    cancelAnimationFrame(rafRef.current);
    if (!item) {
      el.textContent = '—';
      return undefined;
    }
    if (hidden) {
      el.textContent = '????';
      shownRef.current = item.year;
      return undefined;
    }
    const from = shownRef.current;
    const to = item.year;
    if (from === to || prefersReducedMotion()) {
      shownRef.current = to;
      el.textContent = item.yearDisplay;
      return undefined;
    }
    const start = performance.now();
    const step = (now) => {
      const t = clamp((now - start) / YEAR_ROLL_MS, 0, 1);
      const e = 1 - Math.pow(1 - t, 3);
      const v = Math.round(from + (to - from) * e);
      shownRef.current = v;
      el.textContent = t >= 1 ? item.yearDisplay : formatYear(v === 0 ? 1 : v, item.approx);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [item, hidden]);

  return (
    <span ref={elRef} className={className} aria-live="off">
      {item ? (hidden ? '????' : item.yearDisplay) : '—'}
    </span>
  );
});

// ============================================================================
// TAPE ROW (memoised, positioned once, never re-rendered while the reel moves)
// ============================================================================
const TapeNode = memo(function TapeNode({ item, row }) {
  const accentColor = ERA_ACCENTS[item.era] || 'var(--theme-accent)';

  return (
    <div
      data-row={row}
      className="tl-row absolute left-0 right-0 cursor-pointer select-none"
      style={{
        height: `${STEP_Y}px`,
        transform: `translate3d(0, ${row * STEP_Y}px, 0)`,
      }}
    >
      <div className="tl-inner w-full h-full px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1">
            <div className="tl-tick" />
            <div className="tl-pip w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
          </div>
          <span className="tl-year font-mono text-xs tabular-nums tracking-wider whitespace-nowrap">
            {item.yearDisplay}
          </span>
        </div>

        <div className="flex flex-col items-end min-w-0 max-w-[190px]">
          <span className="tl-name text-xs font-serif font-medium truncate max-w-full">
            {item.thinker}
          </span>
          <span className="tl-faint text-[9.5px] font-mono truncate max-w-full">
            {item.school.split(/[&(]/)[0].trim()}
          </span>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// TAPE TRACK: owns the mounted-range state
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

  useLayoutEffect(() => {
    onRendered();
  }, [nodes, onRendered]);

  return (
    <div ref={trackRef} className="tl-track absolute top-0 left-0 right-0 will-change-transform">
      {nodes}
    </div>
  );
});

// ============================================================================
// ERA MINI-MAP — coloured segments per era, a dot for the current position
// ============================================================================
const EraMiniMap = memo(function EraMiniMap({ items, activeIndex, onJump }) {
  const total = items.length;
  const segments = useMemo(() => {
    const out = [];
    items.forEach((it, i) => {
      const last = out[out.length - 1];
      if (last && last.era === it.era) last.count++;
      else out.push({ era: it.era, start: i, count: 1 });
    });
    return out;
  }, [items]);

  if (!total) return null;
  const pos = ((clamp(activeIndex, 0, total - 1) + 0.5) / total) * 100;
  const currentEra = items[clamp(activeIndex, 0, total - 1)]?.era;

  return (
    <div className="space-y-1">
      <div className="tl-mm" role="group" aria-label="Jump to an era">
        {segments.map((s) => (
          <button
            key={`${s.era}-${s.start}`}
            type="button"
            className="tl-mm-seg"
            data-current={s.era === currentEra}
            style={{ flexGrow: s.count, backgroundColor: ERA_ACCENTS[s.era] || 'var(--theme-accent)' }}
            onClick={() => onJump(s.start)}
            title={`${ERA_SHORT[s.era] || s.era} · ${s.count} milestones`}
            aria-label={`Jump to ${ERA_SHORT[s.era] || s.era}`}
          />
        ))}
        <span className="tl-mm-dot" style={{ left: `${pos}%` }} aria-hidden="true" />
      </div>
      <div className="tl-faint flex justify-between text-[9px] font-mono">
        <span>{ERA_SHORT[segments[0].era]}</span>
        <span>{ERA_SHORT[currentEra]}</span>
        <span>{ERA_SHORT[segments[segments.length - 1].era]}</span>
      </div>
    </div>
  );
});

// ============================================================================
// COMPARE STRIP — a pinned milestone next to the active one
// ============================================================================
function CompareCard({ item, label }) {
  return (
    <div className="min-w-0 flex-1 space-y-1">
      <div className="tl-faint text-[10px] font-mono uppercase tracking-widest">{label}</div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ERA_ACCENTS[item.era] }} />
        <span className="font-mono text-sm font-bold whitespace-nowrap">{item.yearDisplay}</span>
      </div>
      <div className="font-serif font-bold text-sm leading-snug line-clamp-2">{item.title}</div>
      <div className="tl-muted text-[11px] font-mono truncate">
        {item.thinker} · {item.school}
      </div>
    </div>
  );
}

function CompareStrip({ pinned, active, onGo, onUnpin }) {
  const gap = yearsBetween(pinned.year, active.year);
  const later = active.year >= pinned.year;

  return (
    <section className="tl-accent-tint tl-pop rounded-2xl border p-4 sm:p-5" aria-label="Comparison">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <CompareCard item={pinned} label="Pinned" />
        <div className="flex sm:flex-col items-center justify-center gap-1 shrink-0 px-2">
          <span className="text-2xl font-black font-mono tabular-nums">{gap.toLocaleString()}</span>
          <span className="tl-muted text-[10px] font-mono uppercase tracking-widest text-center">
            years {gap === 0 ? '' : later ? 'later →' : '← earlier'}
          </span>
        </div>
        <CompareCard item={active} label="Now viewing" />
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button type="button" onClick={() => onGo(pinned.id)} className="tl-btn rounded-lg px-2.5 h-7 text-[11px] font-mono">
          <ArrowLeft className="w-3 h-3" /> Back to pinned
        </button>
        <button type="button" onClick={onUnpin} className="tl-btn tl-btn-ghost rounded-lg px-2.5 h-7 text-[11px] font-mono">
          <PinOff className="w-3 h-3" /> Unpin
        </button>
      </div>
    </section>
  );
}

// ============================================================================
// QUIZ CARD — guess the year before the dossier is revealed
// ============================================================================
function QuizCard({ item, guess, onGuess, onSubmit }) {
  const year = sliderToYear(guess);
  return (
    <section className="tl-panel tl-bd tl-pop rounded-3xl border p-6 sm:p-10 shadow-2xl space-y-6">
      <div className="tl-muted text-[11px] font-mono uppercase tracking-widest flex items-center gap-2">
        <GraduationCap className="w-4 h-4" /> When did this happen?
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-4xl font-serif font-black leading-tight text-balance">{item.title}</h2>
        <div className="tl-muted text-sm flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> {item.thinker}
          </span>
          <span className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" /> {item.school}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> {item.location}
          </span>
        </div>
      </div>

      <div className="tl-sunken tl-bd rounded-2xl border p-5 space-y-3">
        <div className="text-center">
          <span className="text-4xl font-black font-mono tabular-nums">{formatYear(year)}</span>
        </div>
        <input
          type="range"
          min={YEAR_MIN}
          max={YEAR_MAX}
          step={1}
          value={guess}
          onChange={(e) => onGuess(Number(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit();
          }}
          className="tl-range"
          aria-label="Your guess for the year"
        />
        <div className="tl-faint flex justify-between text-[10px] font-mono">
          <span>{formatYear(YEAR_MIN)}</span>
          <span>{formatYear(YEAR_MAX)}</span>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={onSubmit} className="tl-btn tl-btn-primary rounded-xl px-4 h-10 font-mono text-xs">
          <Check className="w-4 h-4" /> Lock in guess
        </button>
      </div>
    </section>
  );
}

function QuizResult({ result, onNext }) {
  const { item, guessYear, off, points } = result;
  const verdict =
    off === 0 ? 'Perfect!' : off <= 10 ? 'Superb!' : off <= 50 ? 'Very close.' : off <= 150 ? 'Not bad.' : 'Way off — but now you know.';
  return (
    <section className="tl-accent-tint tl-pop rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="font-serif font-black text-lg">{verdict}</div>
        <div className="tl-muted text-xs font-mono">
          Actual <b style={{ color: 'var(--theme-text)' }}>{item.yearDisplay}</b> · You guessed{' '}
          <b style={{ color: 'var(--theme-text)' }}>{formatYear(guessYear)}</b> · {off.toLocaleString()} years off
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-2xl font-black font-mono">+{points}</span>
        <button type="button" onClick={onNext} className="tl-btn tl-btn-primary rounded-xl px-4 h-9 font-mono text-xs">
          Next question <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
}

// ============================================================================
// DOSSIER (memoised: only re-renders when the active milestone changes)
// ============================================================================
const Dossier = memo(function Dossier({ item, animate, isPinned, onPin, onTagClick, onGo, onCopyLink, copied }) {
  const accent = ERA_ACCENTS[item.era] || 'var(--theme-accent)';
  const contemporaries = useMemo(() => findContemporaries(item), [item]);

  return (
    <article
      aria-live="polite"
      className={`tl-panel tl-bd rounded-3xl border p-6 sm:p-10 shadow-2xl relative overflow-hidden ${animate ? 'tl-enter' : ''}`}
    >
      {/* Era colour strip */}
      <div aria-hidden="true" className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: accent }} />

      {/* Header chips + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="tl-btn tl-btn-primary rounded-lg font-mono font-black text-sm px-3.5 py-1 shadow-md pointer-events-none">
            {item.yearDisplay}
          </span>
          <span className="tl-bd border rounded-lg font-mono text-xs px-3 py-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
            {item.eraName}
          </span>
          <span className="tl-muted flex items-center gap-1.5 text-xs font-mono">
            <MapPin className="w-3.5 h-3.5 opacity-70" />
            <span>{item.location}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCopyLink}
            className="tl-btn tl-btn-ghost rounded-lg px-2 h-7 text-[11px] font-mono"
            title="Copy a link to this milestone"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Link'}</span>
          </button>
          <button
            type="button"
            onClick={onPin}
            aria-pressed={isPinned}
            className="tl-btn rounded-lg px-2 h-7 text-[11px] font-mono"
            title={isPinned ? 'Unpin (P)' : 'Pin to compare with other milestones (P)'}
          >
            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            <span>{isPinned ? 'Pinned' : 'Compare'}</span>
          </button>
        </div>
      </div>

      {/* Headline & key figure */}
      <header className="space-y-2 mb-6">
        <div className="tl-muted text-[11px] font-mono uppercase tracking-widest flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5" />
          <span>{item.school}</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-serif font-black leading-tight text-balance">{item.title}</h2>
        <div className="tl-muted text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span className="font-semibold" style={{ color: 'var(--theme-text)' }}>
              {item.thinker}
            </span>
          </span>
          {item.mapNode && (
            <Link
              to={`/map?node=${encodeURIComponent(item.mapNode)}`}
              className="tl-btn rounded-lg px-2 h-6 text-[10.5px] font-mono"
              title="See this thinker’s connections in the Neuron Map"
            >
              <Network className="w-3 h-3" /> Open in Neuron Map
            </Link>
          )}
        </div>
      </header>

      {/* Quotation (only when a real one exists) */}
      {item.axiom && (
        <figure className="tl-sunken tl-bd p-5 sm:p-6 rounded-2xl border mb-6 relative shadow-inner">
          <Quote className="w-8 h-8 absolute top-4 right-4 pointer-events-none opacity-10" />
          <blockquote className="text-base sm:text-lg font-serif italic leading-relaxed pr-8">{item.axiom}</blockquote>
          <figcaption className="tl-muted text-[11px] font-mono mt-2">— {item.thinker}</figcaption>
        </figure>
      )}

      {/* What happened */}
      <section className="tl-tint tl-bd space-y-2.5 p-5 rounded-2xl border mb-6">
        <h3 className="text-xs font-mono uppercase tracking-widest font-bold flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 opacity-70" /> What Happened
        </h3>
        <p className="tl-muted text-sm leading-relaxed">{item.description}</p>
      </section>

      {/* Shift & legacy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <section className="tl-tint tl-bd space-y-2 p-5 rounded-2xl border">
          <h3 className="text-xs font-mono uppercase tracking-widest font-bold flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 opacity-70" /> What Changed
          </h3>
          <p className="tl-muted text-xs sm:text-sm leading-relaxed">{item.paradigmShift}</p>
        </section>
        <section className="tl-tint tl-bd space-y-2 p-5 rounded-2xl border">
          <h3 className="text-xs font-mono uppercase tracking-widest font-bold flex items-center gap-2">
            <Flag className="w-3.5 h-3.5 opacity-70" /> Legacy
          </h3>
          <p className="tl-muted text-xs sm:text-sm leading-relaxed">{item.influence}</p>
        </section>
      </div>

      {/* Meanwhile elsewhere */}
      {contemporaries.length > 0 && (
        <section className="space-y-2.5 mb-6">
          <h3 className="text-xs font-mono uppercase tracking-widest font-bold flex items-center gap-2">
            <Globe2 className="w-3.5 h-3.5 opacity-70" /> Meanwhile Elsewhere
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {contemporaries.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onGo(c.id)}
                className="tl-sub tl-bd group text-left rounded-xl border p-3 space-y-1 cursor-pointer transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-1.5 text-[10.5px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ERA_ACCENTS[c.era] }} />
                  <b>{c.yearDisplay}</b>
                  <span className="tl-faint truncate">· {c.location.split(/[,/]/)[0]}</span>
                </div>
                <div className="font-serif font-bold text-xs leading-snug line-clamp-2 group-hover:underline">{c.title}</div>
                <div className="tl-muted text-[10px] font-mono truncate">{c.thinker}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Tags */}
      <div className="tl-bd flex flex-wrap items-center gap-1.5 pt-4 border-t">
        <span className="tl-faint text-[11px] font-mono mr-1.5 flex items-center gap-1">
          <Tag className="w-3 h-3" /> Tags:
        </span>
        {item.tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onTagClick(tag)}
            className="tl-btn rounded-md px-2 py-0.5 text-[10px] font-mono"
            title={`Show all milestones tagged #${tag}`}
          >
            #{tag}
          </button>
        ))}
      </div>
    </article>
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
  const [pinnedId, setPinnedId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [soundOn, setSoundOn] = useState(() => {
    try {
      return localStorage.getItem(SOUND_KEY) === '1';
    } catch {
      return false;
    }
  });

  // Quiz
  const [quizMode, setQuizMode] = useState(false);
  const [quizGuess, setQuizGuess] = useState(1000);
  const [quizResult, setQuizResult] = useState(null); // { item, guessYear, off, points }
  const [quizScore, setQuizScore] = useState({ points: 0, rounds: 0 });

  const q = searchQuery.toLowerCase().trim().replace(/^#/, '');
  const filteredItems = useMemo(() => {
    return TIMELINE_DATA.filter((item) => {
      if (selectedEra !== 'all' && item.era !== selectedEra) return false;
      if (!q) return true;
      return SEARCH_INDEX.get(item.id).includes(q);
    });
  }, [selectedEra, q]);

  const total = filteredItems.length;
  const safeIndex = total ? Math.min(activeIndex, total - 1) : 0;

  const eraCounts = useMemo(() => {
    const counts = { all: TIMELINE_DATA.length };
    TIMELINE_ERAS.forEach((e) => {
      if (e.id !== 'all') counts[e.id] = TIMELINE_DATA.filter((item) => item.era === e.id).length;
    });
    return counts;
  }, []);

  const activeItem = total ? filteredItems[safeIndex] : null;
  const firstItem = total ? filteredItems[0] : null;
  const lastItem = total ? filteredItems[total - 1] : null;
  const pinnedItem = pinnedId ? BY_ID.get(pinnedId) : null;
  const quizHidesAnswer = quizMode && !(quizResult && activeItem && quizResult.item.id === activeItem.id);

  // --------------------------------------------------------------------------
  // REFS: everything the animation loop touches lives here, outside React state
  // --------------------------------------------------------------------------
  const tapeViewportRef = useRef(null);
  const tapeTrackRef = useRef(null);
  const hudVelocityRef = useRef(null);
  const searchInputRef = useRef(null);
  const reticleRef = useRef(null);

  const itemsRef = useRef(filteredItems);
  const camYRef = useRef(0);
  const velRef = useRef(0);
  const flingRef = useRef(0);
  const wheelRemainRef = useRef(0);
  const heldDirRef = useRef(null);
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
  const speedRef = useRef(0);
  const pendingJumpRef = useRef(null);
  const soundOnRef = useRef(soundOn);
  const audioCtxRef = useRef(null);
  const interactedRef = useRef(false); // no landing pulse/sound before the first user action

  const rangeRef = useRef(DEFAULT_INITIAL_RANGE);
  const setRangeFnRef = useRef(null);

  useLayoutEffect(() => {
    itemsRef.current = filteredItems;
  }, [filteredItems]);

  useEffect(() => {
    autoTourRef.current = isAutoTour;
  }, [isAutoTour]);

  useEffect(() => {
    soundOnRef.current = soundOn;
    try {
      localStorage.setItem(SOUND_KEY, soundOn ? '1' : '0');
    } catch {
      /* storage may be disabled */
    }
  }, [soundOn]);

  useEffect(
    () => () => {
      audioCtxRef.current?.close?.();
    },
    []
  );

  const toggleSound = () => {
    // The AudioContext must be created inside a user gesture
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtxRef.current = new Ctx();
    }
    audioCtxRef.current?.resume?.();
    setSoundOn((s) => {
      if (!s) playTick(audioCtxRef.current);
      return !s;
    });
  };

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

  const applyCamY = useCallback(
    (y) => {
      if (tapeTrackRef.current) tapeTrackRef.current.style.transform = `translate3d(0, ${y}px, 0)`;
      updateRange(y, viewportHRef.current);
    },
    [updateRange]
  );

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

  // Measure the viewport (first measure centers milestone 1)
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

  const glideToRow = useCallback((targetRow, duration = 650) => {
    interactedRef.current = true;
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
      dur: prefersReducedMotion() ? 1 : duration,
    };
  }, []);

  const stepBy = useCallback(
    (n) => {
      if (!itemsRef.current.length || !n) return;
      const base = glideRef.current ? glideTargetRowRef.current : activeRowRef.current;
      glideToRow(base + n, clamp(350 + Math.abs(n) * 18, 420, 1100));
    },
    [glideToRow]
  );

  const jumpToIndex = useCallback(
    (index) => {
      const len = itemsRef.current.length;
      if (!len) return;
      const cycle = Math.floor(activeRowRef.current / len);
      glideToRow(cycle * len + clamp(index, 0, len - 1), 700);
    },
    [glideToRow]
  );

  // Shortest way around the loop to a filtered index
  const stepToIndex = useCallback(
    (idx) => {
      const len = itemsRef.current.length;
      if (!len) return;
      const base = glideRef.current ? glideTargetRowRef.current : activeRowRef.current;
      let delta = idx - mod(base, len);
      if (delta > len / 2) delta -= len;
      else if (delta < -len / 2) delta += len;
      stepBy(delta);
    },
    [stepBy]
  );

  // Go to any milestone by id; clears filters first if they hide it
  const goToId = useCallback(
    (id) => {
      const idx = itemsRef.current.findIndex((it) => it.id === id);
      if (idx >= 0) {
        stepToIndex(idx);
        return;
      }
      if (!BY_ID.has(id)) return;
      pendingJumpRef.current = id;
      setSelectedEra('all');
      setSearchQuery('');
      resetView();
    },
    [stepToIndex, resetView]
  );

  // Finish a jump that had to wait for the filters to clear
  useLayoutEffect(() => {
    const id = pendingJumpRef.current;
    if (!id) return;
    const idx = filteredItems.findIndex((it) => it.id === id);
    if (idx >= 0) {
      pendingJumpRef.current = null;
      glideToRow(idx, 1);
    }
  }, [filteredItems, glideToRow]);

  const jumpToRandom = useCallback(() => {
    const len = itemsRef.current.length;
    if (len < 2) return;
    const base = glideRef.current ? glideTargetRowRef.current : activeRowRef.current;
    const cur = mod(base, len);
    let idx = Math.floor(Math.random() * (len - 1));
    if (idx >= cur) idx += 1;
    stepToIndex(idx);
  }, [stepToIndex]);

  // --------------------------------------------------------------------------
  // SHAREABLE LINKS: ?m=<milestone id>
  // --------------------------------------------------------------------------
  useLayoutEffect(() => {
    try {
      const id = new URLSearchParams(window.location.search).get('m');
      if (id && BY_ID.has(id)) {
        const idx = itemsRef.current.findIndex((it) => it.id === id);
        if (idx >= 0) glideToRow(idx, 1);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeId = activeItem?.id;
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        const url = new URL(window.location.href);
        // In quiz mode the id would give the year away
        if (activeId && !quizMode) url.searchParams.set('m', activeId);
        else url.searchParams.delete('m');
        window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
      } catch {
        /* ignore */
      }
    }, 350);
    return () => window.clearTimeout(t);
  }, [activeId, quizMode]);

  const copyLink = useCallback(async () => {
    if (!activeId) return;
    const url = new URL(window.location.href);
    url.searchParams.set('m', activeId);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt('Copy this link:', url.toString());
    }
  }, [activeId]);

  // --------------------------------------------------------------------------
  // THE LOOP: one rAF for the whole page, direct DOM writes
  // --------------------------------------------------------------------------
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let hudAt = 0;
    let hudText = '';
    let blurShown = 0;
    const reduced = prefersReducedMotion();

    const land = () => {
      if (!interactedRef.current) return;
      const ret = reticleRef.current;
      if (ret && !reduced) {
        ret.classList.remove('tl-pulse');
        void ret.offsetWidth; // restart the CSS animation
        ret.classList.add('tl-pulse');
      }
      if (soundOnRef.current) {
        playTick(audioCtxRef.current);
        navigator.vibrate?.(6);
      }
    };

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (dt <= 0) return;

      const prevCam = camYRef.current;
      let changed = dirtyRef.current;
      dirtyRef.current = false;

      const glide = glideRef.current;
      if (glide) {
        const t = clamp((now - glide.start) / glide.dur, 0, 1);
        const ease = 1 - Math.pow(1 - t, 4);
        camYRef.current = glide.fromY + (glide.toY - glide.fromY) * ease;
        changed = true;
        if (t >= 1) glideRef.current = null;
      } else if (!(dragRef.current && dragRef.current.active)) {
        let targetV = 0;
        const held = heldDirRef.current;
        if (held === 'down') targetV = NORMAL_SPEED;
        else if (held === 'superdown') targetV = SUPER_SPEED;
        else if (held === 'up') targetV = -NORMAL_SPEED;
        else if (held === 'superup') targetV = -SUPER_SPEED;
        else if (autoTourRef.current) targetV = TOUR_SPEED;

        const k = 1 - Math.exp(-dt * ACCEL);
        velRef.current += (-targetV - velRef.current) * k;

        flingRef.current *= Math.exp(-dt * FLING_DECAY);
        if (Math.abs(flingRef.current) < 2) flingRef.current = 0;

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
      speedRef.current = speed;

      if (changed) {
        snappedRef.current = false;
        applyCamY(camYRef.current);
      } else if (!snappedRef.current) {
        // Come to rest on a whole pixel, then pulse the reticle ("landed")
        camYRef.current = Math.round(camYRef.current);
        snappedRef.current = true;
        applyCamY(camYRef.current);
        land();
      }

      // Motion blur at high speed (quantised so the style rarely changes)
      if (!reduced && tapeTrackRef.current) {
        const b =
          speed > BLUR_START ? Math.round(clamp((speed - BLUR_START) / 1200, 0, 1) * BLUR_MAX * 2) / 2 : 0;
        if (b !== blurShown) {
          blurShown = b;
          tapeTrackRef.current.style.filter = b ? `blur(${b}px)` : '';
        }
      }

      const row = Math.round((viewportHRef.current / 2 - camYRef.current - STEP_Y / 2) / STEP_Y);
      if (row !== activeRowRef.current) {
        activeRowRef.current = row;
        setActiveRowDom(row);
      }

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
  // POINTER: drag + throw + click-to-glide
  // --------------------------------------------------------------------------
  const handleTapePointerDown = (e) => {
    if (e.button !== 0) return;
    interactedRef.current = true;
    glideRef.current = null;
    flingRef.current = 0;
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
        d.startY = e.clientY;
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
          if (dt > 0.01) flingRef.current = clamp((b.y - a.y) / dt, -MAX_FLING, MAX_FLING);
        }
      } else if (!cancelled && d.row !== null) {
        glideToRow(d.row, 650);
      }
    };

    const onUp = (e) => finish(e, false);
    const onCancel = (e) => finish(e, true);
    const onBlur = () => {
      dragRef.current = null;
      heldDirRef.current = null;
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

  useEffect(() => {
    const el = tapeViewportRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      interactedRef.current = true;
      glideRef.current = null;
      heldDirRef.current = null;
      if (autoTourRef.current) setIsAutoTour(false);
      const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? viewportHRef.current : 1;
      wheelRemainRef.current = clamp(wheelRemainRef.current - e.deltaY * unit * WHEEL_GAIN, -6000, 6000);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // --------------------------------------------------------------------------
  // HELD BUTTONS
  // --------------------------------------------------------------------------
  const startHold = (direction) => (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    interactedRef.current = true;
    glideRef.current = null;
    wheelRemainRef.current = 0;
    heldDirRef.current = direction;
    if (autoTourRef.current) setIsAutoTour(false);
  };
  const endHold = () => {
    heldDirRef.current = null;
  };
  const holdProps = (direction) => ({
    onPointerDown: startHold(direction),
    onPointerUp: endHold,
    onPointerLeave: endHold,
    onPointerCancel: endHold,
    onContextMenu: (e) => e.preventDefault(),
  });

  // --------------------------------------------------------------------------
  // PIN / COMPARE
  // --------------------------------------------------------------------------
  const togglePin = useCallback(() => {
    if (!activeId) return;
    setPinnedId((p) => (p === activeId ? null : activeId));
  }, [activeId]);

  // --------------------------------------------------------------------------
  // QUIZ
  // --------------------------------------------------------------------------
  const startQuiz = () => {
    setQuizMode(true);
    setQuizResult(null);
    setQuizGuess(1000);
    setQuizScore({ points: 0, rounds: 0 });
    setPinnedId(null);
    jumpToRandom();
  };
  const endQuiz = () => {
    setQuizMode(false);
    setQuizResult(null);
  };
  const submitGuess = () => {
    if (!activeItem) return;
    const guessYear = sliderToYear(quizGuess);
    const off = yearsBetween(guessYear, activeItem.year);
    const points = Math.round(100 * Math.exp(-off / 150));
    setQuizResult({ item: activeItem, guessYear, off, points });
    setQuizScore((s) => ({ points: s.points + points, rounds: s.rounds + 1 }));
  };
  const nextQuestion = () => {
    setQuizResult(null);
    setQuizGuess(1000);
    jumpToRandom();
  };

  // --------------------------------------------------------------------------
  // KEYBOARD
  // --------------------------------------------------------------------------
  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target;
      const inField = t instanceof HTMLElement && t.closest('input, textarea, select');

      if (inField) {
        if (e.key === 'Escape' && t === searchInputRef.current) {
          handleSearchChange('');
          t.blur();
        }
        return;
      }
      interactedRef.current = true;

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
      } else if (e.key === 'Home') {
        e.preventDefault();
        jumpToIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        jumpToIndex(itemsRef.current.length - 1);
      } else if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'p' || e.key === 'P') {
        togglePin();
      } else if (e.key === ' ') {
        if (t instanceof HTMLElement && t.closest('button, a')) return;
        e.preventDefault();
        setIsAutoTour((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stepBy, jumpToIndex, handleSearchChange, togglePin]);

  // The dossier only animates in when the reel is (almost) still, so fast
  // scrolling never flickers
  const animateDossier = speedRef.current < FADE_MAX_SPEED;

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------
  return (
    <div
      className={`tl-root w-full h-[calc(100vh-5rem)] flex flex-col lg:flex-row overflow-hidden font-serif select-none ${
        quizMode ? 'tl-quiz' : ''
      }`}
    >
      <style>{TIMELINE_CSS}</style>

      {/* ====================================================================
          LEFT COLUMN: VERTICAL INFINITE REEL
          ==================================================================== */}
      <aside className="tl-panel tl-bd w-full lg:w-96 flex flex-col shrink-0 border-b lg:border-b-0 lg:border-r relative h-[26rem] lg:h-full">
        {/* TOP CONTROLS */}
        <div className="tl-panel tl-bd p-3.5 border-b flex flex-col gap-3 z-20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="tl-btn tl-btn-primary w-7 h-7 rounded-xl shadow-md pointer-events-none">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-xs font-mono font-bold uppercase tracking-wider">Chronos Reel</h1>
                <div className="tl-muted text-[10px] font-mono flex items-center gap-1">
                  <span>{total} Milestones</span>
                  <span aria-hidden="true">•</span>
                  <span ref={hudVelocityRef} className="tabular-nums">
                    0 px/s
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <div className="flex flex-col items-end min-w-0">
                <YearRoll
                  item={activeItem}
                  hidden={quizHidesAnswer}
                  className="text-base font-black font-mono tracking-tight whitespace-nowrap tabular-nums"
                />
                <span className="tl-muted text-[10.5px] font-mono truncate max-w-[130px]">
                  {activeItem ? activeItem.thinker : 'No match'}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleSound}
                aria-pressed={soundOn}
                className="tl-btn tl-btn-ghost rounded-lg w-7 h-7 shrink-0"
                title={soundOn ? 'Mute landing tick' : 'Play a soft tick (and vibrate on phones) when the reel lands'}
                aria-label="Landing sound and vibration"
              >
                {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Velocity buttons (hold to scroll) */}
          <div className="tl-sunken tl-bd flex items-center justify-between gap-1 p-1.5 rounded-2xl border">
            <button type="button" {...holdProps('superup')} className="tl-btn rounded-xl px-2 h-7 font-mono" title="Fast backward in time (hold)" aria-label="Fast backward in time, hold">
              <ChevronsUp className="w-3.5 h-3.5" />
              <span className="text-[9px] font-bold">Fast</span>
            </button>
            <button type="button" {...holdProps('up')} className="tl-btn rounded-xl px-2 h-7 font-mono" title="Backward in time (hold)" aria-label="Backward in time, hold">
              <ChevronUp className="w-3.5 h-3.5" />
              <span className="text-[9px]">Back</span>
            </button>
            <button
              type="button"
              onClick={() => {
                interactedRef.current = true;
                setIsAutoTour((p) => !p);
              }}
              aria-pressed={isAutoTour}
              className="tl-btn rounded-xl px-2.5 h-7 font-mono"
              title="Toggle the gentle auto-tour (Space)"
            >
              {isAutoTour ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span className="text-[9px]">{isAutoTour ? 'Pause' : 'Tour'}</span>
            </button>
            <button type="button" {...holdProps('down')} className="tl-btn rounded-xl px-2 h-7 font-mono" title="Forward in time (hold)" aria-label="Forward in time, hold">
              <span className="text-[9px]">Forward</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button type="button" {...holdProps('superdown')} className="tl-btn tl-btn-primary rounded-xl px-2 h-7 font-mono shadow-md" title="Fast forward in time (hold)" aria-label="Fast forward in time, hold">
              <span className="text-[9px] font-bold">Fast</span>
              <ChevronsDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Era mini-map */}
          <EraMiniMap items={filteredItems} activeIndex={safeIndex} onJump={stepToIndex} />
        </div>

        {/* THE REEL VIEWPORT */}
        <div
          ref={tapeViewportRef}
          onPointerDown={handleTapePointerDown}
          role="region"
          aria-label="Timeline reel. Drag, scroll or use the arrow keys to travel through time."
          className="flex-1 w-full relative overflow-hidden cursor-grab select-none"
          style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
        >
          <div aria-hidden="true" className="tl-dots absolute inset-0 opacity-[0.04] pointer-events-none" />

          <TapeTrack
            items={filteredItems}
            trackRef={tapeTrackRef}
            initialRange={DEFAULT_INITIAL_RANGE}
            registerSetRange={registerSetRange}
            onRendered={reapplyActive}
          />

          {!total && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6 pointer-events-none">
              <Search className="tl-faint w-5 h-5" />
              <span className="tl-muted text-xs font-mono">No milestones match</span>
            </div>
          )}

          {total > 0 && (
            <div
              ref={reticleRef}
              aria-hidden="true"
              className="tl-reticle absolute left-0 right-0 top-1/2 -translate-y-1/2 border-y-2 pointer-events-none flex items-center justify-between px-1.5 z-10"
              style={{ height: `${STEP_Y}px` }}
            >
              <div className="flex items-center gap-1">
                <div className="tl-needle w-2 h-2 rotate-45" />
                <div className="tl-needle w-3 h-0.5" />
              </div>
              <div className="flex-1" />
              <div className="flex items-center gap-1">
                <div className="tl-needle w-3 h-0.5" />
                <div className="tl-needle w-2 h-2 rotate-45" />
              </div>
            </div>
          )}

          <div className="tl-vignette-top absolute top-0 left-0 right-0 h-16 pointer-events-none z-10" />
          <div className="tl-vignette-bottom absolute bottom-0 left-0 right-0 h-16 pointer-events-none z-10" />
        </div>

        {/* BOTTOM DOCK */}
        <div className="tl-panel tl-bd p-2.5 border-t flex items-center justify-between text-[10px] font-mono z-20">
          <button
            type="button"
            onClick={() => jumpToIndex(0)}
            disabled={!total}
            className="tl-btn tl-btn-ghost rounded-lg px-2 h-6 font-mono"
            title="Jump to the earliest milestone (Home)"
          >
            <History className="w-3 h-3" />
            <span>Earliest{firstItem && !quizMode ? ` · ${firstItem.yearDisplay}` : ''}</span>
          </button>
          <button
            type="button"
            onClick={jumpToRandom}
            disabled={total < 2}
            className="tl-btn tl-btn-ghost rounded-lg px-2 h-6 font-mono"
            title="Jump to a random milestone"
          >
            <Shuffle className="w-3 h-3" />
            <span>Random</span>
          </button>
          <button
            type="button"
            onClick={() => jumpToIndex(total - 1)}
            disabled={!total}
            className="tl-btn tl-btn-ghost rounded-lg px-2 h-6 font-mono"
            title="Jump to the latest milestone (End)"
          >
            <span>Latest{lastItem && !quizMode ? ` · ${lastItem.yearDisplay}` : ''}</span>
            <Flag className="w-3 h-3" />
          </button>
        </div>
      </aside>

      {/* ====================================================================
          RIGHT COLUMN: DOSSIER
          ==================================================================== */}
      <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 select-text">
        <div className="space-y-4">
          <div className="tl-bd flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b pb-4">
            {/* Search */}
            <div className="relative w-full xl:w-80">
              <Search className="tl-faint w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="search"
                aria-label="Search milestones"
                placeholder="Search thinker, idea, place, year…  ( / )"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="tl-input w-full rounded-xl pl-8 pr-7 py-2 text-xs font-mono transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="tl-faint absolute right-2.5 top-1/2 -translate-y-1/2 hover:opacity-100 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Stepper + quiz */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="tl-muted text-[11px] font-mono mr-1 tabular-nums">
                Milestone{' '}
                <span className="font-bold" style={{ color: 'var(--theme-text)' }}>
                  {total ? safeIndex + 1 : 0}
                </span>{' '}
                of {total}
              </span>
              <button type="button" onClick={() => stepBy(-1)} disabled={!total} className="tl-btn rounded-xl px-3 h-8" title="Previous milestone (↑)">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="text-xs font-mono">Prev</span>
              </button>
              <button type="button" onClick={() => stepBy(1)} disabled={!total} className="tl-btn rounded-xl px-3 h-8" title="Next milestone (↓)">
                <span className="text-xs font-mono">Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <div className="tl-bd w-px h-6 border-l mx-1" aria-hidden="true" />
              {quizMode ? (
                <>
                  <span className="tl-muted text-[11px] font-mono tabular-nums">
                    Score <b style={{ color: 'var(--theme-text)' }}>{quizScore.points}</b> · {quizScore.rounds} rounds
                  </span>
                  <button type="button" onClick={endQuiz} aria-pressed className="tl-btn rounded-xl px-3 h-8 text-xs font-mono">
                    <X className="w-3.5 h-3.5" /> End quiz
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={startQuiz}
                  disabled={total < 2}
                  className="tl-btn rounded-xl px-3 h-8 text-xs font-mono"
                  title="Guess the year of random milestones"
                >
                  <GraduationCap className="w-3.5 h-3.5" /> Quiz
                </button>
              )}
            </div>
          </div>

          {/* Era pills */}
          <div className="tl-scroll-x flex items-center gap-1.5 overflow-x-auto pb-1 text-xs" role="group" aria-label="Filter by era">
            {TIMELINE_ERAS.map((era) => {
              const isSelected = selectedEra === era.id;
              const accent = ERA_ACCENTS[era.id];
              return (
                <button
                  key={era.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleEraSelect(era.id)}
                  className="tl-btn px-3 py-1 rounded-full whitespace-nowrap font-mono text-[11px]"
                >
                  {accent && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: accent }} />}
                  {era.name} <span className="opacity-60">({eraCounts[era.id] || 0})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Compare strip */}
        {!quizMode && pinnedItem && activeItem && pinnedItem.id !== activeItem.id && (
          <CompareStrip pinned={pinnedItem} active={activeItem} onGo={goToId} onUnpin={() => setPinnedId(null)} />
        )}
        {!quizMode && pinnedItem && activeItem && pinnedItem.id === activeItem.id && (
          <p className="tl-muted text-[11px] font-mono flex items-center gap-1.5">
            <Pin className="w-3 h-3" /> Pinned. Scroll to another milestone to compare.
          </p>
        )}

        {activeItem ? (
          quizHidesAnswer ? (
            <QuizCard key={activeItem.id} item={activeItem} guess={quizGuess} onGuess={setQuizGuess} onSubmit={submitGuess} />
          ) : (
            <>
              {quizMode && quizResult && <QuizResult result={quizResult} onNext={nextQuestion} />}
              <Dossier
                key={activeItem.id}
                item={activeItem}
                animate={animateDossier}
                isPinned={pinnedId === activeItem.id}
                onPin={togglePin}
                onTagClick={handleSearchChange}
                onGo={goToId}
                onCopyLink={copyLink}
                copied={copied}
              />
            </>
          )
        ) : (
          <div className="tl-panel tl-bd rounded-3xl border p-10 text-center space-y-3">
            <Search className="tl-faint w-6 h-6 mx-auto" />
            <div className="tl-muted text-sm font-mono">
              No milestones match{searchQuery ? ` “${searchQuery}”` : ' this filter'}.
            </div>
            <div className="flex items-center justify-center gap-2">
              {searchQuery && (
                <button type="button" onClick={() => handleSearchChange('')} className="tl-btn rounded-xl px-3 h-8 font-mono text-xs">
                  Clear search
                </button>
              )}
              {selectedEra !== 'all' && (
                <button type="button" onClick={() => handleEraSelect('all')} className="tl-btn rounded-xl px-3 h-8 font-mono text-xs">
                  All eras
                </button>
              )}
            </div>
          </div>
        )}

        <p className="tl-faint hidden lg:block text-[10.5px] font-mono text-center">
          ↑ ↓ step · PgUp PgDn jump 10 · Home End earliest / latest · Space tour · P pin · / search
        </p>
      </main>
    </div>
  );
}