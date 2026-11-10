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

// Popular curated tags for exact 1-click filtering
const POPULAR_TAGS = [
  'islamic',
  'russia',
  'sufism',
  'persia',
  'byzantium',
  'india',
  'ethics',
  'mind',
  'existentialism',
  'metaphysics',
  'ancient',
  'greece',
  'china',
  'german',
  'french',
  'daoism',
  'stoicism',
  'epistemology',
  'logic',
  'buddhism',
  'rationalism',
  'empiricism',
];

// =========================================================
// PHYSICS TUNING
// =========================================================
const REPULSION = 2500;
const MAX_REPEL_DIST = 1400;
const LINK_DIST = 140;
const LINK_K = 0.15;
const GRAVITY = 0.005;
const VELOCITY_DECAY = 0.6;
const COLLISION_PAD = 6;
const ALPHA_DECAY = 0.02;
const ALPHA_MIN = 0.003;
const DRAG_ALPHA = 0.3;
const DRAG_THRESHOLD = 3;

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const getNodeRadius = (connectionsCount) => {
  if (connectionsCount < 3) return 4.5;
  if (connectionsCount < 20) return 8.5;
  return 16.0;
};

// =========================================================
// MEMOIZED NODE COMPONENT (Zero Virtual DOM re-render churn)
// =========================================================
const NodeItem = React.memo(function NodeItem({
  node,
  simNode,
  theme,
  currentThemeObj,
  opacity,
  isSelected,
  isHovered,
  highlighted,
  registerNodeRef,
  onNodePointerDown,
  onPointerEnter,
  onPointerLeave,
  onSelect,
}) {
  const radius = simNode.radius;
  const deg = simNode.degree;

  let fillColor;
  if (node.category === 'place') fillColor = currentThemeObj.canvasNodeHub;
  else if (node.category === 'idea') fillColor = currentThemeObj.accent;
  else fillColor = currentThemeObj.canvasNodeRegular;
  if (isSelected || highlighted) fillColor = currentThemeObj.accent;

  const isMinor = deg < 3;

  return (
    <g
      ref={(el) => registerNodeRef(node.id, el)}
      opacity={opacity}
      style={{ cursor: 'grab' }}
      tabIndex={0}
      role="button"
      aria-label={`Node: ${node.label}, ${node.category}, ${deg} connections`}
      onPointerEnter={() => onPointerEnter(node.id)}
      onPointerLeave={onPointerLeave}
      onPointerDown={(e) => onNodePointerDown(e, node.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(node.id);
        }
      }}
    >
      {/* Invisible generous hit area */}
      <circle r={radius + 8} fill="transparent" />

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
        className={`node-label ${isMinor ? 'lbl-minor' : ''}`}
        fill={highlighted ? currentThemeObj.text : currentThemeObj.textMuted}
        fontSize={deg >= 20 ? 12 : deg >= 3 ? 10.5 : 9.5}
        fontWeight={isSelected || isHovered || deg >= 20 ? 'bold' : 'normal'}
        fontFamily='"Playfair Display", "EB Garamond", Georgia, serif'
      >
        {node.label}
      </text>
    </g>
  );
});

// =========================================================
// MEMOIZED EDGE COMPONENT
// =========================================================
const EdgeItem = React.memo(function EdgeItem({
  idx,
  stroke,
  strokeWidth,
  opacity,
  registerLineRef,
  onEdgePointerEnter,
  onEdgePointerLeave,
  linkData,
}) {
  return (
    <line
      ref={(el) => registerLineRef(idx, el)}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
      vectorEffect="non-scaling-stroke"
      style={{ cursor: 'pointer' }}
      onPointerEnter={(e) => onEdgePointerEnter(linkData, e)}
      onPointerLeave={onEdgePointerLeave}
    />
  );
});

