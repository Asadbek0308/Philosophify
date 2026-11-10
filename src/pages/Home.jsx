import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Network,
  Clock,
  BookOpen,
  ArrowRight,
  Compass,
  Sparkles,
  Terminal,
  Activity,
  Flame,
  ChevronRight,
  Quote,
  ArrowDown,
} from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const HERO_CYBER_PHILOSOPHER = {
  src: '/hero/cyber-philosopher.jpg',
  title: 'The Augmented Dialectic',
  subject: 'SOCRATES OF ATHENS // NEURAL VISOR v2.4',
  epoch: '399 BC // 2026 AD',
  description:
    'Ancient Socratic interrogation synthesized with modern artificial neural networks. The unexamined life meets computational clarity.',
  badge: 'Cognitive Architecture',
  coords: '37.9838° N, 23.7275° E',
  metric: '142.8 MHz Dialectic Core',
};

const ATHENS_FOCAL_NODES = [
  {
    id: 'plato',
    name: 'Plato of Athens',
    years: '427–348 BC',
    thesis: 'Theory of Ideal Forms // Platonic Idealism',
    pos: 'left-[47.2%] top-[48%]',
    desc: 'Plato gestures upward toward the heavens, asserting that the physical world is merely a shadow of eternal, immutable metaphysical Forms.',
    work: 'Timaeus, The Republic, Phaedo',
  },
  {
    id: 'aristotle',
    name: 'Aristotle of Stagira',
    years: '384–322 BC',
    thesis: 'Empirical Naturalism & Immanent Form',
    pos: 'left-[52.8%] top-[49.5%]',
    desc: 'Aristotle holds his palm flat toward the earth, asserting that truth is grounded through sensory observation, biology, and natural taxonomy.',
    work: 'Nicomachean Ethics, Physics, Metaphysics',
  },
  {
    id: 'diogenes',
    name: 'Diogenes of Sinope',
    years: 'c. 412–323 BC',
    thesis: 'Cynic Asceticism & Radical Autonomy',
    pos: 'left-[57.5%] top-[72%]',
    desc: 'Reclining casually on the temple steps with his cloak and bowl, mocking abstract dogma and living in total defiance of social pretense.',
    work: 'Living Philosophy (Diogenes Laërtius)',
  },
];

const PERENNIAL_INQUIRIES = [
  {
    id: 'virtue',
    tag: 'Ethics & Stoicism',
    query: 'What is the nature of virtue and the good life?',
    thinker: 'Marcus Aurelius & Epictetus',
    axiom: '“You have power over your mind — not outside events. Realize this, and you will find strength.”',
    school: 'Roman Stoicism',
    epoch: '161 AD',
    targetLink: '/timeline',
    linkLabel: 'Trace on Chronos Reel',
  },
  {
    id: 'freewill',
    tag: 'Metaphysics & Agency',
    query: 'Does genuine human agency and free will exist?',
    thinker: 'Baruch Spinoza & Arthur Schopenhauer',
    axiom: '“Men believe themselves free only because they are conscious of their actions and ignorant of the causes.”',
    school: 'Determinism & Monism',
    epoch: '1677 AD',
    targetLink: '/map',
    linkLabel: 'Inspect Node Lineage',
  },
  {
    id: 'absurdity',
    tag: 'Existential Absurdism',
    query: 'How should consciousness confront an indifferent universe?',
    thinker: 'Albert Camus & Jean-Paul Sartre',
    axiom: '“In the midst of winter, I found there was, within me, an invincible summer.”',
    school: 'Absurdism & Revolt',
    epoch: '1942 AD',
    targetLink: '/gallery',
    linkLabel: 'View Sisyphus in Gallery',
  },
  {
    id: 'epistemology',
    tag: 'Theory of Ideal Forms',
    query: 'Is sensory perception reality or merely a shadow?',
    thinker: 'Plato of Athens',
    axiom: '“The soul takes nothing with her to the other world but her education and culture.”',
    school: 'Platonism & Rationalism',
    epoch: '380 BC',
    targetLink: '/map',
    linkLabel: 'Open Second Brain Graph',
  },
  {
    id: 'justice',
    tag: 'Political Philosophy',
    query: 'What constitutes the legitimate foundation of a state?',
    thinker: 'Jean-Jacques Rousseau',
    axiom: '“Man is born free, and everywhere he is in chains.”',
    school: 'Social Contract Theory',
    epoch: '1762 AD',
    targetLink: '/timeline',
    linkLabel: 'Locate on Timeline',
  },
];

