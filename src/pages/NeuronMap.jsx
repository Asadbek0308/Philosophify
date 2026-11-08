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

// Popular curated tags for 1-click filtering
const POPULAR_TAGS = [
  'german',
  'french',
  'ethics',
  'mind',
  'existentialism',
  'ancient',
  'greece',
  'china',
  'rome',
  'paris',
  'daoism',
  'stoicism',
  'epistemology',
  'modernism',
  'politics',
  'logic',
  'buddhism',
  'rationalism',
  'empiricism',
];

// =========================================================
// PHYSICS TUNING — tweak these to change how the graph feels
// =========================================================
const REPULSION = 2500; // how hard nodes push each other apart
const MAX_REPEL_DIST = 1400; // ignore repulsion beyond this distance (perf)
const LINK_DIST = 140; // resting length of a link
const LINK_K = 0.15; // link spring stiffness
const GRAVITY = 0.004; // very weak pull toward the center (lets the graph sprawl)
const VELOCITY_DECAY = 0.6; // friction (lower = more friction)
const COLLISION_PAD = 6; // extra gap between dots
const ALPHA_DECAY = 0.02; // how fast the simulation cools down
const ALPHA_MIN = 0.003; // below this the simulation sleeps
const DRAG_ALPHA = 0.3; // simulation "heat" while dragging a node
const DRAG_THRESHOLD = 3; // px of movement before a press becomes a drag

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Node radius sizing logic (by number of connections)
const getNodeRadius = (connectionsCount) => {
  if (connectionsCount < 3) return 4.5;
  if (connectionsCount < 20) return 8.5;
  return 16.0;
};