// =========================================================
// MAIN NEURON MAP
// =========================================================
export default function NeuronMap() {
  const { theme, currentThemeObj } = useTheme();
  const { nodes: staticNodes, links: staticLinks } = useMemo(() => getEnrichedGraphData(), []);

  // ---------------------------------------------------------
  // Graph structure: degree + neighbor sets
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
  // Mutable simulation state (Deduplicated links)
  // ---------------------------------------------------------
  const sim = useMemo(() => {
    const nodes = staticNodes.map((n, i) => {
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

    // Deduplicate edges to prevent doubled spring forces
    const seenEdges = new Set();
    const links = [];
    staticLinks.forEach((l) => {
      const s = byId.get(l.source);
      const t = byId.get(l.target);
      if (!s || !t) return;
      const key = [l.source, l.target].sort().join('|');
      if (seenEdges.has(key)) return;
      seenEdges.add(key);
      links.push({ source: s, target: t, label: l.label });
    });

    return { nodes, byId, links };
  }, [staticNodes, staticLinks, degreeMap]);

  // ---------------------------------------------------------
  // React state & Camera Refs
  // ---------------------------------------------------------
  const camRef = useRef({ x: 0, y: 0, k: 0.9 });
  const camGroupRef = useRef(null);
  const zoomLabelRef = useRef(null);
  const animRef = useRef(null);
  const autoFitRef = useRef(true);
  const stepCameraRef = useRef(null);

  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [searchTag, setSearchTag] = useState('');
  const [selectedTagChip, setSelectedTagChip] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [physicsOn, setPhysicsOn] = useState(true);

  const containerRef = useRef(null);
  const nodeEls = useRef(new Map());
  const lineEls = useRef([]);
  const dragRef = useRef(null);
  const alphaRef = useRef(1);
  const alphaTargetRef = useRef(0);
  const physicsOnRef = useRef(true);

  // Multi-touch tracking for pinch-to-zoom
  const pinchStartDistRef = useRef(0);
  const pinchStartKRef = useRef(1);

  useEffect(() => {
    physicsOnRef.current = physicsOn;
  }, [physicsOn]);

  // ---------------------------------------------------------
  // Stable ref callbacks (Zero churn across re-renders)
  // ---------------------------------------------------------
  const registerNodeRef = useCallback((id, el) => {
    if (el) nodeEls.current.set(id, el);
    else nodeEls.current.delete(id);
  }, []);

  const registerLineRef = useCallback((idx, el) => {
    lineEls.current[idx] = el;
  }, []);

  const applyCam = useCallback(() => {
    const c = camRef.current;
    if (camGroupRef.current) {
      camGroupRef.current.setAttribute(
        'transform',
        `translate(${c.x.toFixed(2)}, ${c.y.toFixed(2)}) scale(${c.k.toFixed(4)})`
      );
    }
    if (containerRef.current) {
      // Toggle label hiding class when zoomed out past threshold
      containerRef.current.classList.toggle('zoomed-out', c.k < 0.65);
    }
    if (zoomLabelRef.current) {
      zoomLabelRef.current.textContent = `${Math.round(c.k * 100)}%`;
    }
  }, []);

  const updateCam = useCallback(
    (next) => {
      camRef.current = typeof next === 'function' ? next(camRef.current) : next;
      applyCam();
    },
    [applyCam]
  );

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

  // Exact match for tag chips vs. substring match for typed search
  const isNodeMatching = useCallback(
    (node) => {
      if (selectedTagChip) {
        return node.tags?.some((t) => t.toLowerCase() === selectedTagChip.toLowerCase());
      }
      if (!cleanTag) return true;
      return (
        node.label.toLowerCase().includes(cleanTag) ||
        node.tags?.some((t) => t.toLowerCase().includes(cleanTag)) ||
        node.category.toLowerCase().includes(cleanTag)
      );
    },
    [selectedTagChip, cleanTag]
  );

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
  // PHYSICS STEP
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

    // 1) Repulsion + collision
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
      const total = s.degree + t.degree || 1;
      const sShare = t.degree / total;
      const tShare = s.degree / total;
      s.vx += fx * (0.25 + sShare);
      s.vy += fy * (0.25 + sShare);
      t.vx -= fx * (0.25 + tShare);
      t.vy -= fy * (0.25 + tShare);
    }

    // 3) Gravity + integration
    for (let i = 0; i < n; i++) {
      const p = nodes[i];
      // Give orphan or low-degree nodes slightly stronger central gravity so they don't wander
      const nodeGravity = p.degree === 0 ? GRAVITY * 2.5 : GRAVITY;
      p.vx -= p.x * nodeGravity * alpha;
      p.vy -= p.y * nodeGravity * alpha;

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

  // ---------------------------------------------------------
  // FIXED TIMESTEP ANIMATION LOOP (Independent of Refresh Rate)
  // ---------------------------------------------------------
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const STEP = 1000 / 60; // 16.667ms per fixed physics step

    const loop = (now) => {
      acc += Math.min(now - last, 100); // clamp on lag / tab switch
      last = now;
      let moved = false;
      while (acc >= STEP) {
        if (physicsOnRef.current && tick()) moved = true;
        acc -= STEP;
      }
      if (moved) applyPositions();
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

  // Robust Auto-fit that ignores outer 2% outliers
  const computeFit = useCallback(() => {
    const { w, h } = getContainerSize();
    const nodes = sim.nodes;
    if (!nodes.length) return null;

    let minX, maxX, minY, maxY;
    if (nodes.length >= 20) {
      const xs = nodes.map((p) => p.x).sort((a, b) => a - b);
      const ys = nodes.map((p) => p.y).sort((a, b) => a - b);
      const trim = Math.floor(nodes.length * 0.02);
      minX = xs[trim] - 16;
      maxX = xs[xs.length - 1 - trim] + 16;
      minY = ys[trim] - 16;
      maxY = ys[ys.length - 1 - trim] + 30;
    } else {
      minX = Math.min(...nodes.map((p) => p.x - p.radius));
      maxX = Math.max(...nodes.map((p) => p.x + p.radius));
      minY = Math.min(...nodes.map((p) => p.y - p.radius));
      maxY = Math.max(...nodes.map((p) => p.y + p.radius + 14));
    }

    const pad = 60;
    const bw = Math.max(maxX - minX, 1) + pad * 2;
    const bh = Math.max(maxY - minY, 1) + pad * 2;
    const k = clamp(Math.min(w / bw, h / bh), MIN_ZOOM, 2);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    return { k, x: w / 2 - cx * k, y: h / 2 - cy * k };
  }, [sim]);

  const animateCam = useCallback((to, dur = 700) => {
    autoFitRef.current = false;
    animRef.current = { from: { ...camRef.current }, to, start: performance.now(), dur };
  }, []);

  stepCameraRef.current = () => {
    const a = animRef.current;
    if (a) {
      const t = Math.min(1, (performance.now() - a.start) / a.dur);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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

  // Jump to node with selection priority
  const jumpToNode = useCallback(
    (nodeId) => {
      const target = sim.byId.get(nodeId);
      if (!target) return;
      setSelectedNodeId(nodeId);
      const { w, h } = getContainerSize();
      const isMobile = w < 640;
      const cx = isMobile ? w / 2 : Math.max(w * 0.35, w / 2 - 190);
      const cy = isMobile ? h * 0.35 : h / 2;
      const k = Math.max(camRef.current.k, 0.9);
      animateCam({ k, x: cx - target.x * k, y: cy - target.y * k }, 750);
    },
    [sim, animateCam]
  );

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
    autoFitRef.current = true;
    applyPositions();
  };

  // ---------------------------------------------------------
  // DEEP LINKING (URL Hash Synchronization)
  // ---------------------------------------------------------
  useEffect(() => {
    try {
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.replace(/^#/, ''));
        const nodeParam = params.get('node');
        const tagParam = params.get('tag');
        if (nodeParam && sim.byId.has(nodeParam)) {
          jumpToNode(nodeParam);
        }
        if (tagParam) {
          setSelectedTagChip(tagParam.toLowerCase());
        }
      }
    } catch {
      // safe fallback
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams();
      if (selectedNodeId) params.set('node', selectedNodeId);
      if (selectedTagChip) params.set('tag', selectedTagChip);
      const str = params.toString();
      const newUrl = str
        ? `${window.location.pathname}${window.location.search}#${str}`
        : `${window.location.pathname}${window.location.search}`;
      window.history.replaceState(null, '', newUrl);
    } catch {
      // safe fallback
    }
  }, [selectedNodeId, selectedTagChip]);

  // ---------------------------------------------------------
  // KEYBOARD ACCESSIBILITY (Esc to dismiss)
  // ---------------------------------------------------------
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedNodeId(null);
        setHoveredEdge(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // ---------------------------------------------------------
  // POINTER & TOUCH HANDLERS (Pan, Node Drag, Pinch-to-Zoom)
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

  const onNodePointerDown = useCallback(
    (e, id) => {
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
        offX: node.x - w.x,
        offY: node.y - w.y,
        moved: false,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sim]
  );

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
          alphaTargetRef.current = DRAG_ALPHA;
          autoFitRef.current = false;
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
        if (!d.moved) setSelectedNodeId(d.id);
      } else if (!d.moved) {
        setSelectedNodeId(null);
      }
      dragRef.current = null;
    };

    // Separate clean cancel handler that NEVER triggers accidental click selection
    const onCancel = () => {
      const d = dragRef.current;
      if (!d) return;
      if (d.type === 'node') {
        const node = sim.byId.get(d.id);
        if (node) {
          node.fx = null;
          node.fy = null;
        }
        alphaTargetRef.current = 0;
      }
      dragRef.current = null;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  }, [sim, updateCam, applyPositions]);

  // Wheel zoom (non-passive)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e) => {
      if (e.target.closest('#note-inspector')) return;
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

  // Touch handlers for mobile pinch-to-zoom
  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      const p1 = e.touches[0];
      const p2 = e.touches[1];
      pinchStartDistRef.current = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
      pinchStartKRef.current = camRef.current.k;
      autoFitRef.current = false;
      animRef.current = null;
    }
  };

  const onTouchMove = (e) => {
    if (e.touches.length === 2 && pinchStartDistRef.current > 0) {
      e.preventDefault();
      const p1 = e.touches[0];
      const p2 = e.touches[1];
      const dist = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
      const ratio = dist / pinchStartDistRef.current;
      const newK = clamp(pinchStartKRef.current * ratio, MIN_ZOOM, MAX_ZOOM);
      const mx = (p1.clientX + p2.clientX) / 2 - (containerRef.current?.getBoundingClientRect().left || 0);
      const my = (p1.clientY + p2.clientY) / 2 - (containerRef.current?.getBoundingClientRect().top || 0);
      updateCam((c) => {
        const r = newK / c.k;
        return { k: newK, x: mx - (mx - c.x) * r, y: my - (my - c.y) * r };
      });
    }
  };

  const onTouchEnd = (e) => {
    if (e.touches.length < 2) {
      pinchStartDistRef.current = 0;
    }
  };

  const handleEdgePointerEnter = useCallback((linkData, e) => {
    setHoveredEdge({
      source: linkData.source.label || linkData.source.id,
      target: linkData.target.label || linkData.target.id,
      label: linkData.label,
      x: e.clientX,
      y: e.clientY,
    });
  }, []);

  const handleEdgePointerLeave = useCallback(() => {
    setHoveredEdge(null);
  }, []);

  return (
    <div
      className="h-screen font-serif flex flex-col relative overflow-hidden transition-colors duration-200"
      style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}
    >
      {/* TOP CONTROLS & TAG SEARCH BAR (Theme-Bound) */}
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
              style={{
                backgroundColor: 'var(--theme-accent)',
                color: 'var(--theme-accent-text)',
              }}
            >
              <Network className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-serif font-bold tracking-wide" style={{ color: 'var(--theme-text)' }}>
                  NEURON MAP
                </h1>
                <span
                  className="px-2 py-0.5 rounded-full font-mono text-[10.5px] font-bold border"
                  style={{
                    backgroundColor: 'var(--theme-surface-subtle)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)',
                  }}
                >
                  {sim.nodes.length} Neurons • {sim.links.length} Synapses
                </span>
              </div>
              <p className="text-[11px] font-mono" style={{ color: 'var(--theme-text-muted)' }}>
                Interactive "Second Brain" web interconnecting <strong>Thinkers</strong>, <strong>Ideas</strong>, and <strong>Historical Places</strong>.
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
              ].map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="join-item px-3 py-1 font-mono text-[10.5px] font-bold transition-all cursor-pointer border"
                    style={{
                      backgroundColor: isSelected ? 'var(--theme-accent)' : 'var(--theme-surface-subtle)',
                      color: isSelected ? 'var(--theme-accent-text)' : 'var(--theme-text-muted)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Tag Search Input */}
            <div className="relative w-52 sm:w-64">
              <Search
                className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--theme-text-muted)' }}
              />
              <input
                type="text"
                placeholder="Search node or tag..."
                value={searchTag}
                onChange={(e) => {
                  setSearchTag(e.target.value);
                  setSelectedTagChip('');
                }}
                className="w-full rounded-xl pl-8 pr-7 py-1.5 text-xs font-mono transition-colors border focus:outline-none"
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
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CLICKABLE POPULAR TAGS RIBBON (Exact Chip Match) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[10px] font-mono mr-1 flex items-center gap-1 whitespace-nowrap" style={{ color: 'var(--theme-text-muted)' }}>
            <Tag className="w-3 h-3" /> Popular Tags:
          </span>
          {POPULAR_TAGS.map((t) => {
            const isActive = selectedTagChip === t;
            return (
              <button
                key={t}
                onClick={() => {
                  if (isActive) {
                    setSelectedTagChip('');
                  } else {
                    setSelectedTagChip(t);
                    setSearchTag('');
                  }
                }}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-mono border whitespace-nowrap transition-all cursor-pointer"
                style={{
                  backgroundColor: isActive ? 'var(--theme-accent)' : 'var(--theme-surface-subtle)',
                  color: isActive ? 'var(--theme-accent-text)' : 'var(--theme-text-muted)',
                  borderColor: isActive ? 'var(--theme-accent)' : 'var(--theme-border)',
                  fontWeight: isActive ? 'bold' : 'normal',
                }}
              >
                #{t}
              </button>
            );
          })}
          {(selectedTagChip || searchTag) && (
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
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
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
                const tagOk =
                  (!selectedTagChip && !cleanTag) ||
                  (isNodeMatching(sData) && isNodeMatching(tData));

                let stroke = currentThemeObj.borderStrong || 'rgba(255, 255, 255, 0.35)';
                let strokeWidth = 1.0;
                let opacity = 0.35;

                // Selection Precedence: Selection ALWAYS wins
                if (selectedNodeId) {
                  if (isConnectedToSelected) {
                    stroke = currentThemeObj.accent;
                    strokeWidth = 2.4;
                    opacity = 1.0;
                  } else {
                    stroke = currentThemeObj.canvasLink;
                    strokeWidth = 0.6;
                    opacity = 0.06;
                  }
                } else if (isConnectedToHovered) {
                  stroke = currentThemeObj.accent;
                  strokeWidth = 2.0;
                  opacity = 0.95;
                } else if ((selectedTagChip || cleanTag) && tagOk) {
                  stroke = currentThemeObj.accent;
                  strokeWidth = 1.6;
                  opacity = 0.85;
                } else if (selectedTagChip || cleanTag) {
                  opacity = 0.06;
                }

                if (!catOk && !isConnectedToSelected) {
                  opacity = Math.min(opacity, 0.05);
                }

                return (
                  <EdgeItem
                    key={`link-${idx}`}
                    idx={idx}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                    registerLineRef={registerLineRef}
                    onEdgePointerEnter={handleEdgePointerEnter}
                    onEdgePointerLeave={handleEdgePointerLeave}
                    linkData={link}
                  />
                );
              })}
            </g>

            {/* 2. NEURON NODES */}
            <g id="nodes-group">
              {staticNodes.map((node) => {
                const simNode = sim.byId.get(node.id);
                if (!simNode) return null;

                const isHovered = hoveredNodeId === node.id;
                const isSelected = selectedNodeId === node.id;
                const matchesTag = isNodeMatching(node);
                const matchesCategory =
                  selectedCategory === 'all' || node.category === selectedCategory;

                // PRECEDENCE LOGIC: SELECTION WINS!
                let opacity = 1.0;
                if (selectedNodeId) {
                  if (node.id === selectedNodeId) {
                    opacity = 1.0;
                  } else if (activeNeighbors.has(node.id)) {
                    opacity = 0.95;
                  } else {
                    opacity = 0.15;
                  }
                } else if (hoveredNodeId) {
                  if (node.id === hoveredNodeId) {
                    opacity = 1.0;
                  } else if (activeNeighbors.has(node.id)) {
                    opacity = 0.9;
                  } else {
                    opacity = 0.25;
                  }
                } else {
                  if (!matchesCategory) {
                    opacity = 0.12;
                  } else if (selectedTagChip || cleanTag) {
                    opacity = matchesTag ? 1.0 : 0.25;
                  }
                }

                const highlighted =
                  isSelected || isHovered || ((selectedTagChip || cleanTag) && matchesTag);

                return (
                  <NodeItem
                    key={node.id}
                    node={node}
                    simNode={simNode}
                    theme={theme}
                    currentThemeObj={currentThemeObj}
                    opacity={opacity}
                    isSelected={isSelected}
                    isHovered={isHovered}
                    highlighted={highlighted}
                    registerNodeRef={registerNodeRef}
                    onNodePointerDown={onNodePointerDown}
                    onPointerEnter={setHoveredNodeId}
                    onPointerLeave={() => setHoveredNodeId(null)}
                    onSelect={setSelectedNodeId}
                  />
                );
              })}
            </g>
          </g>
        </svg>

        {/* FLOATING HOVERED EDGE HUD TOOLTIP */}
        {hoveredEdge && (
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full border shadow-xl backdrop-blur-md pointer-events-none text-xs font-mono animate-fadeIn flex items-center gap-2"
            style={{
              backgroundColor: 'var(--theme-surface)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)',
            }}
          >
            <Link2 className="w-3.5 h-3.5" style={{ color: 'var(--theme-accent)' }} />
            <span className="font-bold">{hoveredEdge.source}</span>
            <span className="opacity-50">↔</span>
            <span className="font-bold">{hoveredEdge.target}</span>
            <span className="opacity-40">•</span>
            <span className="italic" style={{ color: 'var(--theme-accent)' }}>
              "{hoveredEdge.label}"
            </span>
          </div>
        )}

        {/* FLOATING CAMERA & PHYSICS CONTROLS (Theme-Bound) */}
        <div
          className="absolute bottom-6 left-6 z-20 flex items-center gap-1.5 backdrop-blur-md border rounded-2xl p-1.5 shadow-2xl transition-colors"
          style={{
            backgroundColor: 'var(--theme-surface)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-text)',
          }}
        >
          <button
            onClick={() => zoomBy(1.25)}
            className="w-8 h-8 rounded-xl flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ color: 'var(--theme-text)' }}
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => zoomBy(0.8)}
            className="w-8 h-8 rounded-xl flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ color: 'var(--theme-text)' }}
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetCamera}
            className="w-8 h-8 rounded-xl flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ color: 'var(--theme-text)' }}
            title="Fit graph to screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-5" style={{ backgroundColor: 'var(--theme-border)' }} />
          <button
            onClick={() => setPhysicsOn((p) => !p)}
            className="w-8 h-8 rounded-xl flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ color: 'var(--theme-text)' }}
            title={physicsOn ? 'Freeze physics' : 'Resume physics'}
          >
            {physicsOn ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={reSpread}
            className="w-8 h-8 rounded-xl flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ color: 'var(--theme-text)' }}
            title="Re-spread the layout"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
          <div
            className="px-2 text-[10px] font-mono border-l"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
          >
            <span ref={zoomLabelRef}>90%</span>
          </div>
        </div>

        {/* NOTE INSPECTOR (Responsive: Mobile Bottom-Sheet / Desktop Right Drawer) */}
        {selectedNode && (
          <div
            id="note-inspector"
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute z-30 flex flex-col justify-between overflow-y-auto shadow-2xl transition-all duration-300 inset-x-0 bottom-0 max-h-[60vh] rounded-t-3xl rounded-b-none border-t border-x p-5 sm:inset-auto sm:top-4 sm:right-4 sm:bottom-6 sm:w-96 sm:rounded-3xl sm:border sm:p-6 backdrop-blur-xl"
            style={{
              backgroundColor: 'var(--theme-surface)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)',
            }}
          >
            <div className="space-y-5">
              {/* Header */}
              <div
                className="flex items-start justify-between border-b pb-4"
                style={{ borderColor: 'var(--theme-border)' }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: 'var(--theme-accent)',
                        color: 'var(--theme-accent-text)',
                      }}
                    >
                      {selectedNode.category}
                    </span>
                    <span className="text-[11px] font-mono" style={{ color: 'var(--theme-text-muted)' }}>
                      {selectedDegree} connections
                    </span>
                  </div>
                  <h2 className="text-2xl font-serif font-black leading-tight" style={{ color: 'var(--theme-text)' }}>
                    {selectedNode.label}
                  </h2>
                  <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                    {selectedNode.era}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="w-7 h-7 rounded-full border flex items-center justify-center transition-colors cursor-pointer opacity-70 hover:opacity-100"
                  style={{
                    borderColor: 'var(--theme-border)',
                    backgroundColor: 'var(--theme-surface-subtle)',
                    color: 'var(--theme-text)',
                  }}
                  title="Close Inspector (Esc)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Central Quote */}
              {selectedNode.quote && (
                <div
                  className="p-4 rounded-2xl border relative shadow-inner"
                  style={{
                    backgroundColor: 'var(--theme-bg)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  <Quote
                    className="w-5 h-5 absolute top-3 right-3 pointer-events-none opacity-20"
                    style={{ color: 'var(--theme-text)' }}
                  />
                  <p className="text-xs italic leading-relaxed pr-6" style={{ color: 'var(--theme-text)' }}>
                    {selectedNode.quote}
                  </p>
                </div>
              )}

              {/* Summary */}
              <div className="space-y-1.5">
                <span
                  className="text-[10px] font-mono uppercase tracking-widest block font-bold"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  Epistemic Summary
                </span>
                <p className="text-xs leading-relaxed font-light" style={{ color: 'var(--theme-text)' }}>
                  {selectedNode.summary}
                </p>
              </div>

              {/* Node Tags */}
              {selectedNode.tags && selectedNode.tags.length > 0 && (
                <div className="space-y-1.5">
                  <span
                    className="text-[10px] font-mono uppercase tracking-widest block font-bold"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    Associated Tags
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.tags.map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setSelectedTagChip(t);
                          setSearchTag('');
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

              {/* Connected Backlinks */}
              <div
                className="space-y-2.5 pt-2 border-t"
                style={{ borderColor: 'var(--theme-border)' }}
              >
                <span
                  className="text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5 font-bold"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Linked Neurons ({neighborLinks.length})</span>
                </span>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {neighborLinks.map((linkItem, idx) => (
                    <button
                      key={idx}
                      onClick={() => jumpToNode(linkItem.otherId)}
                      className="w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group cursor-pointer"
                      style={{
                        backgroundColor: 'var(--theme-surface-subtle)',
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-text)',
                      }}
                    >
                      <div>
                        <div className="text-xs font-serif font-bold group-hover:underline">
                          {linkItem.otherNode?.label || linkItem.otherId}
                        </div>
                        <div
                          className="text-[10px] font-mono capitalize"
                          style={{ color: 'var(--theme-text-muted)' }}
                        >
                          {linkItem.label}
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className="pt-4 border-t flex items-center justify-between text-[10px] font-mono mt-4"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
            >
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
