import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Flame,
  Sparkles,
  Layers,
  Map,
  Clock,
  Image,
} from 'lucide-react';

// ============================================================================
// ASCII CLASSICAL GREEK TEMPLE ARCHITECTURE
// ============================================================================
const TEMPLE_ASCII = [
  '                  /\\',
  '                 /  \\',
  '                / /\\ \\',
  '               / /  \\ \\',
  '              / / /\\ \\ \\',
  '             / / /  \\ \\ \\',
  '       _____/_/_/__\\_\\_\\_____',
  '      |                       |',
  '      |  A P O R I A   I V    |',
  '  ====|=======================|====',
  '    ||   ||   ||     ||   ||   ||',
  '    ||   ||   ||     ||   ||   ||',
  '    ||   ||   ||     ||   ||   ||',
  '    ||   ||   ||     ||   ||   ||',
  '    ||   ||   ||     ||   ||   ||',
  '    ||   ||   ||     ||   ||   ||',
  '    ||   ||   ||     ||   ||   ||',
  '    ||   ||   ||     ||   ||   ||',
  '  ==[]===[]===[]=====[]===[]===[]==',
  ' /                                 \\',
  '/___________________________________\\',
];

const FIRE_CHARS = [' ', '.', ':', '^', '*', '!', '+', 'o', 's', 'x', '#', '@', '&'];

// ============================================================================
// 3D GLASS SHARD GENERATION
// ============================================================================
function createShards(count = 48) {
  const shards = [];
  for (let i = 0; i < count; i++) {
    // Random position in 3D space
    const x = (Math.random() - 0.5) * 1100;
    const y = (Math.random() - 0.5) * 800;
    const z = 250 + Math.random() * 950;

    // Irregular triangular or quad polygon vertices in shard local space
    const size = 18 + Math.random() * 45;
    const vertices = [];
    const numPts = 3 + (Math.random() > 0.6 ? 1 : 0);
    const baseAngle = Math.random() * Math.PI * 2;
    for (let p = 0; p < numPts; p++) {
      const angle = baseAngle + (p * Math.PI * 2) / numPts + (Math.random() - 0.5) * 0.5;
      const r = size * (0.55 + Math.random() * 0.9);
      vertices.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
        z: (Math.random() - 0.5) * (size * 0.25),
      });
    }

    shards.push({
      x,
      y,
      z,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      vz: (Math.random() - 0.5) * 0.4,
      rotX: Math.random() * Math.PI * 2,
      rotY: Math.random() * Math.PI * 2,
      rotZ: Math.random() * Math.PI * 2,
      vRotX: (Math.random() - 0.5) * 0.02,
      vRotY: (Math.random() - 0.5) * 0.02,
      vRotZ: (Math.random() - 0.5) * 0.02,
      vertices,
      opacity: 0.15 + Math.random() * 0.35,
      specularTimer: Math.random() * Math.PI * 2,
    });
  }
  return shards;
}

