import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useLayoutEffect,
  useCallback,
} from 'react';
import {
  Network,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  ArrowRight,
  Link2,
  Quote,
  Tag,
  Pause,
  Play,
  Shuffle,
} from 'lucide-react';
import { getEnrichedGraphData } from '../database/mapData';
import { useTheme } from '../context/useTheme';

// =========================================================
// TUNING
// =========================================================
const REPULSION = 3200;
const MAX_REPEL_DIST = 1400;
const LINK_DIST = 120;
const LINK_K = 0.15;
const GRAVITY = 0.006;
const VELOCITY_DECAY = 0.6;
const COLLISION_PAD = 6;
const ALPHA_DECAY = 0.02;
const ALPHA_MIN = 0.003;
const DRAG_ALPHA = 0.3;
const DRAG_THRESHOLD = 3;
const MAX_CATCHUP_STEPS = 3;

const MIN_ZOOM = 0.08;
const MAX_ZOOM = 4;
const LABEL_ZOOM_THRESHOLD = 0.65;

const TAG_CHIP_COUNT = 24;
const TAG_MIN_NODES = 4;
const MIN_SEARCH_CHARS = 2;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const getNodeRadius = (deg) => {
  if (deg < 3) return 4.5;
  if (deg < 10) return 7;
  if (deg < 25) return 10.5;
  return 16;
};

// Pick black/white text for a given background colour (hex only; safe fallback).
const readableOn = (color) => {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(color || '').trim());
  if (!m) return '#ffffff';
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#111111' : '#ffffff';
};

const STYLE_SHEET = `
.nm-root .zoomed-out .lbl-minor:not(.lbl-on){display:none}
.nm-root .nm-node{outline:none}
.nm-root .nm-node:focus-visible .nm-shape{stroke:var(--theme-accent);stroke-width:3}
.nm-root button:focus-visible,.nm-root input:focus-visible{outline:2px solid var(--theme-accent);outline-offset:2px}
.nm-root .node-label{pointer-events:none;paint-order:stroke;stroke:var(--theme-bg);stroke-width:3px;stroke-linejoin:round}
.nm-root .scrollbar-none{scrollbar-width:none}
.nm-root .scrollbar-none::-webkit-scrollbar{display:none}
`;

// =========================================================
// NODE (rendered once; all highlight states are painted imperatively)
// =========================================================
const NodeItem = React.memo(function NodeItem({
  node,
  degree,
  radius,
  theme,
  registerNodeRef,
  onNodePointerDown,
  onEnter,
  onLeave,
  onSelect,
}) {
  const isMinor = degree < 3;
  return (
    <g
      ref={(el) => registerNodeRef(node.id, el)}
      className="nm-node"
      style={{ cursor: 'grab' }}
      tabIndex={0}
      role="button"
      aria-label={`${node.label}, ${node.category}, ${degree} connections`}
      onPointerEnter={(e) => onEnter(e, node.id)}
      onPointerLeave={onLeave}
      onFocus={() => onEnter(null, node.id)}
      onBlur={onLeave}
      onPointerDown={(e) => onNodePointerDown(e, node.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(node.id);
        }
      }}
    >
      <circle r={radius + 8} fill="transparent" />
      {theme === 'cyberpunk' ? (
        <rect
          className="nm-shape"
          x={-radius}
          y={-radius}
          width={radius * 2}
          height={radius * 2}
          strokeWidth={1.2}
        />
      ) : (
        <circle className="nm-shape" r={radius} strokeWidth={1} />
      )}
      <text
        className={`node-label ${isMinor ? 'lbl-minor' : ''}`}
        y={radius + 12}
        textAnchor="middle"
        fontSize={degree >= 25 ? 12.5 : degree >= 10 ? 11 : degree >= 3 ? 10.5 : 9.5}
        fontFamily='"Playfair Display", "EB Garamond", Georgia, serif'
      >
        {node.label}
      </text>
    </g>
  );
});

const EdgeItem = React.memo(function EdgeItem({ idx, registerLineRef }) {
  return (
    <line
      ref={(el) => registerLineRef(idx, el)}
      vectorEffect="non-scaling-stroke"
    />
  );
});