export default function NeuronMap() {
  const { theme, currentThemeObj } = useTheme();
  const { nodes: staticNodes, links: staticLinks } = useMemo(() => getEnrichedGraphData(), []);

  // ---------------------------------------------------------
  // Graph structure: degree + neighbor sets (from real links)
  // ---------------------------------------------------------
  const { degreeMap, neighborMap } = useMemo(() => {
    const deg = new Map();
    const nb = new Map();
    staticNodes.forEach((n) => {
      deg.set(n.id, 0);
      nb.set(n.id, new Set());
    });
    staticLinks.forEach((l) => {
      if (!nb.has(l.source) || !nb.has(l.target)) return;
      deg.set(l.source, deg.get(l.source) + 1);
      deg.set(l.target, deg.get(l.target) + 1);
      nb.get(l.source).add(l.target);
      nb.get(l.target).add(l.source);
    });
    return { degreeMap: deg, neighborMap: nb };
  }, [staticNodes, staticLinks]);

  // ---------------------------------------------------------
  // Mutable simulation state (lives outside React state so we
  // can update it 60x/second without re-rendering)
  // ---------------------------------------------------------
  const sim = useMemo(() => {
    const nodes = staticNodes.map((n, i) => {
      // Phyllotaxis (sunflower) spiral: an even starting spread, no overlaps
      const angle = i * 2.399963;
      const r = 60 * Math.sqrt(i + 0.5);
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
    const links = [];
    staticLinks.forEach((l) => {
      const s = byId.get(l.source);
      const t = byId.get(l.target);
      if (s && t) links.push({ source: s, target: t, label: l.label });
    });
    return { nodes, byId, links };
  }, [staticNodes, staticLinks, degreeMap]);

  // ---------------------------------------------------------
  // React state (only things that affect what's drawn/styled)
  // ---------------------------------------------------------
  // Camera lives in refs and is written straight to the DOM (no re-render per frame)
  const camRef = useRef({ x: 0, y: 0, k: 0.9 });
  const camGroupRef = useRef(null);
  const zoomLabelRef = useRef(null);
  const animRef = useRef(null); // active eased camera animation, if any
  const autoFitRef = useRef(true); // smoothly keep the graph framed while it settles
  const stepCameraRef = useRef(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [searchTag, setSearchTag] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [physicsOn, setPhysicsOn] = useState(true);

  const containerRef = useRef(null);
  const nodeEls = useRef(new Map());
  const lineEls = useRef([]);
  const dragRef = useRef(null);
  const alphaRef = useRef(1);
  const alphaTargetRef = useRef(0);
  const physicsOnRef = useRef(true);

  useEffect(() => {
    physicsOnRef.current = physicsOn;
  }, [physicsOn]);

  const applyCam = useCallback(() => {
    const c = camRef.current;
    camGroupRef.current?.setAttribute(
      'transform',
      `translate(${c.x.toFixed(2)}, ${c.y.toFixed(2)}) scale(${c.k.toFixed(4)})`
    );
    if (zoomLabelRef.current) zoomLabelRef.current.textContent = `${Math.round(c.k * 100)}%`;
  }, []);

  const updateCam = useCallback(
    (next) => {
      camRef.current = typeof next === 'function' ? next(camRef.current) : next;
      applyCam();
    },
    [applyCam]
  );

  // Keep the DOM transform in sync after every render
  useLayoutEffect(() => {
    applyCam();
  });

  // ---------------------------------------------------------
  // Derived UI data
  // ---------------------------------------------------------
  const nodeDataMap = useMemo(() => {
    const m = new Map();
    staticNodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [staticNodes]);

  const cleanTag = searchTag.trim().toLowerCase().replace(/^#/, '');

  const isNodeMatching = (node) => {
    if (!cleanTag) return true;
    return (
      node.tags?.some((t) => t.toLowerCase().includes(cleanTag)) ||
      node.label.toLowerCase().includes(cleanTag) ||
      node.summary?.toLowerCase().includes(cleanTag) ||
      node.category.toLowerCase().includes(cleanTag)
    );
  };

  const activeNeighbors = useMemo(() => {
    const activeId = selectedNodeId || hoveredNodeId;
    if (!activeId) return new Set();
    const set = new Set(neighborMap.get(activeId) || []);
    set.add(activeId);
    return set;
  }, [selectedNodeId, hoveredNodeId, neighborMap]);

  const selectedNode = selectedNodeId ? nodeDataMap.get(selectedNodeId) : null;
  const selectedDegree = selectedNodeId ? degreeMap.get(selectedNodeId) || 0 : 0;

  const neighborLinks = useMemo(() => {
    if (!selectedNodeId) return [];
    return sim.links
      .filter((l) => l.source.id === selectedNodeId || l.target.id === selectedNodeId)
      .map((l) => {
        const otherId = l.source.id === selectedNodeId ? l.target.id : l.source.id;
        return { otherId, otherNode: nodeDataMap.get(otherId), label: l.label };
      });
  }, [selectedNodeId, sim, nodeDataMap]);

  const categoryCounts = useMemo(() => {
    const counts = { all: staticNodes.length, thinker: 0, idea: 0, place: 0 };
    staticNodes.forEach((n) => {
      if (counts[n.category] !== undefined) counts[n.category]++;
    });
    return counts;
  }, [staticNodes]);

  // ---------------------------------------------------------
  // Write simulation positions straight into the SVG elements
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

  // Re-apply after every render so freshly mounted elements get positioned
  useLayoutEffect(() => {
    applyPositions();
  });

  // ---------------------------------------------------------
  // PHYSICS STEP
  // Returns true if anything moved this frame.
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

    // 1) Repulsion + collision (pairwise)
    for (let i = 0; i < n; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < n; j++) {
        const b = nodes[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let d2 = dx * dx + dy * dy;
        if (d2 > maxD2) continue;
        if (d2 < 1) {
          // exactly overlapping: nudge randomly so they can separate
          dx = (Math.random() - 0.5) * 2;
          dy = (Math.random() - 0.5) * 2;
          d2 = dx * dx + dy * dy + 1;
        }
        const dist = Math.sqrt(d2);

        // charge repulsion (bigger dots push harder)
        const w = ((REPULSION * alpha) / d2) * (1 + (a.radius + b.radius) / 30);
        const rx = dx * w;
        const ry = dy * w;
        a.vx += rx;
        a.vy += ry;
        b.vx -= rx;
        b.vy -= ry;

        // hard-ish collision so dots never sit on top of each other
        const minD = a.radius + b.radius + COLLISION_PAD;
        if (dist < minD) {
          const push = ((minD - dist) / dist) * 0.5 * 0.7;
          const cx = dx * push;
          const cy = dy * push;
          a.vx += cx;
          a.vy += cy;
          b.vx -= cx;
          b.vy -= cy;
        }
      }
    }

    // 2) Link springs
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
      // heavier nodes move less than light ones
      const total = s.degree + t.degree || 1;
      const sShare = t.degree / total;
      const tShare = s.degree / total;
      s.vx += fx * (0.25 + sShare);
      s.vy += fy * (0.25 + sShare);
      t.vx -= fx * (0.25 + tShare);
      t.vy -= fy * (0.25 + tShare);
    }

    // 3) Gravity + integrate
    for (let i = 0; i < n; i++) {
      const p = nodes[i];
      p.vx -= p.x * GRAVITY * alpha;
      p.vy -= p.y * GRAVITY * alpha;

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

  // Animation loop
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (physicsOnRef.current && tick()) applyPositions();
      stepCameraRef.current?.();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tick, applyPositions]);

  // ---------------------------------------------------------
  // CAMERA HELPERS
  // ---------------------------------------------------------
  const getContainerSize = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    return { w: rect?.width || 1000, h: rect?.height || 600 };
  };

  const screenToWorld = (clientX, clientY) => {
    const rect = containerRef.current.getBoundingClientRect();
    const c = camRef.current;
    return {
      x: (clientX - rect.left - c.x) / c.k,
      y: (clientY - rect.top - c.y) / c.k,
    };
  };

  const computeFit = useCallback(() => {
    const { w, h } = getContainerSize();
    const nodes = sim.nodes;
    if (!nodes.length) return null;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    nodes.forEach((p) => {
      minX = Math.min(minX, p.x - p.radius);
      maxX = Math.max(maxX, p.x + p.radius);
      minY = Math.min(minY, p.y - p.radius);
      maxY = Math.max(maxY, p.y + p.radius + 14);
    });
    const pad = 40;
    const bw = Math.max(maxX - minX, 1) + pad * 2;
    const bh = Math.max(maxY - minY, 1) + pad * 2;
    const k = clamp(Math.min(w / bw, h / bh), MIN_ZOOM, 2);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    return { k, x: w / 2 - cx * k, y: h / 2 - cy * k };
  }, [sim]);

  // Smooth eased move to a target camera ({ k, x, y })
  const animateCam = (to, dur = 700) => {
    autoFitRef.current = false;
    animRef.current = { from: { ...camRef.current }, to, start: performance.now(), dur };
  };

  // Runs every frame from the animation loop
  stepCameraRef.current = () => {
    const a = animRef.current;
    if (a) {
      const t = Math.min(1, (performance.now() - a.start) / a.dur);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // easeInOutCubic
      updateCam({
        k: a.from.k + (a.to.k - a.from.k) * e,
        x: a.from.x + (a.to.x - a.from.x) * e,
        y: a.from.y + (a.to.y - a.from.y) * e,
      });
      if (t >= 1) animRef.current = null;
      return;
    }

    if (!autoFitRef.current) return;
    const target = computeFit();
    if (!target) return;
    // Ease a small fraction toward the live fit every frame: smooth, no jumps,
    // and it follows the graph while it is still spreading out.
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

  // Center the camera on mount, then auto-fit once the layout has settled
  useLayoutEffect(() => {
    const { w, h } = getContainerSize();
    updateCam({ k: 0.9, x: w / 2, y: h / 2 });
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
    const target = computeFit();
    if (target) animateCam(target, 800);
  };

  const jumpToNode = (nodeId) => {
    const target = sim.byId.get(nodeId);
    if (!target) return;
    setSelectedNodeId(nodeId);
    const { w, h } = getContainerSize();
    // keep the node visible to the left of the inspector drawer
    const cx = Math.max(w * 0.35, w / 2 - 190);
    const k = camRef.current.k;
    animateCam({ k, x: cx - target.x * k, y: h / 2 - target.y * k }, 750);
  };

  const reSpread = () => {
    const nodes = sim.nodes;
    nodes.forEach((p, i) => {
      const angle = Math.random() * Math.PI * 2;
      const r = 70 * Math.sqrt(i + 0.5) + Math.random() * 80;
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
    autoFitRef.current = true; // smoothly re-frame while the new layout settles
    applyPositions();
  };

  // ---------------------------------------------------------
  // POINTER HANDLERS (pan + node drag, window-level so the
  // cursor can leave the element without breaking the drag)
  // ---------------------------------------------------------
  const onBackgroundPointerDown = (e) => {
    if (e.button !== 0) return;
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

  const onNodePointerDown = (e, id) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    const node = sim.byId.get(id);
    if (!node) return;
    const w = screenToWorld(e.clientX, e.clientY);
    dragRef.current = {
      type: 'node',
      id,
      startX: e.clientX,
      startY: e.clientY,
      // keep the grab point under the cursor (no snapping to node center)
      offX: node.x - w.x,
      offY: node.y - w.y,
      moved: false,
    };
  };

  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d) return;

      if (!d.moved) {
        const dist = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);
        if (dist < DRAG_THRESHOLD) return;
        d.moved = true;
        if (d.type === 'node') {
          const node = sim.byId.get(d.id);
          node.fx = node.x;
          node.fy = node.y;
          // wake the simulation so neighbors follow
          alphaTargetRef.current = DRAG_ALPHA;
          autoFitRef.current = false; // never move the camera under a dragged node
          animRef.current = null;
          alphaRef.current = Math.max(alphaRef.current, DRAG_ALPHA);
        } else {
          autoFitRef.current = false;
          animRef.current = null;
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
      if (d.type === 'node') {
        const node = sim.byId.get(d.id);
        if (node) {
          node.fx = null;
          node.fy = null;
        }
        alphaTargetRef.current = 0;
        if (!d.moved) setSelectedNodeId(d.id); // plain click selects
      } else if (!d.moved) {
        setSelectedNodeId(null); // click on empty space deselects
      }
      dragRef.current = null;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim, updateCam, applyPositions]);

  // Wheel zoom (non-passive), zooms toward the cursor, ignored over the sidebar
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e) => {
      if (e.target.closest('#note-inspector')) return; // let the sidebar scroll
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

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [updateCam]);

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------
  return (
    <div className="h-screen bg-black text-white font-serif flex flex-col relative overflow-hidden">
      {/* TOP CONTROLS & TAG SEARCH BAR */}
      <div className="border-b border-white/10 bg-black/95 backdrop-blur-md px-4 sm:px-6 py-3.5 space-y-3 z-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white text-black font-black flex items-center justify-center text-sm shadow-md">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-serif font-bold text-white tracking-wide">
                  NEURON MAP
                </h1>
                <span className="badge badge-xs bg-white/15 text-white border-none font-mono">
                  {sim.nodes.length} Neurons • {sim.links.length} Synapses
                </span>
              </div>
              <p className="text-[11px] text-white/50 font-mono">
                Interactive "Second Brain" web interconnecting <strong>Thinkers</strong>,{' '}
                <strong>Ideas</strong> (Existentialism, Daoism, Modernism, Stoicism), and{' '}
                <strong>Historical Places</strong> (Greece, Rome, China, Paris). Drag a neuron and
                its connections follow.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter Tabs */}
            <div className="join">
              {[
                { id: 'all', label: `All (${categoryCounts.all})` },
                { id: 'thinker', label: `Thinkers (${categoryCounts.thinker})` },
                { id: 'idea', label: `Ideas (${categoryCounts.idea})` },
                { id: 'place', label: `Places (${categoryCounts.place})` },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`join-item btn btn-xs capitalize font-mono text-[10px] ${
                    selectedCategory === cat.id
                      ? 'bg-white text-black font-bold'
                      : 'btn-outline border-white/20 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Tag Search Input */}
            <div className="relative w-52 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search tag (e.g. #existentialism)..."
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                className="w-full bg-zinc-950 border border-white/20 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white transition-colors font-mono"
              />
              {searchTag && (
                <button
                  onClick={() => setSearchTag('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  title="Clear tag"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CLICKABLE POPULAR TAGS RIBBON */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[10px] font-mono text-white/40 mr-1 flex items-center gap-1 whitespace-nowrap">
            <Tag className="w-3 h-3" /> Popular Tags:
          </span>
          {POPULAR_TAGS.map((t) => {
            const isActive = cleanTag === t;
            return (
              <button
                key={t}
                onClick={() => setSearchTag(isActive ? '' : t)}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono border whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-black font-bold border-white shadow-sm'
                    : 'bg-zinc-950 text-white/60 border-white/15 hover:border-white/40 hover:text-white'
                }`}
              >
                #{t}
              </button>
            );
          })}
          {cleanTag && (
            <button
              onClick={() => setSearchTag('')}
              className="px-2 py-0.5 rounded-full text-[10px] font-mono text-white/50 hover:text-white underline ml-2 whitespace-nowrap"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* GRAPH WORKSPACE */}
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
        {/* No viewBox: the SVG is a plain pixel canvas, so the world is unbounded */}
        <svg
          width="100%"
          height="100%"
          onPointerDown={onBackgroundPointerDown}
          className="absolute inset-0 block cursor-grab active:cursor-grabbing"
        >
          <g ref={camGroupRef}>
            {/* 1. SYNAPTIC LINKS */}
            <g id="links-group">
              {sim.links.map((link, idx) => {
                const sId = link.source.id;
                const tId = link.target.id;
                const sData = nodeDataMap.get(sId);
                const tData = nodeDataMap.get(tId);

                const isConnectedToSelected =
                  selectedNodeId && (sId === selectedNodeId || tId === selectedNodeId);
                const isConnectedToHovered =
                  hoveredNodeId && (sId === hoveredNodeId || tId === hoveredNodeId);

                const catOk =
                  selectedCategory === 'all' ||
                  (sData?.category === selectedCategory && tData?.category === selectedCategory);
                const tagOk = !cleanTag || (isNodeMatching(sData) && isNodeMatching(tData));

                let stroke = currentThemeObj.borderStrong || 'rgba(255, 255, 255, 0.35)';
                let strokeWidth = 1.0;
                let opacity = 0.35;

                if (selectedNodeId) {
                  if (isConnectedToSelected) {
                    stroke = currentThemeObj.accent;
                    strokeWidth = 2.2;
                    opacity = 1.0;
                  } else {
                    stroke = currentThemeObj.canvasLink;
                    strokeWidth = 0.6;
                    opacity = 0.08;
                  }
                } else if (isConnectedToHovered) {
                  stroke = currentThemeObj.accent;
                  strokeWidth = 2.0;
                  opacity = 0.95;
                } else if (cleanTag && tagOk) {
                  stroke = currentThemeObj.accent;
                  opacity = 0.8;
                } else if (cleanTag) {
                  opacity = 0.08;
                }
                if (!catOk) opacity = Math.min(opacity, 0.05);

                return (
                  <line
                    key={`link-${idx}`}
                    ref={(el) => {
                      lineEls.current[idx] = el;
                    }}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </g>

            {/* 2. NEURON NODES */}
            <g id="nodes-group">
              {staticNodes.map((node) => {
                const simNode = sim.byId.get(node.id);
                if (!simNode) return null;
                const radius = simNode.radius;

                const matchesCategory =
                  selectedCategory === 'all' || node.category === selectedCategory;
                const matchesTag = isNodeMatching(node);
                const isHovered = hoveredNodeId === node.id;
                const isSelected = selectedNodeId === node.id;

                let opacity = 1.0;
                if (!matchesCategory) {
                  opacity = 0.12;
                } else if (cleanTag) {
                  opacity = matchesTag ? 1.0 : 0.35;
                } else if (selectedNodeId && !activeNeighbors.has(node.id)) {
                  opacity = 0.3;
                } else if (hoveredNodeId && !activeNeighbors.has(node.id)) {
                  opacity = 0.35;
                }

                let fillColor;
                if (node.category === 'place') fillColor = currentThemeObj.canvasNodeHub;
                else if (node.category === 'idea') fillColor = currentThemeObj.accent;
                else fillColor = currentThemeObj.canvasNodeRegular;
                if (isSelected || (cleanTag && matchesTag)) fillColor = currentThemeObj.accent;

                const deg = simNode.degree;
                const highlighted = isSelected || isHovered || (cleanTag && matchesTag);

                return (
                  <g
                    key={node.id}
                    ref={(el) => {
                      if (el) nodeEls.current.set(node.id, el);
                      else nodeEls.current.delete(node.id);
                    }}
                    opacity={opacity}
                    style={{ cursor: 'grab' }}
                    onPointerEnter={() => setHoveredNodeId(node.id)}
                    onPointerLeave={() => setHoveredNodeId(null)}
                    onPointerDown={(e) => onNodePointerDown(e, node.id)}
                  >
                    {/* generous invisible hit area so small dots are easy to grab */}
                    <circle r={radius + 6} fill="transparent" />

                    {/* Node Core: Square for cyberpunk, Circle for all other themes */}
                    {theme === 'cyberpunk' ? (
                      <rect
                        x={-radius}
                        y={-radius}
                        width={radius * 2}
                        height={radius * 2}
                        fill={fillColor}
                        stroke={isSelected ? currentThemeObj.accent : currentThemeObj.borderStrong}
                        strokeWidth={isSelected ? 2.2 : 1.2}
                      />
                    ) : (
                      <circle
                        r={radius}
                        fill={fillColor}
                        stroke={isSelected ? currentThemeObj.accent : currentThemeObj.borderStrong}
                        strokeWidth={isSelected ? 2 : 1}
                      />
                    )}
                    <text
                      y={radius + 12}
                      textAnchor="middle"
                      fill={highlighted ? currentThemeObj.text : currentThemeObj.textMuted}
                      fontSize={deg >= 20 ? 12 : deg >= 3 ? 10.5 : 9.5}
                      fontWeight={isSelected || isHovered || deg >= 20 ? 'bold' : 'normal'}
                      fontFamily='"Playfair Display", "EB Garamond", Georgia, serif'
                      style={{ pointerEvents: 'none' }}
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </g>
          </g>
        </svg>

        {/* FLOATING CAMERA + PHYSICS CONTROLS (BOTTOM-LEFT) */}
        <div className="absolute bottom-6 left-6 z-20 flex items-center gap-1.5 bg-zinc-950/90 backdrop-blur-md border border-white/20 rounded-2xl p-1.5 shadow-2xl">
          <button
            onClick={() => zoomBy(1.25)}
            className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => zoomBy(0.8)}
            className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetCamera}
            className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Fit graph to screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-5 bg-white/15" />
          <button
            onClick={() => setPhysicsOn((p) => !p)}
            className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            title={physicsOn ? 'Freeze physics' : 'Resume physics'}
          >
            {physicsOn ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={reSpread}
            className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Re-spread the layout"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
          <div className="px-2 text-[10px] font-mono text-white/50 border-l border-white/15">
            <span ref={zoomLabelRef}>90%</span>
          </div>
        </div>

        {/* NOTE INSPECTOR DRAWER (RIGHT PANEL) */}
        {selectedNode && (
          <div
            id="note-inspector"
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute top-4 right-4 bottom-6 w-80 sm:w-96 bg-zinc-950/95 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl z-30 flex flex-col justify-between overflow-y-auto"
          >
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge badge-sm font-mono uppercase bg-white text-black font-bold border-none text-[10px]">
                      {selectedNode.category}
                    </span>
                    <span className="text-[11px] font-mono text-white/50">
                      {selectedDegree} connections
                    </span>
                  </div>
                  <h2 className="text-2xl font-serif font-black text-white leading-tight">
                    {selectedNode.label}
                  </h2>
                  <div className="text-xs font-mono text-white/60 mt-0.5">{selectedNode.era}</div>
                </div>

                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="w-7 h-7 rounded-full border border-white/20 hover:bg-white hover:text-black flex items-center justify-center text-white/70 transition-colors cursor-pointer"
                  title="Close Inspector"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Central Quote */}
              {selectedNode.quote && (
                <div className="p-4 rounded-2xl bg-black border border-white/15 relative">
                  <Quote className="w-5 h-5 text-white/20 absolute top-3 right-3 pointer-events-none" />
                  <p className="text-xs italic text-white leading-relaxed pr-6">
                    {selectedNode.quote}
                  </p>
                </div>
              )}

              {/* Summary */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 block">
                  Note Summary
                </span>
                <p className="text-xs text-white/80 leading-relaxed font-light">
                  {selectedNode.summary}
                </p>
              </div>

              {/* Node Tags */}
              {selectedNode.tags && selectedNode.tags.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 block">
                    Associated Tags (Click to Filter)
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.tags.map((t) => (
                      <button
                        key={t}
                        onClick={() => setSearchTag(t)}
                        className="badge badge-xs bg-zinc-900 border border-white/20 text-white/70 hover:bg-white hover:text-black text-[10px] font-mono cursor-pointer transition-colors"
                      >
                        #{t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Connected Backlinks */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Linked Neurons ({neighborLinks.length})</span>
                </span>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {neighborLinks.map((linkItem, idx) => (
                    <button
                      key={idx}
                      onClick={() => jumpToNode(linkItem.otherId)}
                      className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-white hover:text-black border border-white/10 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-serif font-bold group-hover:text-black">
                          {linkItem.otherNode?.label || linkItem.otherId}
                        </div>
                        <div className="text-[10px] font-mono text-white/40 group-hover:text-black/60 capitalize">
                          {linkItem.label}
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-black transform group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/40">
              <span>Node: #{selectedNode.id}</span>
              <span>
                Radius: {getNodeRadius(selectedDegree)}px (
                {selectedDegree < 3 ? 'Small' : selectedDegree < 20 ? 'Medium' : 'Big'})
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}