export default function NotFound() {
  const canvasRef = useRef(null);
  const [visualMode, setVisualMode] = useState('both'); // 'glass' | 'temple' | 'both'
  const [asciiFire, setAsciiFire] = useState('');
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // --------------------------------------------------------------------------
  // PROCEDURAL ASCII FIRE OVER TEMPLE
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (visualMode === 'glass') return undefined;

    const width = 39;
    const height = 12;
    // Fire buffer
    let fireMap = new Array(width * height).fill(0);

    const timer = setInterval(() => {
      // Bottom fire generation row (random intense ember bursts)
      for (let x = 0; x < width; x++) {
        // Higher intensity near columns
        const isColumnZone = x >= 4 && x <= 34 && Math.random() > 0.3;
        fireMap[(height - 1) * width + x] = isColumnZone ? Math.floor(Math.random() * 12) + 2 : 0;
      }

      // Propagate fire upward with cooling decay and horizontal diffusion
      for (let y = 0; y < height - 1; y++) {
        for (let x = 0; x < width; x++) {
          const left = x > 0 ? fireMap[(y + 1) * width + (x - 1)] : 0;
          const center = fireMap[(y + 1) * width + x];
          const right = x < width - 1 ? fireMap[(y + 1) * width + (x + 1)] : 0;
          const decay = Math.floor(Math.random() * 2);
          const newVal = Math.max(0, Math.floor((left + center + right) / 3.05) - decay);
          fireMap[y * width + x] = newVal;
        }
      }

      // Convert buffer into string
      const lines = [];
      for (let y = 0; y < height; y++) {
        let line = '';
        for (let x = 0; x < width; x++) {
          const val = fireMap[y * width + x];
          const char = FIRE_CHARS[Math.min(val, FIRE_CHARS.length - 1)];
          line += char;
        }
        lines.push(line);
      }
      setAsciiFire(lines.join('\n'));
    }, 90);

    return () => clearInterval(timer);
  }, [visualMode]);

  // --------------------------------------------------------------------------
  // 3D FLOATING SHATTERED GLASS ENGINE (CANVAS)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let animId = 0;
    const shards = createShards(52);
    const focalLength = 650;

    const handleResize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      mouseRef.current.targetX = nx * 80;
      mouseRef.current.targetY = ny * 80;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Click: explosive impulse radiating outward from center
    const handleClick = () => {
      shards.forEach((s) => {
        const angle = Math.atan2(s.y, s.x);
        const force = 3.5 + Math.random() * 5;
        s.vx += Math.cos(angle) * force;
        s.vy += Math.sin(angle) * force;
        s.vRotX += (Math.random() - 0.5) * 0.08;
        s.vRotY += (Math.random() - 0.5) * 0.08;
      });
    };
    canvas.addEventListener('click', handleClick);

    const render = () => {
      animId = requestAnimationFrame(render);
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Smooth camera pan toward mouse
      const m = mouseRef.current;
      m.x += (m.targetX - m.x) * 0.05;
      m.y += (m.targetY - m.y) * 0.05;

      // Sort shards by depth (painter's algorithm)
      shards.sort((a, b) => b.z - a.z);

      for (let i = 0; i < shards.length; i++) {
        const s = shards[i];

        // Step physics & rotation
        s.x += s.vx;
        s.y += s.vy;
        s.z += s.vz;
        s.rotX += s.vRotX;
        s.rotY += s.vRotY;
        s.rotZ += s.vRotZ;
        s.specularTimer += 0.02;

        // Damping on explosive impulse
        s.vx *= 0.985;
        s.vy *= 0.985;
        s.vz *= 0.985;

        // Bounding bounce & loop
        if (s.z < 120) s.z = 1000;
        if (s.z > 1050) s.z = 150;
        if (s.x < -600) s.x = 600;
        if (s.x > 600) s.x = -600;
        if (s.y < -450) s.y = 450;
        if (s.y > 450) s.y = -450;

        // 3D rotation matrix for shard vertices
        const cosX = Math.cos(s.rotX);
        const sinX = Math.sin(s.rotX);
        const cosY = Math.cos(s.rotY);
        const sinY = Math.sin(s.rotY);
        const cosZ = Math.cos(s.rotZ);
        const sinZ = Math.sin(s.rotZ);

        // Project 3D vertices
        const proj = [];
        let avgZ = 0;

        for (let p = 0; p < s.vertices.length; p++) {
          const v = s.vertices[p];

          // Rotate around X
          let y1 = v.y * cosX - v.z * sinX;
          let z1 = v.y * sinX + v.z * cosX;

          // Rotate around Y
          let x2 = v.x * cosY + z1 * sinY;
          let z2 = -v.x * sinY + z1 * cosY;

          // Rotate around Z
          let x3 = x2 * cosZ - y1 * sinZ;
          let y3 = x2 * sinZ + y1 * cosZ;

          // Translate to world space with mouse camera parallax
          const wx = s.x + x3 - m.x;
          const wy = s.y + y3 - m.y;
          const wz = s.z + z2;

          if (wz <= 10) continue;
          avgZ += wz;

          // Perspective projection
          const px = cx + (wx * focalLength) / wz;
          const py = cy + (wy * focalLength) / wz;
          proj.push({ x: px, y: py });
        }

        if (proj.length < 3) continue;

        // Normal computation for specular facet glint
        const d1x = proj[1].x - proj[0].x;
        const d1y = proj[1].y - proj[0].y;
        const d2x = proj[2].x - proj[0].x;
        const d2y = proj[2].y - proj[0].y;
        const cross = d1x * d2y - d1y * d2x;

        // Shimmer specular intensity
        const shimmer = Math.sin(s.specularTimer) * 0.5 + 0.5;
        const glint = Math.abs(cross) > 200 && shimmer > 0.85 ? 0.45 : 0;
        const alpha = Math.min(1, s.opacity + glint);

        // Draw glass shard facet
        ctx.beginPath();
        ctx.moveTo(proj[0].x, proj[0].y);
        for (let p = 1; p < proj.length; p++) {
          ctx.lineTo(proj[p].x, proj[p].y);
        }
        ctx.closePath();

        // Crystalline gradient fill
        const grad = ctx.createLinearGradient(
          proj[0].x,
          proj[0].y,
          proj[proj.length - 1].x,
          proj[proj.length - 1].y
        );
        grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.12})`);
        grad.addColorStop(0.5, `rgba(220, 235, 255, ${alpha * 0.22})`);
        grad.addColorStop(1, `rgba(255, 255, 255, ${alpha * 0.05})`);

        ctx.fillStyle = grad;
        ctx.fill();

        // Sharp faceted glass edge with specular highlight
        ctx.lineWidth = glint > 0 ? 1.6 : 0.8;
        ctx.strokeStyle =
          glint > 0
            ? `rgba(255, 255, 255, ${Math.min(1, alpha * 2.2)})`
            : `rgba(255, 255, 255, ${alpha * 0.45})`;
        ctx.stroke();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-5rem)] w-full overflow-hidden bg-black text-white font-serif flex items-center justify-center p-4 sm:p-8 select-none">
      {/* 3D FLOATING SHATTERED GLASS CANVAS LAYER */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full pointer-events-auto transition-opacity duration-700 ${
          visualMode === 'temple' ? 'opacity-20' : 'opacity-100'
        }`}
        title="Click anywhere to shatter shards outward"
      />

      {/* SUBTLE BACKGROUND GRID */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1.2px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* TOP FLOATING VISUAL MODE TOGGLE */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-1 bg-zinc-950/90 border border-white/20 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md">
        <button
          onClick={() => setVisualMode('both')}
          className={`btn btn-xs rounded-xl font-mono text-[10px] gap-1 cursor-pointer transition-all ${
            visualMode === 'both'
              ? 'bg-white text-black font-bold'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
          title="Dual Mode: 3D Floating Glass & Burning Temple Ruins"
        >
          <Layers className="w-3 h-3" />
          <span>Synthesized</span>
        </button>
        <button
          onClick={() => setVisualMode('glass')}
          className={`btn btn-xs rounded-xl font-mono text-[10px] gap-1 cursor-pointer transition-all ${
            visualMode === 'glass'
              ? 'bg-white text-black font-bold'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
          title="Shattered 3D Glass Space"
        >
          <Sparkles className="w-3 h-3" />
          <span>3D Glass</span>
        </button>
        <button
          onClick={() => setVisualMode('temple')}
          className={`btn btn-xs rounded-xl font-mono text-[10px] gap-1 cursor-pointer transition-all ${
            visualMode === 'temple'
              ? 'bg-white text-black font-bold'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
          title="Burning Temple ASCII Flame"
        >
          <Flame className="w-3 h-3" />
          <span>Burning Temple</span>
        </button>
      </div>

      {/* CENTRAL 404 MONUMENT CONTAINER */}
      <div className="relative z-10 max-w-2xl w-full mx-auto flex flex-col items-center text-center space-y-6 pointer-events-none">
        {/* ANIMATED ASCII BURNING TEMPLE (When in temple or both mode) */}
        {(visualMode === 'temple' || visualMode === 'both') && (
          <div className="relative font-mono text-[9px] sm:text-[10.5px] leading-[11px] text-white/70 select-none overflow-hidden max-h-48 sm:max-h-56 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">
            {/* ASCII Flame Embers Over the Temple Roof */}
            <pre className="text-amber-300/80 font-bold tracking-tight select-none pointer-events-none">
              {asciiFire}
            </pre>
            {/* ASCII Temple Columns & Pediment */}
            <pre className="text-white/80 tracking-tight select-none pointer-events-none">
              {TEMPLE_ASCII.join('\n')}
            </pre>
          </div>
        )}

        {/* MONUMENTAL 404 TYPOGRAPHY */}
        <div className="space-y-2 pointer-events-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white font-mono text-xs shadow-lg backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            <span className="uppercase tracking-widest font-bold">Aporia • The Void of Non-Being</span>
          </div>

          <h1 className="text-6xl sm:text-8xl md:text-9xl font-serif font-black text-white tracking-tighter leading-none select-none drop-shadow-2xl">
            404
          </h1>

          <p className="text-sm sm:text-base font-serif italic text-white/75 max-w-lg mx-auto leading-relaxed">
            “τὸ γὰρ αὐτὸ νοεῖν ἐστίν τε καὶ εἶναι — For thought and being are the same. But that which is not can neither be known nor uttered.”
          </p>
          <div className="text-[11px] font-mono text-white/40 tracking-wider">
            — Parmenides of Elea, On Nature (c. 475 BC)
          </div>
        </div>

        {/* SCHOLARLY EXPOSITION */}
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/85 border border-white/20 max-w-lg shadow-2xl backdrop-blur-md space-y-2 pointer-events-auto">
          <div className="text-xs font-mono text-white/90 leading-relaxed font-light">
            You have crossed the epistemic horizon into unformed matter (<span className="italic font-serif">prima materia</span>). The route you requested does not exist within our cosmological coordinate framework.
          </div>
          <div className="text-[10.5px] font-mono text-white/50">
            Hint: Click on the background canvas to shatter the 3D crystal shards outward.
          </div>
        </div>

        {/* NAVIGATION EXPEDITIONS */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 pointer-events-auto">
          <Link
            to="/"
            className="btn btn-sm bg-white text-black hover:bg-zinc-200 border-none font-bold rounded-xl gap-2 shadow-xl cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="font-mono text-xs">Return to Agora</span>
          </Link>

          <Link
            to="/timeline"
            className="btn btn-sm btn-outline border-white/25 text-white hover:bg-white hover:text-black rounded-xl gap-2 font-mono text-xs cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Chronos Timeline</span>
          </Link>

          <Link
            to="/gallery"
            className="btn btn-sm btn-outline border-white/25 text-white hover:bg-white hover:text-black rounded-xl gap-2 font-mono text-xs cursor-pointer"
          >
            <Image className="w-3.5 h-3.5" />
            <span>Infinite Gallery</span>
          </Link>

          <Link
            to="/map"
            className="btn btn-sm btn-outline border-white/25 text-white hover:bg-white hover:text-black rounded-xl gap-2 font-mono text-xs cursor-pointer"
          >
            <Map className="w-3.5 h-3.5" />
            <span>Neuron Map</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