// =========================================================
// MAIN
// =========================================================
export default function NeuronMap() {
  const { theme, currentThemeObj } = useTheme();
  const { nodes: staticNodes, links: staticLinks } = useMemo(() => getEnrichedGraphData(), []);

  // ---- Graph structure (links are already deduplicated in the data layer,
  //      but we dedupe again so degree always equals real synapse count)
  const { degreeMap, neighborMap, cleanLinks } = useMemo(() => {
    const deg = new Map();
    const nb = new Map();
    staticNodes.forEach((n) => {
      deg.set(n.id, 0);
      nb.set(n.id, new Set());
    });
    const seen = new Set();
    const out = [];
    staticLinks.forEach((l) => {
      if (!nb.has(l.source) || !nb.has(l.target) || l.source === l.target) return;
      const key = l.source < l.target ? `${l.source}|${l.target}` : `${l.target}|${l.source}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push(l);
      deg.set(l.source, deg.get(l.source) + 1);
      deg.set(l.target, deg.get(l.target) + 1);
      nb.get(l.source).add(l.target);
      nb.get(l.target).add(l.source);
    });
    return { degreeMap: deg, neighborMap: nb, cleanLinks: out };
  }, [staticNodes, staticLinks]);

  // ---- Mutable simulation state
  const sim = useMemo(() => {
    const nodes = staticNodes.map((n, i) => {
      const angle = i * 2.399963;
      const r = 40 * Math.sqrt(i + 0.5);
      const degree = degreeMap.get(n.id) || 0;
      return {
        id: n.id,
        x: Math.cos(angle) * r + (Math.random() - 0.5) * 6,
        y: Math.sin(angle) * r + (Math.random() - 0.5) * 6,
        vx: 0,
        vy: 0,
        fx: null,
        fy: null,
        degree,
        radius: getNodeRadius(degree),
      };
    });
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const links = cleanLinks.map((l) => ({
      source: byId.get(l.source),
      target: byId.get(l.target),
      label: l.label,
    }));
    return { nodes, byId, links };
  }, [staticNodes, cleanLinks, degreeMap]);

  const nodeDataMap = useMemo(() => new Map(staticNodes.map((n) => [n.id, n])), [staticNodes]);

  // ---- Tag chips computed from the real data
  const tagChips = useMemo(() => {
    const counts = new Map();
    staticNodes.forEach((n) => {
      (n.tags || []).forEach((t) => {
        const k = String(t).toLowerCase();
        counts.set(k, (counts.get(k) || 0) + 1);
      });
    });
    return [...counts.entries()]
      .filter(([, c]) => c >= TAG_MIN_NODES)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, TAG_CHIP_COUNT);
  }, [staticNodes]);

  const categoryCounts = useMemo(() => {
    const counts = { all: staticNodes.length, thinker: 0, idea: 0, place: 0 };
    staticNodes.forEach((n) => {
      if (counts[n.category] !== undefined) counts[n.category]++;
    });
    return counts;
  }, [staticNodes]);

  // ---- UI state
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [searchTag, setSearchTag] = useState('');
  const [selectedTagChip, setSelectedTagChip] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [physicsOn, setPhysicsOn] = useState(true);

  const cleanTag = searchTag.trim().toLowerCase().replace(/^#/, '');
  const activeQuery = cleanTag.length >= MIN_SEARCH_CHARS ? cleanTag : '';

  // ---- Refs
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const camRef = useRef({ x: 0, y: 0, k: 0.9 });
  const camGroupRef = useRef(null);
  const zoomLabelRef = useRef(null);
  const animRef = useRef(null);
  const autoFitRef = useRef(true);
  const fitCacheRef = useRef({ t: 0, v: null });
  const stepCameraRef = useRef(null);
  const nodeEls = useRef(new Map());
  const lineEls = useRef([]);
  const dragRef = useRef(null);
  const alphaRef = useRef(1);
  const alphaTargetRef = useRef(0);
  const physicsOnRef = useRef(true);
  const pinchRef = useRef({ dist: 0, k: 1, active: false });
  const hoverRef = useRef(null);
  const selRef = useRef(null);
  const filterRef = useRef({ cat: 'all', chip: '', q: '' });
  const themeRef = useRef({ theme, obj: currentThemeObj });

  selRef.current = selectedNodeId;
  filterRef.current = { cat: selectedCategory, chip: selectedTagChip, q: activeQuery };
  themeRef.current = { theme, obj: currentThemeObj };

  useEffect(() => {
    physicsOnRef.current = physicsOn;
  }, [physicsOn]);

  const registerNodeRef = useCallback((id, el) => {
    if (el) nodeEls.current.set(id, el);
    else nodeEls.current.delete(id);
  }, []);
  const registerLineRef = useCallback((idx, el) => {
    lineEls.current[idx] = el;
  }, []);

  // ---------------------------------------------------------
  // Theme -> CSS variables (with safe fallbacks for missing fields)
  // ---------------------------------------------------------
  const themeVars = useMemo(() => {
    const t = currentThemeObj || {};
    const accent = t.accent || '#6366f1';
    return {
      '--theme-bg': t.canvasBg || t.bg || '#0f172a',
      '--theme-surface': t.surface || t.canvasBg || '#111827',
      '--theme-surface-subtle': t.surfaceSubtle || 'rgba(127,127,127,0.14)',
      '--theme-border': t.border || t.borderStrong || 'rgba(127,127,127,0.4)',
      '--theme-text': t.text || '#e5e7eb',
      '--theme-text-muted': t.textMuted || 'rgba(127,127,127,0.9)',
      '--theme-accent': accent,
      '--theme-accent-text': t.accentText || readableOn(accent),
    };
  }, [currentThemeObj]);

  // ---------------------------------------------------------
  // Camera
  // ---------------------------------------------------------
  const applyCam = useCallback(() => {
    const c = camRef.current;
    camGroupRef.current?.setAttribute(
      'transform',
      `translate(${c.x.toFixed(2)}, ${c.y.toFixed(2)}) scale(${c.k.toFixed(4)})`
    );
    containerRef.current?.classList.toggle('zoomed-out', c.k < LABEL_ZOOM_THRESHOLD);
    if (zoomLabelRef.current) zoomLabelRef.current.textContent = `${Math.round(c.k * 100)}%`;
  }, []);

  const updateCam = useCallback(
    (next) => {
      camRef.current = typeof next === 'function' ? next(camRef.current) : next;
      applyCam();
    },
    [applyCam]
  );

  const getContainerSize = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    return { w: rect?.width || 1000, h: rect?.height || 600 };
  };

  const screenToWorld = (clientX, clientY) => {
    const rect = containerRef.current.getBoundingClientRect();
    const c = camRef.current;
    return { x: (clientX - rect.left - c.x) / c.k, y: (clientY - rect.top - c.y) / c.k };
  };

  // Auto-fit that ignores the outer 2% of outliers (cached ~100ms)
  const computeFit = useCallback(
    (force = false) => {
      const now = performance.now();
      if (!force && fitCacheRef.current.v && now - fitCacheRef.current.t < 100) {
        return fitCacheRef.current.v;
      }
      const { w, h } = getContainerSize();
      const nodes = sim.nodes;
      if (!nodes.length) return null;

      const xs = nodes.map((p) => p.x).sort((a, b) => a - b);
      const ys = nodes.map((p) => p.y).sort((a, b) => a - b);
      const trim = nodes.length >= 20 ? Math.floor(nodes.length * 0.02) : 0;
      const minX = xs[trim] - 16;
      const maxX = xs[xs.length - 1 - trim] + 16;
      const minY = ys[trim] - 16;
      const maxY = ys[ys.length - 1 - trim] + 30;

      const pad = 60;
      const bw = Math.max(maxX - minX, 1) + pad * 2;
      const bh = Math.max(maxY - minY, 1) + pad * 2;
      const k = clamp(Math.min(w / bw, h / bh), MIN_ZOOM, 2);
      const v = { k, x: w / 2 - ((minX + maxX) / 2) * k, y: h / 2 - ((minY + maxY) / 2) * k };
      fitCacheRef.current = { t: now, v };
      return v;
    },
    [sim]
  );

  const animateCam = useCallback((to, dur = 700, followId = null) => {
    autoFitRef.current = false;
    animRef.current = { from: { ...camRef.current }, to, start: performance.now(), dur, followId };
  }, []);

  const focusTarget = useCallback(
    (node, kMin = 0.9) => {
      const { w, h } = getContainerSize();
      const isMobile = w < 640;
      const cx = isMobile ? w / 2 : Math.max(w * 0.35, w / 2 - 190);
      const cy = isMobile ? h * 0.25 : h / 2;
      const k = Math.max(camRef.current.k, kMin);
      return { k, x: cx - node.x * k, y: cy - node.y * k };
    },
    []
  );

  stepCameraRef.current = () => {
    const a = animRef.current;
    if (a) {
      const t = Math.min(1, (performance.now() - a.start) / a.dur);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const target = a.followId && sim.byId.get(a.followId)
        ? focusTarget(sim.byId.get(a.followId), a.to.k)
        : a.to;
      updateCam({
        k: a.from.k + (target.k - a.from.k) * e,
        x: a.from.x + (target.x - a.from.x) * e,
        y: a.from.y + (target.y - a.from.y) * e,
      });
      if (t >= 1) animRef.current = null;
      return;
    }

    if (!autoFitRef.current) return;
    const target = computeFit();
    if (!target) return;
    const c = camRef.current;
    const f = 0.05;
    const next = {
      k: c.k + (target.k - c.k) * f,
      x: c.x + (target.x - c.x) * f,
      y: c.y + (target.y - c.y) * f,
    };
    updateCam(next);
    const calm = alphaRef.current < ALPHA_MIN || !physicsOnRef.current;
    const close =
      Math.abs(target.k - next.k) < 0.002 &&
      Math.abs(target.x - next.x) < 1 &&
      Math.abs(target.y - next.y) < 1;
    if (calm && close) autoFitRef.current = false;
  };

  useLayoutEffect(() => {
    const { w, h } = getContainerSize();
    updateCam({ k: 0.5, x: w / 2, y: h / 2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const zoomBy = (factor) => {
    animRef.current = null;
    autoFitRef.current = false;
    const { w, h } = getContainerSize();
    const mx = w / 2;
    const my = h / 2;
    updateCam((c) => {
      const k = clamp(c.k * factor, MIN_ZOOM, MAX_ZOOM);
      const r = k / c.k;
      return { k, x: mx - (mx - c.x) * r, y: my - (my - c.y) * r };
    });
  };

  const resetCamera = () => {
    const target = computeFit(true);
    if (target) animateCam(target, 800);
  };

  const jumpToNode = useCallback(
    (nodeId) => {
      const target = sim.byId.get(nodeId);
      if (!target) return;
      setSelectedNodeId(nodeId);
      animateCam(focusTarget(target), 750, nodeId);
    },
    [sim, animateCam, focusTarget]
  );

  // ---------------------------------------------------------
  // Imperative painting (hover/selection/filter) — no React re-render
  // ---------------------------------------------------------
  const paint = useCallback(() => {
    const { theme: th, obj } = themeRef.current;
    const sel = selRef.current;
    const hov = hoverRef.current;
    const { cat, chip, q } = filterRef.current;
    const filtering = !!(chip || q);

    const matches = (n) => {
      if (!n) return false;
      if (chip) return (n.tags || []).includes(chip);
      return (
        n.label.toLowerCase().includes(q) ||
        n.category.includes(q) ||
        (n.tags || []).some((t) => t.includes(q))
      );
    };
    const catOk = (n) => cat === 'all' || n?.category === cat;

    const activeId = sel || hov;
    const nb = activeId ? neighborMap.get(activeId) : null;

    const muted = obj.textMuted;
    const accent = obj.accent;
    const border = obj.borderStrong || 'rgba(255,255,255,0.35)';

    for (const n of staticNodes) {
      const el = nodeEls.current.get(n.id);
      if (!el) continue;
      const isSel = n.id === sel;
      const isHov = n.id === hov;
      const inActive = nb && (n.id === activeId || nb.has(n.id));
      const m = filtering && matches(n);

      let opacity = 1;
      if (sel) opacity = n.id === sel ? 1 : inActive ? 0.95 : 0.15;
      else if (hov) opacity = n.id === hov ? 1 : inActive ? 0.9 : 0.25;
      else if (!catOk(n)) opacity = 0.12;
      else if (filtering) opacity = m ? 1 : 0.25;

      const highlighted = isSel || isHov || (!sel && m);
      let fill = obj.canvasNodeRegular;
      if (n.category === 'place') fill = obj.canvasNodeHub;
      else if (n.category === 'idea') fill = obj.accent;
      if (isSel || highlighted) fill = accent;

      el.setAttribute('opacity', opacity);
      const shape = el.querySelector('.nm-shape');
      if (shape) {
        shape.setAttribute('fill', fill);
        shape.setAttribute('stroke', isSel ? accent : border);
        shape.setAttribute('stroke-width', isSel ? (th === 'cyberpunk' ? 2.2 : 2) : th === 'cyberpunk' ? 1.2 : 1);
      }
      const label = el.querySelector('text');
      if (label) {
        label.setAttribute('fill', highlighted ? obj.text : muted);
        label.setAttribute('font-weight', isSel || isHov || (degreeMap.get(n.id) || 0) >= 25 ? 'bold' : 'normal');
        label.classList.toggle('lbl-on', !!(isSel || isHov || inActive || m));
      }
    }

    const links = sim.links;
    for (let i = 0; i < links.length; i++) {
      const el = lineEls.current[i];
      if (!el) continue;
      const sId = links[i].source.id;
      const tId = links[i].target.id;
      const sData = nodeDataMap.get(sId);
      const tData = nodeDataMap.get(tId);
      const touchSel = sel && (sId === sel || tId === sel);
      const touchHov = hov && (sId === hov || tId === hov);
      const bothMatch = filtering && matches(sData) && matches(tData);

      let stroke = border;
      let width = 1;
      let opacity = 0.35;
      if (sel) {
        if (touchSel) {
          stroke = accent;
          width = 2.4;
          opacity = 1;
        } else {
          stroke = obj.canvasLink || border;
          width = 0.6;
          opacity = 0.06;
        }
      } else if (touchHov) {
        stroke = accent;
        width = 2;
        opacity = 0.95;
      } else if (filtering) {
        if (bothMatch) {
          stroke = accent;
          width = 1.6;
          opacity = 0.85;
        } else {
          opacity = 0.06;
        }
      }
      if (!touchSel && cat !== 'all' && !(catOk(sData) && catOk(tData))) {
        opacity = Math.min(opacity, 0.05);
      }
      el.setAttribute('stroke', stroke);
      el.setAttribute('stroke-width', width);
      el.setAttribute('opacity', opacity);
    }
  }, [staticNodes, neighborMap, nodeDataMap, sim, degreeMap]);

  useLayoutEffect(() => {
    paint();
  }, [paint, selectedNodeId, selectedCategory, selectedTagChip, activeQuery, theme, currentThemeObj]);

  const onNodeEnter = useCallback(
    (e, id) => {
      if (e && e.pointerType === 'touch') return;
      if (dragRef.current?.moved) return;
      hoverRef.current = id;
      paint();
    },
    [paint]
  );
  const onNodeLeave = useCallback(() => {
    hoverRef.current = null;
    paint();
  }, [paint]);

  // ---------------------------------------------------------
  // Simulation DOM writer
  // ---------------------------------------------------------
  const applyPositions = useCallback(() => {
    const nodes = sim.nodes;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const el = nodeEls.current.get(n.id);
      if (el) el.setAttribute('transform', `translate(${n.x.toFixed(2)},${n.y.toFixed(2)})`);
    }
    const links = sim.links;
    for (let i = 0; i < links.length; i++) {
      const el = lineEls.current[i];
      if (!el) continue;
      const l = links[i];
      el.setAttribute('x1', l.source.x.toFixed(2));
      el.setAttribute('y1', l.source.y.toFixed(2));
      el.setAttribute('x2', l.target.x.toFixed(2));
      el.setAttribute('y2', l.target.y.toFixed(2));
    }
  }, [sim]);

  useLayoutEffect(() => {
    applyPositions();
  });

  // ---------------------------------------------------------
  // Physics step
  // ---------------------------------------------------------
  const tick = useCallback(() => {
    let alpha = alphaRef.current;
    const target = alphaTargetRef.current;
    alpha += (target - alpha) * ALPHA_DECAY;
    alphaRef.current = alpha;
    if (alpha < ALPHA_MIN && target === 0) return false;

    const nodes = sim.nodes;
    const links = sim.links;
    const n = nodes.length;
    const maxD2 = MAX_REPEL_DIST * MAX_REPEL_DIST;

    for (let i = 0; i < n; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < n; j++) {
        const b = nodes[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let d2 = dx * dx + dy * dy;
        if (d2 > maxD2) continue;
        if (d2 < 1) {
          dx = (Math.random() - 0.5) * 2;
          dy = (Math.random() - 0.5) * 2;
          d2 = dx * dx + dy * dy + 1;
        }
        const dist = Math.sqrt(d2);
        const w = ((REPULSION * alpha) / d2) * (1 + (a.radius + b.radius) / 30);
        const rx = dx * w;
        const ry = dy * w;
        a.vx += rx;
        a.vy += ry;
        b.vx -= rx;
        b.vy -= ry;

        const minD = a.radius + b.radius + COLLISION_PAD;
        if (dist < minD) {
          const push = ((minD - dist) / dist) * 0.35;
          const cx = dx * push;
          const cy = dy * push;
          a.vx += cx;
          a.vy += cy;
          b.vx -= cx;
          b.vy -= cy;
        }
      }
    }

    for (let i = 0; i < links.length; i++) {
      const l = links[i];
      const s = l.source;
      const t = l.target;
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const diff = ((dist - LINK_DIST) / dist) * alpha * LINK_K;
      const fx = dx * diff;
      const fy = dy * diff;
      const total = s.degree + t.degree || 1;
      const sShare = t.degree / total;
      const tShare = s.degree / total;
      s.vx += fx * (0.25 + sShare);
      s.vy += fy * (0.25 + sShare);
      t.vx -= fx * (0.25 + tShare);
      t.vy -= fy * (0.25 + tShare);
    }

    for (let i = 0; i < n; i++) {
      const p = nodes[i];
      const g = p.degree === 0 ? GRAVITY * 2.5 : GRAVITY;
      p.vx -= p.x * g * alpha;
      p.vy -= p.y * g * alpha;
      if (p.fx !== null) {
        p.x = p.fx;
        p.vx = 0;
      } else {
        p.vx *= VELOCITY_DECAY;
        p.x += p.vx;
      }
      if (p.fy !== null) {
        p.y = p.fy;
        p.vy = 0;
      } else {
        p.vy *= VELOCITY_DECAY;
        p.y += p.vy;
      }
    }
    return true;
  }, [sim]);

  // Fixed-timestep loop (refresh-rate independent, capped catch-up)
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const STEP = 1000 / 60;
    const loop = (now) => {
      acc += Math.min(now - last, 100);
      last = now;
      let moved = false;
      let steps = 0;
      while (acc >= STEP) {
        if (steps < MAX_CATCHUP_STEPS && physicsOnRef.current && tick()) moved = true;
        steps++;
        acc -= STEP;
      }
      if (moved) applyPositions();
      stepCameraRef.current?.();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tick, applyPositions]);

  const reSpread = () => {
    sim.nodes.forEach((p, i) => {
      const angle = Math.random() * Math.PI * 2;
      const r = 50 * Math.sqrt(i + 0.5) + Math.random() * 80;
      p.x = Math.cos(angle) * r;
      p.y = Math.sin(angle) * r;
      p.vx = 0;
      p.vy = 0;
      p.fx = null;
      p.fy = null;
    });
    alphaRef.current = 1;
    setPhysicsOn(true);
    physicsOnRef.current = true;
    animRef.current = null;
    autoFitRef.current = true;
    applyPositions();
  };

  // ---------------------------------------------------------
  // Deep linking: ?node=…&tag=… (query params; legacy #hash also read)
  // ---------------------------------------------------------
  useEffect(() => {
    let timer = 0;
    try {
      const params = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const nodeParam = params.get('node') || hash.get('node');
      const tagParam = params.get('tag') || hash.get('tag');
      if (tagParam) setSelectedTagChip(tagParam.toLowerCase());
      if (nodeParam && sim.byId.has(nodeParam)) {
        setSelectedNodeId(nodeParam);
        // wait for the layout to settle a little, then glide to the node
        timer = window.setTimeout(() => jumpToNode(nodeParam), 1200);
      }
    } catch {
      /* ignore */
    }
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (selectedNodeId) url.searchParams.set('node', selectedNodeId);
      else url.searchParams.delete('node');
      if (selectedTagChip) url.searchParams.set('tag', selectedTagChip);
      else url.searchParams.delete('tag');
      url.hash = '';
      window.history.replaceState(null, '', url.pathname + url.search);
    } catch {
      /* ignore */
    }
  }, [selectedNodeId, selectedTagChip]);

  // ---------------------------------------------------------
  // Keyboard: Esc closes inspector / clears search, "/" focuses search
  // ---------------------------------------------------------
  useEffect(() => {
    const onKeyDown = (e) => {
      const inField = /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName || '');
      if (e.key === 'Escape') {
        if (inField) {
          setSearchTag('');
          document.activeElement.blur();
        } else {
          setSelectedNodeId(null);
        }
      } else if (e.key === '/' && !inField) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const jumpToFirstMatch = () => {
    if (!activeQuery) return;
    const hits = staticNodes
      .filter(
        (n) =>
          n.label.toLowerCase().includes(activeQuery) ||
          (n.tags || []).some((t) => t.includes(activeQuery))
      )
      .sort((a, b) => {
        const as = a.label.toLowerCase().startsWith(activeQuery) ? 1 : 0;
        const bs = b.label.toLowerCase().startsWith(activeQuery) ? 1 : 0;
        return bs - as || (degreeMap.get(b.id) || 0) - (degreeMap.get(a.id) || 0);
      });
    if (hits[0]) jumpToNode(hits[0].id);
  };

  // ---------------------------------------------------------
  // Pointer handling (pan, node drag) + wheel + native touch pinch
  // ---------------------------------------------------------
  const onBackgroundPointerDown = (e) => {
    if (e.button !== 0 || pinchRef.current.active) return;
    const c = camRef.current;
    dragRef.current = {
      type: 'pan',
      startX: e.clientX,
      startY: e.clientY,
      camX: c.x,
      camY: c.y,
      moved: false,
    };
  };

  const onNodePointerDown = useCallback(
    (e, id) => {
      e.stopPropagation();
      if (e.button !== 0 || pinchRef.current.active) return;
      const node = sim.byId.get(id);
      if (!node) return;
      const w = screenToWorld(e.clientX, e.clientY);
      dragRef.current = {
        type: 'node',
        id,
        startX: e.clientX,
        startY: e.clientY,
        offX: node.x - w.x,
        offY: node.y - w.y,
        moved: false,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sim]
  );

  const releaseDrag = useCallback(() => {
    const d = dragRef.current;
    if (d?.type === 'node') {
      const node = sim.byId.get(d.id);
      if (node) {
        node.fx = null;
        node.fy = null;
      }
      alphaTargetRef.current = 0;
    }
    dragRef.current = null;
  }, [sim]);

  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d || pinchRef.current.active) return;

      if (!d.moved) {
        if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < DRAG_THRESHOLD) return;
        d.moved = true;
        autoFitRef.current = false;
        animRef.current = null;
        if (d.type === 'node') {
          const node = sim.byId.get(d.id);
          node.fx = node.x;
          node.fy = node.y;
          alphaTargetRef.current = DRAG_ALPHA;
          alphaRef.current = Math.max(alphaRef.current, DRAG_ALPHA);
        }
      }

      if (d.type === 'pan') {
        updateCam((c) => ({
          ...c,
          x: d.camX + (e.clientX - d.startX),
          y: d.camY + (e.clientY - d.startY),
        }));
      } else {
        const node = sim.byId.get(d.id);
        if (!node) return;
        const w = screenToWorld(e.clientX, e.clientY);
        node.fx = w.x + d.offX;
        node.fy = w.y + d.offY;
        node.x = node.fx;
        node.y = node.fy;
        if (!physicsOnRef.current) applyPositions();
      }
    };

    const onUp = () => {
      const d = dragRef.current;
      if (!d) return;
      const wasClick = !d.moved;
      const id = d.id;
      const type = d.type;
      releaseDrag();
      if (wasClick) setSelectedNodeId(type === 'node' ? id : null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', releaseDrag);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', releaseDrag);
    };
  }, [sim, updateCam, applyPositions, releaseDrag]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e) => {
      if (e.target.closest?.('#note-inspector')) return;
      e.preventDefault();
      animRef.current = null;
      autoFitRef.current = false;
      const factor = Math.exp(-e.deltaY * 0.0015);
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      updateCam((c) => {
        const k = clamp(c.k * factor, MIN_ZOOM, MAX_ZOOM);
        const r = k / c.k;
        return { k, x: mx - (mx - c.x) * r, y: my - (my - c.y) * r };
      });
    };

    const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        releaseDrag(); // a pinch must never leave a node pinned or pan running
        pinchRef.current = { dist: dist(e.touches), k: camRef.current.k, active: true };
        autoFitRef.current = false;
        animRef.current = null;
      }
    };
    const onTouchMove = (e) => {
      const p = pinchRef.current;
      if (!p.active || e.touches.length !== 2) return;
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
      const newK = clamp(p.k * (dist(e.touches) / p.dist), MIN_ZOOM, MAX_ZOOM);
      updateCam((c) => {
        const r = newK / c.k;
        return { k: newK, x: mx - (mx - c.x) * r, y: my - (my - c.y) * r };
      });
    };
    const onTouchEnd = (e) => {
      if (e.touches.length < 2) {
        // stay "active" until all fingers lift so the remaining finger can't start a pan
        if (e.touches.length === 0) pinchRef.current = { dist: 0, k: 1, active: false };
        else pinchRef.current.dist = 0;
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);
    container.addEventListener('touchcancel', onTouchEnd);
    return () => {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [updateCam, releaseDrag]);

  // ---------------------------------------------------------
  // Inspector data
  // ---------------------------------------------------------
  const selectedNode = selectedNodeId ? nodeDataMap.get(selectedNodeId) : null;
  const selectedDegree = selectedNodeId ? degreeMap.get(selectedNodeId) || 0 : 0;

  const neighborLinks = useMemo(() => {
    if (!selectedNodeId) return [];
    return sim.links
      .filter((l) => l.source.id === selectedNodeId || l.target.id === selectedNodeId)
      .map((l) => {
        const otherId = l.source.id === selectedNodeId ? l.target.id : l.source.id;
        return {
          otherId,
          otherNode: nodeDataMap.get(otherId),
          label: l.label,
          deg: degreeMap.get(otherId) || 0,
        };
      })
      .sort((a, b) => b.deg - a.deg);
  }, [selectedNodeId, sim, nodeDataMap, degreeMap]);

  const chipOrSearchActive = !!(selectedTagChip || searchTag);

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div
      className="nm-root h-screen font-serif flex flex-col relative overflow-hidden transition-colors duration-200"
      style={{ ...themeVars, backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}
    >
      <style>{STYLE_SHEET}</style>

      {/* TOP BAR */}
      <div
        className="border-b backdrop-blur-md px-4 sm:px-6 py-3.5 space-y-3 z-20 transition-colors"
        style={{
          backgroundColor: 'var(--theme-surface)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg font-black flex items-center justify-center text-sm shadow-md"
              style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-accent-text)' }}
            >
              <Network className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-serif font-bold tracking-wide">NEURON MAP</h1>
                <span
                  className="px-2 py-0.5 rounded-full font-mono text-[10.5px] font-bold border"
                  style={{
                    backgroundColor: 'var(--theme-surface-subtle)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  {sim.nodes.length} Neurons • {sim.links.length} Synapses
                </span>
              </div>
              <p className="text-[11px] font-mono" style={{ color: 'var(--theme-text-muted)' }}>
                Interactive “Second Brain” of <strong>Thinkers</strong>, <strong>Ideas</strong> and{' '}
                <strong>Places</strong> — from Ionia to Silicon Valley.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="join" role="tablist" aria-label="Filter by category">
              {[
                { id: 'all', label: `All (${categoryCounts.all})` },
                { id: 'thinker', label: `Thinkers (${categoryCounts.thinker})` },
                { id: 'idea', label: `Ideas (${categoryCounts.idea})` },
                { id: 'place', label: `Places (${categoryCounts.place})` },
              ].map((cat) => {
                const on = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    role="tab"
                    aria-selected={on}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="join-item px-3 py-1 font-mono text-[10.5px] font-bold transition-all cursor-pointer border"
                    style={{
                      backgroundColor: on ? 'var(--theme-accent)' : 'var(--theme-surface-subtle)',
                      color: on ? 'var(--theme-accent-text)' : 'var(--theme-text-muted)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <div className="relative w-52 sm:w-64">
              <Search
                className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--theme-text-muted)' }}
              />
              <input
                ref={searchInputRef}
                type="text"
                aria-label="Search nodes or tags"
                placeholder="Search…  (press / )"
                value={searchTag}
                onChange={(e) => {
                  setSearchTag(e.target.value);
                  setSelectedTagChip('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') jumpToFirstMatch();
                }}
                className="w-full rounded-xl pl-8 pr-7 py-1.5 text-xs font-mono transition-colors border"
                style={{
                  backgroundColor: 'var(--theme-surface-subtle)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              />
              {searchTag && (
                <button
                  onClick={() => setSearchTag('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                  style={{ color: 'var(--theme-text)' }}
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TAG RIBBON (computed from the data) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span
            className="text-[10px] font-mono mr-1 flex items-center gap-1 whitespace-nowrap"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            <Tag className="w-3 h-3" /> Top Tags:
          </span>
          {tagChips.map(([t, count]) => {
            const on = selectedTagChip === t;
            return (
              <button
                key={t}
                aria-pressed={on}
                onClick={() => {
                  setSelectedTagChip(on ? '' : t);
                  setSearchTag('');
                }}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-mono border whitespace-nowrap transition-all cursor-pointer"
                style={{
                  backgroundColor: on ? 'var(--theme-accent)' : 'var(--theme-surface-subtle)',
                  color: on ? 'var(--theme-accent-text)' : 'var(--theme-text-muted)',
                  borderColor: on ? 'var(--theme-accent)' : 'var(--theme-border)',
                  fontWeight: on ? 'bold' : 'normal',
                }}
              >
                #{t} <span style={{ opacity: 0.65 }}>{count}</span>
              </button>
            );
          })}
          {chipOrSearchActive && (
            <button
              onClick={() => {
                setSelectedTagChip('');
                setSearchTag('');
              }}
              className="px-2 py-0.5 rounded-full text-[10px] font-mono underline ml-2 whitespace-nowrap opacity-70 hover:opacity-100 cursor-pointer"
              style={{ color: 'var(--theme-text)' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* GRAPH */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 relative w-full overflow-hidden select-none"
        style={{
          backgroundColor: currentThemeObj.canvasBg,
          backgroundImage: `radial-gradient(circle at 1px 1px, ${currentThemeObj.borderStrong} 1px, transparent 0)`,
          backgroundSize: '36px 36px',
          touchAction: 'none',
        }}
      >
        <svg
          width="100%"
          height="100%"
          onPointerDown={onBackgroundPointerDown}
          className="absolute inset-0 block cursor-grab active:cursor-grabbing"
        >
          <g ref={camGroupRef}>
            <g id="links-group">
              {sim.links.map((_, idx) => (
                <EdgeItem key={idx} idx={idx} registerLineRef={registerLineRef} />
              ))}
            </g>
            <g id="nodes-group">
              {staticNodes.map((node) => {
                const sn = sim.byId.get(node.id);
                if (!sn) return null;
                return (
                  <NodeItem
                    key={node.id}
                    node={node}
                    degree={sn.degree}
                    radius={sn.radius}
                    theme={theme}
                    registerNodeRef={registerNodeRef}
                    onNodePointerDown={onNodePointerDown}
                    onEnter={onNodeEnter}
                    onLeave={onNodeLeave}
                    onSelect={setSelectedNodeId}
                  />
                );
              })}
            </g>
          </g>
        </svg>

        {/* CONTROLS */}
        <div
          className="absolute bottom-6 left-6 z-20 flex items-center gap-1.5 backdrop-blur-md border rounded-2xl p-1.5 shadow-2xl transition-colors"
          style={{
            backgroundColor: 'var(--theme-surface)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-text)',
          }}
        >
          {[
            { fn: () => zoomBy(1.25), icon: <ZoomIn className="w-4 h-4" />, title: 'Zoom in' },
            { fn: () => zoomBy(0.8), icon: <ZoomOut className="w-4 h-4" />, title: 'Zoom out' },
            { fn: resetCamera, icon: <Maximize2 className="w-3.5 h-3.5" />, title: 'Fit graph to screen' },
          ].map((b) => (
            <button
              key={b.title}
              onClick={b.fn}
              aria-label={b.title}
              title={b.title}
              className="w-8 h-8 rounded-xl flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
              style={{ color: 'var(--theme-text)' }}
            >
              {b.icon}
            </button>
          ))}
          <div className="w-px h-5" style={{ backgroundColor: 'var(--theme-border)' }} />
          <button
            onClick={() => setPhysicsOn((p) => !p)}
            aria-label={physicsOn ? 'Freeze physics' : 'Resume physics'}
            title={physicsOn ? 'Freeze physics' : 'Resume physics'}
            className="w-8 h-8 rounded-xl flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ color: 'var(--theme-text)' }}
          >
            {physicsOn ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={reSpread}
            aria-label="Re-spread the layout"
            title="Re-spread the layout"
            className="w-8 h-8 rounded-xl flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ color: 'var(--theme-text)' }}
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
          <div
            className="px-2 text-[10px] font-mono border-l"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
          >
            <span ref={zoomLabelRef}>50%</span>
          </div>
        </div>

        {/* INSPECTOR (mobile bottom-sheet / desktop drawer) */}
        {selectedNode && (
          <div
            id="note-inspector"
            role="dialog"
            aria-label={`Details: ${selectedNode.label}`}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute z-30 flex flex-col overflow-y-auto shadow-2xl inset-x-0 bottom-0 max-h-[55vh] rounded-t-3xl border-t border-x p-5 sm:inset-auto sm:top-4 sm:right-4 sm:bottom-6 sm:max-h-none sm:w-96 sm:rounded-3xl sm:border sm:p-6 backdrop-blur-xl"
            style={{
              backgroundColor: 'var(--theme-surface)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)',
            }}
          >
            <div className="space-y-5">
              <div
                className="flex items-start justify-between border-b pb-4"
                style={{ borderColor: 'var(--theme-border)' }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-accent-text)' }}
                    >
                      {selectedNode.category}
                    </span>
                    <span className="text-[11px] font-mono" style={{ color: 'var(--theme-text-muted)' }}>
                      {selectedDegree} connections
                    </span>
                  </div>
                  <h2 className="text-2xl font-serif font-black leading-tight">{selectedNode.label}</h2>
                  <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                    {selectedNode.era}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  aria-label="Close inspector"
                  className="w-7 h-7 shrink-0 rounded-full border flex items-center justify-center cursor-pointer opacity-70 hover:opacity-100"
                  style={{
                    borderColor: 'var(--theme-border)',
                    backgroundColor: 'var(--theme-surface-subtle)',
                    color: 'var(--theme-text)',
                  }}
                  title="Close (Esc)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {selectedNode.quote && (
                <div
                  className="p-4 rounded-2xl border relative shadow-inner"
                  style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                >
                  <Quote
                    className="w-5 h-5 absolute top-3 right-3 pointer-events-none opacity-20"
                    style={{ color: 'var(--theme-text)' }}
                  />
                  <p className="text-xs italic leading-relaxed pr-6">{selectedNode.quote}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <span
                  className="text-[10px] font-mono uppercase tracking-widest block font-bold"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  Summary
                </span>
                <p className="text-xs leading-relaxed font-light">{selectedNode.summary}</p>
              </div>

              {selectedNode.tags?.length > 0 && (
                <div className="space-y-1.5">
                  <span
                    className="text-[10px] font-mono uppercase tracking-widest block font-bold"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    Tags
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.tags.map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setSelectedTagChip(t);
                          setSearchTag('');
                          setSelectedNodeId(null);
                        }}
                        className="px-2 py-0.5 rounded-md text-[10px] font-mono border cursor-pointer transition-colors"
                        style={{
                          backgroundColor: 'var(--theme-surface-subtle)',
                          borderColor: 'var(--theme-border)',
                          color: 'var(--theme-text-muted)',
                        }}
                      >
                        #{t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2.5 pt-2 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                <span
                  className="text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5 font-bold"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Linked Neurons ({neighborLinks.length})</span>
                </span>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {neighborLinks.map((item) => (
                    <button
                      key={item.otherId}
                      onClick={() => jumpToNode(item.otherId)}
                      className="w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group cursor-pointer"
                      style={{
                        backgroundColor: 'var(--theme-surface-subtle)',
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-text)',
                      }}
                    >
                      <div>
                        <div className="text-xs font-serif font-bold group-hover:underline">
                          {item.otherNode?.label || item.otherId}
                        </div>
                        <div
                          className="text-[10px] font-mono capitalize"
                          style={{ color: 'var(--theme-text-muted)' }}
                        >
                          {item.label}
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="pt-4 border-t flex items-center justify-between text-[10px] font-mono mt-4"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
            >
              <span>{selectedNode.id}</span>
              <span>{selectedNode.category}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}