export default function Home() {
  const [activeInquiry, setActiveInquiry] = useState(PERENNIAL_INQUIRIES[0]);
  const [activeThinkerId, setActiveThinkerId] = useState('plato');
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const heroLeftRef = useRef(null);
  const heroRightRef = useRef(null);
  const panoramaRef = useRef(null);
  const panoramaImgRef = useRef(null);
  const dialecticRef = useRef(null);
  const maximRef = useRef(null);
  const scrollPromptRef = useRef(null);

  const activeThinker = ATHENS_FOCAL_NODES.find((t) => t.id === activeThinkerId) || ATHENS_FOCAL_NODES[0];

  // Subtle 3D mouse tilt over hero image card
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseTilt({ x: x * 8, y: -y * 8 });
  };

  const handleMouseLeave = () => {
    setMouseTilt({ x: 0, y: 0 });
  };

  // GSAP ScrollTrigger Setup
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Hero Parallax
      if (heroRightRef.current && heroLeftRef.current) {
        gsap.to(heroRightRef.current, {
          yPercent: -12,
          ease: 'none',
          scrollTrigger: {
            trigger: heroLeftRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.2,
          },
        });
      }

      // 2. Hide scroll prompt on scroll
      if (scrollPromptRef.current) {
        gsap.to(scrollPromptRef.current, {
          opacity: 0,
          y: 15,
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: '+=120',
            scrub: true,
          },
        });
      }

      // 3. Panorama Zoom & Parallax Scrub
      if (panoramaRef.current && panoramaImgRef.current) {
        gsap.fromTo(
          panoramaImgRef.current,
          { scale: 1.12, yPercent: -6 },
          {
            scale: 1.0,
            yPercent: 6,
            ease: 'none',
            scrollTrigger: {
              trigger: panoramaRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            },
          }
        );
      }

      // 4. Dialectic Stream Reveal
      if (dialecticRef.current) {
        gsap.from(dialecticRef.current, {
          y: 40,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: dialecticRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        });
      }

      // 5. Maxim Banner Reveal
      if (maximRef.current) {
        gsap.from(maximRef.current, {
          scale: 0.98,
          opacity: 0,
          duration: 0.75,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: maximRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen font-serif transition-colors duration-200"
      style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}
    >
      {/* ====================================================================
          HERO SECTION: FOCAL NEURON VISOR v2.4 STAGE
          ==================================================================== */}
      <section
        className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b overflow-hidden"
        style={{ borderColor: 'var(--theme-border)' }}
      >
        {/* Subtle Ambient Radial Light (Hermes Focal Glow) */}
        <div
          aria-hidden="true"
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[550px] pointer-events-none opacity-10 blur-3xl"
          style={{
            background: 'radial-gradient(circle, var(--theme-accent) 0%, transparent 70%)',
          }}
        />

        {/* Ambient Grid Matrix */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, currentColor 1.2px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10 space-y-10">
          {/* Top Telemetry Status Bar */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono border-b pb-4"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: 'var(--theme-accent)' }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ backgroundColor: 'var(--theme-accent)' }}
                />
              </span>
              <span
                className="font-bold tracking-widest uppercase"
                style={{ color: 'var(--theme-text)' }}
              >
                PHILOSOPHIA PRIMA // APPARATUS v2.4
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-4 opacity-75">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-current" />
                <span>STATE: COGNITIVE ILLUMINATION</span>
              </span>
              <span>•</span>
              <span>LATENCY: 0.04ms</span>
              <span>•</span>
              <span>EPOCH: 2,625 YEARS</span>
            </div>
          </div>

          {/* DUAL-PILLAR HERO CONTENT & FOCAL NEURAL VISOR MASTERPIECE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Narrative Column (7 cols on lg) */}
            <div ref={heroLeftRef} className="lg:col-span-7 space-y-6 text-left">
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[11px] font-mono tracking-widest uppercase backdrop-blur-sm shadow-sm"
                style={{
                  borderColor: 'var(--theme-border)',
                  backgroundColor: 'var(--theme-surface)',
                  color: 'var(--theme-text)',
                }}
              >
                <Sparkles className="w-3.5 h-3.5 text-current" />
                <span>Interconnected Epistemic Intelligence Engine</span>
              </div>

              <h1
                className="text-4xl sm:text-6xl lg:text-7xl font-serif font-black tracking-tight leading-[1.06] text-balance"
                style={{ color: 'var(--theme-text)' }}
              >
                THE ARCHITECTURE OF CONTEMPLATION
              </h1>

              <p
                className="text-base sm:text-lg max-w-2xl leading-relaxed font-light"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                Synthesizing 2,500 years of human dialectic into an active, navigable cognitive graph. Interrogate perennial paradigms across 1,000 historical milestones, trace neural lineages, or wander through an infinite universe of classical art.
              </p>

              {/* UNIFIED ACTION BUTTONS WITH FLAWLESS HOVER CONTRAST */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <NavLink
                  to="/map"
                  className="hero-btn-primary group h-11 px-5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Network className="w-4 h-4 text-current transition-transform duration-200 group-hover:rotate-12" />
                  <span>Explore Second Brain</span>
                  <ArrowRight className="w-4 h-4 text-current transition-transform duration-200 group-hover:translate-x-1" />
                </NavLink>

                <NavLink
                  to="/timeline"
                  className="hero-btn-secondary group h-11 px-5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Clock className="w-4 h-4 text-current transition-transform duration-200 group-hover:rotate-45" />
                  <span>Chronos Reel</span>
                </NavLink>

                <NavLink
                  to="/gallery"
                  className="hero-btn-secondary group h-11 px-5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-current transition-transform duration-200 group-hover:rotate-90" />
                  <span>Infinite Gallery</span>
                </NavLink>

                <NavLink
                  to="/resources"
                  className="hero-btn-secondary group h-11 px-5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-current" />
                  <span>Compendia</span>
                </NavLink>
              </div>

              {/* Micro-Telemetry Feature Bar */}
              <div
                className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t text-xs font-mono"
                style={{ borderColor: 'var(--theme-border)' }}
              >
                <div>
                  <div className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>
                    1,000
                  </div>
                  <div className="text-[10px] uppercase opacity-60">Milestones</div>
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>
                    60+
                  </div>
                  <div className="text-[10px] uppercase opacity-60">Thinkers</div>
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>
                    40
                  </div>
                  <div className="text-[10px] uppercase opacity-60">Artworks</div>
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>
                    2,625
                  </div>
                  <div className="text-[10px] uppercase opacity-60">Years of Lore</div>
                </div>
              </div>
            </div>

            {/* Right Visual Column: Pure Focal Masterpiece (Neuron Visor v2.4) */}
            <div ref={heroRightRef} className="lg:col-span-5 relative w-full max-w-md mx-auto lg:max-w-none">
              <div
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="relative rounded-3xl overflow-hidden shadow-2xl transition-transform duration-200"
                style={{
                  backgroundColor: 'var(--theme-surface)',
                  border: '1px solid var(--theme-border)',
                  transform: `perspective(1000px) rotateX(${mouseTilt.y}deg) rotateY(${mouseTilt.x}deg)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* HUD Header Bar with Un-clipped Beacon & Well-Padded Tag */}
                <div
                  className="flex items-center justify-between px-4 py-3 border-b text-[11px] font-mono"
                  style={{
                    borderColor: 'var(--theme-border)',
                    backgroundColor: 'var(--theme-surface-subtle)',
                    color: 'var(--theme-text-muted)',
                  }}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="relative flex h-2.5 w-2.5 shrink-0 ml-0.5">
                      <span
                        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ backgroundColor: 'var(--theme-accent)' }}
                      />
                      <span
                        className="relative inline-flex rounded-full h-2.5 w-2.5"
                        style={{ backgroundColor: 'var(--theme-accent)' }}
                      />
                    </span>
                    <span className="font-bold tracking-wider truncate font-mono text-[11px]" style={{ color: 'var(--theme-text)' }}>
                      {HERO_CYBER_PHILOSOPHER.subject}
                    </span>
                  </div>
                  <span
                    className="px-3 py-1 rounded-lg font-mono text-[10px] font-bold shrink-0 tracking-wider uppercase shadow-xs ml-2"
                    style={{
                      backgroundColor: 'var(--theme-accent)',
                      color: 'var(--theme-accent-text)',
                      border: '1px solid var(--theme-accent)',
                    }}
                  >
                    {HERO_CYBER_PHILOSOPHER.badge}
                  </span>
                </div>

                {/* Artwork Viewport (No Dark Gradient Over Text) */}
                <div className="relative aspect-square overflow-hidden bg-black/5 flex items-center justify-center">
                  {/* Laser Scanning Beam */}
                  <div className="scanline-beam" />

                  {/* Geometric HUD Brackets */}
                  <div className="hud-bracket hud-tl" />
                  <div className="hud-bracket hud-tr" />
                  <div className="hud-bracket hud-bl" />
                  <div className="hud-bracket hud-br" />

                  {/* Artwork Image */}
                  <img
                    src={HERO_CYBER_PHILOSOPHER.src}
                    alt={HERO_CYBER_PHILOSOPHER.title}
                    className="w-full h-full object-cover object-center transition-all duration-700 hover:scale-105"
                    loading="eager"
                  />
                </div>

                {/* High-Contrast Architectural Caption Panel (Fully Theme-Responsive) */}
                <div
                  className="p-4 border-t space-y-2 text-left transition-colors"
                  style={{
                    backgroundColor: 'var(--theme-surface)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)',
                  }}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-sm font-serif" style={{ color: 'var(--theme-text)' }}>
                      {HERO_CYBER_PHILOSOPHER.title}
                    </span>
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold"
                      style={{
                        backgroundColor: 'var(--theme-surface-subtle)',
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-text-muted)',
                      }}
                    >
                      {HERO_CYBER_PHILOSOPHER.epoch}
                    </span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed font-light" style={{ color: 'var(--theme-text-muted)' }}>
                    {HERO_CYBER_PHILOSOPHER.description}
                  </p>
                  <div
                    className="text-[10px] font-mono pt-2 border-t flex items-center justify-between"
                    style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
                  >
                    <span>{HERO_CYBER_PHILOSOPHER.coords}</span>
                    <span className="font-bold font-mono" style={{ color: 'var(--theme-text)' }}>
                      {HERO_CYBER_PHILOSOPHER.metric}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Down Prompt Indicator */}
          <div
            ref={scrollPromptRef}
            className="flex items-center justify-center pt-2 text-[11px] font-mono opacity-70 animate-float-gentle"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            <div className="flex items-center gap-2">
              <ArrowDown className="w-3.5 h-3.5 text-current" />
              <span className="uppercase tracking-widest text-[10px]">
                Scroll To Explore Dialectic Apparatus
              </span>
              <ArrowDown className="w-3.5 h-3.5 text-current" />
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SCROLL-BASED ARCHITECTURAL PANORAMA: THE ACADEMY OF ATHENS
          (White Backgrounds in Light Theme, Chest Hotspots, High Contrast)
          ==================================================================== */}
      <section
        ref={panoramaRef}
        className="relative py-20 px-4 sm:px-6 lg:px-8 border-b overflow-hidden"
        style={{ borderColor: 'var(--theme-border)' }}
      >
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Section Heading */}
          <div
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-5"
            style={{ borderColor: 'var(--theme-border)' }}
          >
            <div>
              <span
                className="text-xs font-mono uppercase tracking-widest block mb-1"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                Fresco of Convergence // Raphael Sanzio (1509 AD)
              </span>
              <h2
                className="text-2xl sm:text-3xl font-serif font-bold"
                style={{ color: 'var(--theme-text)' }}
              >
                The Academy of Athens
              </h2>
            </div>
            <p
              className="text-xs font-mono max-w-md"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              Click or tap any philosopher pin on the fresco to inspect their foundational thesis and epistemology.
            </p>
          </div>

          {/* Panoramic Stage with Scroll Parallax */}
          <div
            className="relative h-[400px] sm:h-[500px] rounded-3xl overflow-hidden shadow-2xl border group"
            style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-surface)' }}
          >
            {/* The Image with Parallax Scrub */}
            <div className="absolute inset-0 overflow-hidden">
              <img
                ref={panoramaImgRef}
                src="/hero/school-of-athens.jpg"
                alt="The School of Athens by Raphael"
                className="w-full h-full object-cover object-center will-change-transform"
              />
            </div>

            {/* Dark Ambient Vignette for Painting Clarity */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/25 pointer-events-none" />

            {/* PRECISE CHEST HOTSPOT PINS */}
            <div className="absolute inset-0 pointer-events-auto">
              {ATHENS_FOCAL_NODES.map((node) => {
                const isSelected = activeThinkerId === node.id;
                return (
                  <div
                    key={node.id}
                    className={`absolute ${node.pos} -translate-x-1/2 -translate-y-1/2 group/pin z-20`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveThinkerId(node.id)}
                      className="relative flex items-center justify-center cursor-pointer focus:outline-none p-2"
                      aria-label={`Inspect ${node.name}`}
                    >
                      {/* Outer pulse wave */}
                      <span
                        className={`w-5 h-5 rounded-full animate-ping opacity-75 absolute ${
                          isSelected ? 'bg-red-500 scale-125' : 'bg-white'
                        }`}
                      />
                      {/* Center pin located right on chest */}
                      <span
                        className={`w-4 h-4 rounded-full font-bold flex items-center justify-center text-[9px] shadow-2xl border-2 transition-transform ${
                          isSelected
                            ? 'bg-red-500 text-white border-white scale-125'
                            : 'bg-white text-black border-black/70 hover:scale-110'
                        }`}
                      >
                        •
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* HIGH-CONTRAST INSPECTION OVERLAY (Pure White in Light Theme) */}
            <div className="athens-hud-card absolute top-4 right-4 sm:top-6 sm:right-6 max-w-sm w-full p-4 sm:p-5 rounded-2xl backdrop-blur-md z-30 space-y-2.5 text-left">
              <div
                className="flex items-center justify-between border-b pb-2 text-[10px] font-mono"
                style={{ borderColor: 'var(--theme-border)' }}
              >
                <span className="uppercase font-semibold opacity-70">Chest Reticle Focus</span>
                <span
                  className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold"
                  style={{
                    backgroundColor: 'var(--theme-accent)',
                    color: 'var(--theme-accent-text)',
                  }}
                >
                  {activeThinker.years}
                </span>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold" style={{ color: 'var(--theme-text)' }}>
                  {activeThinker.name}
                </h3>
                <div className="text-xs font-mono font-semibold mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                  {activeThinker.thesis}
                </div>
              </div>
              <p className="text-xs leading-relaxed font-light" style={{ color: 'var(--theme-text)' }}>
                {activeThinker.desc}
              </p>
              <div
                className="text-[10px] font-mono pt-1.5 border-t flex items-center justify-between"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
              >
                <span>Core: {activeThinker.work}</span>
              </div>

              {/* Quick Thinker Switcher Buttons with Guaranteed Contrast */}
              <div className="grid grid-cols-3 gap-1.5 pt-1 font-mono text-[10px]">
                {ATHENS_FOCAL_NODES.map((t) => {
                  const isCurrent = activeThinkerId === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveThinkerId(t.id)}
                      className="py-1 px-1.5 rounded-lg border text-center transition-all cursor-pointer font-bold"
                      style={{
                        backgroundColor: isCurrent ? 'var(--theme-accent)' : 'var(--theme-surface-subtle)',
                        color: isCurrent ? 'var(--theme-accent-text)' : 'var(--theme-text-muted)',
                        borderColor: isCurrent ? 'var(--theme-accent)' : 'var(--theme-border)',
                      }}
                    >
                      {t.name.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BOTTOM INSCRIPTION CARD (Pure White in Light Theme) */}
            <div className="athens-hud-card absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto max-w-lg p-4 sm:p-5 rounded-2xl backdrop-blur-md z-30 space-y-2 text-left">
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider opacity-80">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--theme-accent)' }} />
                <span>Dialectic Continuum // 60+ Master Thinkers</span>
              </div>
              <blockquote className="text-sm sm:text-base font-serif italic leading-relaxed" style={{ color: 'var(--theme-text)' }}>
                “We do not think in isolation. Every thought is a continuation of a dialogue begun thousands of years ago.”
              </blockquote>
              <div className="pt-1 flex items-center justify-between">
                <span className="text-[10px] font-mono opacity-70">Vatican Stanza della Segnatura</span>
                <NavLink
                  to="/gallery"
                  className="hero-btn-primary px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-md hover:scale-105 transition-transform cursor-pointer"
                >
                  <span>Open in Gallery</span>
                  <ArrowRight className="w-3.5 h-3.5 text-current" />
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          HERMES-INSPIRED DIALECTIC THOUGHT CONSOLE (INTERACTIVE INQUIRY)
          ==================================================================== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div
          ref={dialecticRef}
          className="rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md relative overflow-hidden space-y-5"
          style={{
            backgroundColor: 'var(--theme-surface)',
            border: '1px solid var(--theme-border)',
            color: 'var(--theme-text)',
          }}
        >
          {/* Console Header */}
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4"
            style={{ borderColor: 'var(--theme-border)' }}
          >
            <div className="flex items-center gap-2 text-xs font-mono" style={{ color: 'var(--theme-text)' }}>
              <Terminal className="w-4 h-4 text-current" />
              <span className="uppercase font-bold tracking-wider">
                Perennial Inquiries // Dialectic Stream
              </span>
            </div>
            <span
              className="text-[11px] font-mono"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              Select a fundamental question to route across the philosophical network
            </span>
          </div>

          {/* Inquiry Pills Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {PERENNIAL_INQUIRIES.map((inq) => {
              const isSelected = activeInquiry.id === inq.id;
              return (
                <button
                  key={inq.id}
                  onClick={() => setActiveInquiry(inq)}
                  className="px-3.5 py-1.5 rounded-xl font-mono text-xs whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-2"
                  style={{
                    backgroundColor: isSelected ? 'var(--theme-accent)' : 'var(--theme-surface-subtle)',
                    color: isSelected ? 'var(--theme-accent-text)' : 'var(--theme-text-muted)',
                    border: `1px solid ${isSelected ? 'var(--theme-accent)' : 'var(--theme-border)'}`,
                    fontWeight: isSelected ? 'bold' : 'normal',
                    boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                  }}
                >
                  <span>{inq.tag}</span>
                </button>
              );
            })}
          </div>

          {/* Active Dialectic Card */}
          <div
            className="p-5 sm:p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-inner transition-all duration-200 text-left"
            style={{
              backgroundColor: 'var(--theme-bg)',
              border: '1px solid var(--theme-border)',
            }}
          >
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-0.5 rounded-md font-mono text-xs font-bold border-none"
                  style={{
                    backgroundColor: 'var(--theme-accent)',
                    color: 'var(--theme-accent-text)',
                  }}
                >
                  {activeInquiry.epoch}
                </span>
                <span
                  className="text-xs font-mono uppercase tracking-wider"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  {activeInquiry.school}
                </span>
              </div>
              <h3
                className="text-xl sm:text-2xl font-serif font-bold leading-tight"
                style={{ color: 'var(--theme-text)' }}
              >
                "{activeInquiry.query}"
              </h3>
              <div
                className="p-3.5 rounded-xl relative"
                style={{
                  backgroundColor: 'var(--theme-surface)',
                  border: '1px solid var(--theme-border)',
                }}
              >
                <Quote
                  className="w-4 h-4 absolute top-2 right-2 pointer-events-none opacity-20"
                  style={{ color: 'var(--theme-text)' }}
                />
                <p
                  className="text-xs sm:text-sm font-serif italic leading-relaxed pr-6"
                  style={{ color: 'var(--theme-text)' }}
                >
                  {activeInquiry.axiom}
                </p>
                <div
                  className="text-[10.5px] font-mono mt-1"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  — Formulated by{' '}
                  <span className="font-semibold" style={{ color: 'var(--theme-text)' }}>
                    {activeInquiry.thinker}
                  </span>
                </div>
              </div>
            </div>

            {/* Portal Jump Action */}
            <div className="shrink-0">
              <NavLink
                to={activeInquiry.targetLink}
                className="hero-btn-primary group px-4 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all duration-200 shadow-md cursor-pointer"
              >
                <span>{activeInquiry.linkLabel}</span>
                <ChevronRight className="w-4 h-4 text-current transition-transform duration-200 group-hover:translate-x-1" />
              </NavLink>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          ACTIVE INSTRUMENTS APPARATUS
          (Dense, Visually Alive Mini-Stages with Padded Tags & Universal Contrast)
          ==================================================================== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 border-b pb-6"
          style={{ borderColor: 'var(--theme-border)' }}
        >
          <div>
            <span
              className="text-xs font-mono uppercase tracking-widest block mb-1"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              Primary Instruments
            </span>
            <h2
              className="text-2xl sm:text-3xl font-serif font-bold"
              style={{ color: 'var(--theme-text)' }}
            >
              Dialectical Apparatus
            </h2>
          </div>
          <span
            className="text-xs font-mono"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            Four interconnected perspectives examining 2,500 years of perennial inquiry.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Module 1: Knowledge Map */}
          <NavLink
            to="/map"
            className="group relative p-5 rounded-3xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-lg cursor-pointer text-left space-y-4"
            style={{
              backgroundColor: 'var(--theme-surface)',
              border: '1px solid var(--theme-border)',
              color: 'var(--theme-text)',
            }}
          >
            {/* Visual Mini Neural Stage */}
            <div
              className="h-28 rounded-2xl overflow-hidden relative border p-2 flex items-center justify-center transition-colors"
              style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
            >
              <svg className="w-full h-full" viewBox="0 0 200 80">
                <line x1="40" y1="40" x2="100" y2="25" stroke="var(--theme-border)" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="100" y1="25" x2="160" y2="40" stroke="var(--theme-border)" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="100" y1="25" x2="100" y2="62" stroke="var(--theme-accent)" strokeWidth="1.5" />
                <line x1="40" y1="40" x2="100" y2="62" stroke="var(--theme-border)" strokeWidth="1.5" />
                <line x1="160" y1="40" x2="100" y2="62" stroke="var(--theme-border)" strokeWidth="1.5" />
                
                <circle cx="40" cy="40" r="7" fill="var(--theme-surface-subtle)" stroke="var(--theme-border)" strokeWidth="1.5" />
                <circle cx="160" cy="40" r="7" fill="var(--theme-surface-subtle)" stroke="var(--theme-border)" strokeWidth="1.5" />
                <circle cx="100" cy="62" r="8" fill="var(--theme-surface-subtle)" stroke="var(--theme-accent)" strokeWidth="2" />
                <circle cx="100" cy="25" r="10" fill="var(--theme-accent)" />
                
                <text x="100" y="28" textAnchor="middle" fill="var(--theme-accent-text)" fontSize="7" fontFamily="monospace" fontWeight="bold">Φ</text>
                <text x="40" y="55" textAnchor="middle" fill="var(--theme-text-muted)" fontSize="7" fontFamily="monospace">Socrates</text>
                <text x="160" y="55" textAnchor="middle" fill="var(--theme-text-muted)" fontSize="7" fontFamily="monospace">Aristotle</text>
                <text x="100" y="74" textAnchor="middle" fill="var(--theme-text)" fontSize="7" fontFamily="monospace" fontWeight="bold">Plato</text>
              </svg>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className="px-3 py-1 rounded-md font-mono text-[10.5px] font-bold uppercase tracking-wider shadow-xs"
                  style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-accent-text)' }}
                >
                  Second Brain
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-md font-mono text-[10px] font-medium border"
                  style={{
                    backgroundColor: 'var(--theme-surface-subtle)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-muted)',
                  }}
                >
                  60+ Nodes
                </span>
              </div>
              <h3 className="text-lg font-serif font-bold" style={{ color: 'var(--theme-text)' }}>
                Knowledge Map
              </h3>
              <p className="text-xs leading-relaxed font-light line-clamp-2" style={{ color: 'var(--theme-text-muted)' }}>
                Interactive neural node network where philosophers, axioms, and lineages form an interconnected constellation.
              </p>
            </div>

            <div
              className="pt-3 border-t flex items-center justify-between text-xs font-mono transition-colors"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
            >
              <span>Inspect Web</span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                style={{
                  backgroundColor: 'var(--theme-surface-subtle)',
                  border: '1px solid var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              >
                <ArrowRight className="w-3.5 h-3.5 text-current transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </NavLink>

          {/* Module 2: Chronos Reel */}
          <NavLink
            to="/timeline"
            className="group relative p-5 rounded-3xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-lg cursor-pointer text-left space-y-4"
            style={{
              backgroundColor: 'var(--theme-surface)',
              border: '1px solid var(--theme-border)',
              color: 'var(--theme-text)',
            }}
          >
            {/* Visual Mini Chrono Reel Stage */}
            <div
              className="h-28 rounded-2xl overflow-hidden relative border p-2.5 flex flex-col justify-between"
              style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
            >
              <div className="flex items-center justify-between text-[9px] font-mono" style={{ color: 'var(--theme-text-muted)' }}>
                <span>VERTICAL CHRONO-TAPE</span>
                <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: 'var(--theme-accent)' }} />
              </div>
              <div className="space-y-1 font-mono text-center">
                <div className="text-[9.5px] opacity-40 line-through">427 BC • Birth of Plato</div>
                <div
                  className="text-xs font-bold py-1 px-2 rounded-lg border flex items-center justify-between shadow-xs"
                  style={{
                    backgroundColor: 'var(--theme-surface)',
                    borderColor: 'var(--theme-accent)',
                    color: 'var(--theme-text)',
                  }}
                >
                  <span className="font-mono text-[11px] font-bold" style={{ color: 'var(--theme-accent)' }}>▶ 399 BC</span>
                  <span className="text-[9.5px] font-sans font-medium truncate ml-1">Trial of Socrates</span>
                </div>
                <div className="text-[9.5px] opacity-40">161 AD • Meditations</div>
              </div>
              <div className="text-[9px] font-mono text-right opacity-60">1,000 MILESTONES</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className="px-3 py-1 rounded-md font-mono text-[10.5px] font-bold uppercase tracking-wider shadow-xs"
                  style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-accent-text)' }}
                >
                  Vertical Reel
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-md font-mono text-[10px] font-medium border"
                  style={{
                    backgroundColor: 'var(--theme-surface-subtle)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-muted)',
                  }}
                >
                  2,625 Yrs
                </span>
              </div>
              <h3 className="text-lg font-serif font-bold" style={{ color: 'var(--theme-text)' }}>
                Chronos Timeline
              </h3>
              <p className="text-xs leading-relaxed font-light line-clamp-2" style={{ color: 'var(--theme-text-muted)' }}>
                Infinite vertical chronometer with precision reticle, auto-tour playback, and 1,000 historical milestones.
              </p>
            </div>

            <div
              className="pt-3 border-t flex items-center justify-between text-xs font-mono transition-colors"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
            >
              <span>Scroll Reel</span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                style={{
                  backgroundColor: 'var(--theme-surface-subtle)',
                  border: '1px solid var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              >
                <ArrowRight className="w-3.5 h-3.5 text-current transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </NavLink>

          {/* Module 3: Infinite Gallery (Shadow & Overlay Fixed for White/Black Theme) */}
          <NavLink
            to="/gallery"
            className="group relative p-5 rounded-3xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-lg cursor-pointer text-left space-y-4"
            style={{
              backgroundColor: 'var(--theme-surface)',
              border: '1px solid var(--theme-border)',
              color: 'var(--theme-text)',
            }}
          >
            {/* Visual Mini Gallery Stage with Theme-Adaptive Badge */}
            <div
              className="h-28 rounded-2xl overflow-hidden relative border group-hover:scale-[1.02] transition-transform duration-300"
              style={{ borderColor: 'var(--theme-border)' }}
            >
              <img
                src="/hero/philosopher-laptop.jpg"
                alt="Silicon Contemplation"
                className="w-full h-full object-cover object-top"
              />
              <div
                className="absolute bottom-2 left-2 right-2 px-2.5 py-1.5 rounded-xl border backdrop-blur-md flex items-center justify-between shadow-xs transition-colors"
                style={{
                  backgroundColor: 'var(--theme-surface)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              >
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold" style={{ color: 'var(--theme-accent)' }}>
                  CANVAS DRIFT
                </span>
                <span className="text-[10px] font-serif font-bold" style={{ color: 'var(--theme-text)' }}>
                  40 Masterpieces
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className="px-3 py-1 rounded-md font-mono text-[10.5px] font-bold uppercase tracking-wider shadow-xs"
                  style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-accent-text)' }}
                >
                  Infinite Drift
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-md font-mono text-[10px] font-medium border"
                  style={{
                    backgroundColor: 'var(--theme-surface-subtle)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-muted)',
                  }}
                >
                  2D Physics
                </span>
              </div>
              <h3 className="text-lg font-serif font-bold" style={{ color: 'var(--theme-text)' }}>
                Infinite Gallery
              </h3>
              <p className="text-xs leading-relaxed font-light line-clamp-2" style={{ color: 'var(--theme-text-muted)' }}>
                Infinite 2D canvas of historical philosophical artworks and marble busts drifting dynamically with cursor physics.
              </p>
            </div>

            <div
              className="pt-3 border-t flex items-center justify-between text-xs font-mono transition-colors"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
            >
              <span>Explore Gallery</span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                style={{
                  backgroundColor: 'var(--theme-surface-subtle)',
                  border: '1px solid var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              >
                <ArrowRight className="w-3.5 h-3.5 text-current transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </NavLink>

          {/* Module 4: Treatises (Resources) */}
          <NavLink
            to="/resources"
            className="group relative p-5 rounded-3xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-lg cursor-pointer text-left space-y-4"
            style={{
              backgroundColor: 'var(--theme-surface)',
              border: '1px solid var(--theme-border)',
              color: 'var(--theme-text)',
            }}
          >
            {/* Visual Mini Manuscript Document Stage */}
            <div
              className="h-28 rounded-2xl overflow-hidden relative border p-2.5 flex flex-col justify-between"
              style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-wider font-bold" style={{ color: 'var(--theme-accent)' }}>
                  EPISTEMIC COMPENDIA
                </span>
                <span
                  className="px-2 py-0.5 rounded-md font-mono text-[9px] font-bold uppercase tracking-wider"
                  style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-accent-text)' }}
                >
                  PDF / PPT
                </span>
              </div>
              <div className="border-l-2 pl-2 my-1" style={{ borderColor: 'var(--theme-accent)' }}>
                <div className="text-[10.5px] font-serif font-bold italic truncate" style={{ color: 'var(--theme-text)' }}>
                  ΠΕΡΙ ΦΥΣΕΩΣ (De Rerum Natura)
                </div>
                <div className="text-[9px] font-mono mt-0.5 opacity-70" style={{ color: 'var(--theme-text-muted)' }}>
                  12 Curated Treatises & Slides
                </div>
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono" style={{ color: 'var(--theme-text-muted)' }}>
                <span>READER READY</span>
                <span>ACADEMIC STUDY</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className="px-3 py-1 rounded-md font-mono text-[10.5px] font-bold uppercase tracking-wider shadow-xs"
                  style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-accent-text)' }}
                >
                  Treatises
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-md font-mono text-[10px] font-medium border"
                  style={{
                    backgroundColor: 'var(--theme-surface-subtle)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-muted)',
                  }}
                >
                  Slide Decks
                </span>
              </div>
              <h3 className="text-lg font-serif font-bold" style={{ color: 'var(--theme-text)' }}>
                Dialectical Resources
              </h3>
              <p className="text-xs leading-relaxed font-light line-clamp-2" style={{ color: 'var(--theme-text-muted)' }}>
                Comprehensive study materials formatted in structured PDF treatises and presentation PPT slides for contemplation.
              </p>
            </div>

            <div
              className="pt-3 border-t flex items-center justify-between text-xs font-mono transition-colors"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
            >
              <span>Browse Compendia</span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                style={{
                  backgroundColor: 'var(--theme-surface-subtle)',
                  border: '1px solid var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              >
                <ArrowRight className="w-3.5 h-3.5 text-current transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </NavLink>
        </div>
      </section>

      {/* ====================================================================
          CENTRAL MAXIM BANNER
          ==================================================================== */}
      <section
        ref={maximRef}
        className="py-16 px-4 sm:px-6 lg:px-8 border-y"
        style={{
          backgroundColor: 'var(--theme-surface)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span
            className="text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-1.5"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            <Flame className="w-3.5 h-3.5 text-current" />
            <span>Axiom of the Day</span>
          </span>
          <blockquote
            className="text-xl sm:text-3xl font-serif italic leading-relaxed"
            style={{ color: 'var(--theme-text)' }}
          >
            “He who has a why to live can bear almost any how.”
          </blockquote>
          <div
            className="text-xs font-mono"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            — Friedrich Nietzsche • <span className="opacity-75">Twilight of the Idols (1889)</span>
          </div>
        </div>
      </section>
    </div>
  );
}
