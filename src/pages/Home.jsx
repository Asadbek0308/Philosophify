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

const HERO_ARTWORKS = {
  socrates: {
    id: 'socrates',
    src: '/hero/cyber-philosopher.jpg',
    title: 'The Augmented Dialectic',
    subject: 'Socrates of Athens // Neural Visor v2.4',
    epoch: '399 BC // 2026 AD',
    description:
      'Ancient Socratic interrogation synthesized with modern artificial neural networks. The unexamined life meets computational clarity.',
    badge: 'Neural Sage',
    coords: '37.9838° N, 23.7275° E',
    metric: '142.8 MHz Dialectic Core',
  },
  laptop: {
    id: 'laptop',
    src: '/hero/philosopher-laptop.jpg',
    title: 'Silicon Contemplation',
    subject: 'Classical Thinker // Second Brain Node',
    epoch: 'Circa 160 AD // Silicon Age',
    description:
      'The marble philosopher interrogates his digital apparatus. Over two millennia of ethical treatises rendered into an instantaneous knowledge graph.',
    badge: 'Second Brain',
    coords: '41.9028° N, 12.4964° E',
    metric: '0.04ms Epistemic Latency',
  },
  athens: {
    id: 'athens',
    src: '/hero/school-of-athens.jpg',
    title: 'The Academy of Athens',
    subject: 'Raphael Sanzio // The Synthesis of Thought',
    epoch: '1509–1511 AD',
    description:
      'Plato gestures toward eternal forms; Aristotle gestures toward empirical nature. The complete dialectic of civilization united under one vault.',
    badge: 'Athens Fresco',
    coords: '41.9038° N, 12.4547° E',
    metric: '60+ Master Thinkers',
  },
};

const ATHENS_FOCAL_NODES = [
  {
    name: 'Plato of Athens',
    thesis: 'Theory of Ideal Forms',
    pos: 'left-[46%] top-[38%]',
    desc: 'Gesturing upwards toward the transcendent realm of timeless, immutable truth.',
  },
  {
    name: 'Aristotle of Stagira',
    thesis: 'Empirical Naturalism',
    pos: 'left-[51%] top-[39%]',
    desc: 'Palm horizontal toward the earth, grounding metaphysics in observed physical reality.',
  },
  {
    name: 'Diogenes the Cynic',
    thesis: 'Cynic Asceticism & Freedom',
    pos: 'left-[53%] top-[62%]',
    desc: 'Sprawled indifferent on the marble steps, demonstrating virtue through utter detachment.',
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

const ANALYTICAL_MODULES = [
  {
    to: '/map',
    badge: 'Neuron Graph',
    title: 'Knowledge Map ("Second Brain")',
    description:
      'Interactive node network where every thinker, maxim, and paradigm is interconnected. The more connections a concept possesses, the larger its mass in the network.',
    actionText: 'Inspect Web',
    icon: Network,
  },
  {
    to: '/timeline',
    badge: 'Chronos Reel',
    title: 'Chronos Timeline',
    description:
      'Vertical infinite chronometer with real-time velocity controls (Fast, Super, Auto-Tour), precision reticle, and 1,000 chronological milestones from 600 BC to 2026 AD.',
    actionText: 'Scroll Reel',
    icon: Clock,
  },
  {
    to: '/resources',
    badge: 'Treatises',
    title: 'Dialectical Resources',
    description:
      'Comprehensive study materials, formatted in structured PDF and presentation PPT files for academic exploration, downloadable or viewable in an epistemic reader.',
    actionText: 'Browse Compendia',
    icon: BookOpen,
  },
  {
    to: '/gallery',
    badge: 'Infinite Drift',
    title: 'Infinite Gallery',
    description:
      'An infinite 2D canvas of historical philosophical artworks, frescoes, and marble busts that drifts dynamically away from your cursor with distance-scaled physics.',
    actionText: 'Explore Gallery',
    icon: Compass,
  },
];

export default function Home() {
  const [activeInquiry, setActiveInquiry] = useState(PERENNIAL_INQUIRIES[0]);
  const [activeArtKey, setActiveArtKey] = useState('socrates');
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const heroLeftRef = useRef(null);
  const heroRightRef = useRef(null);
  const floatingCardRef = useRef(null);
  const panoramaRef = useRef(null);
  const panoramaImgRef = useRef(null);
  const dialecticRef = useRef(null);
  const modulesRef = useRef(null);
  const maximRef = useRef(null);
  const scrollPromptRef = useRef(null);

  const currentArt = HERO_ARTWORKS[activeArtKey];

  // Mouse tilt effect over hero image card
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseTilt({ x: x * 10, y: -y * 10 });
  };

  const handleMouseLeave = () => {
    setMouseTilt({ x: 0, y: 0 });
  };

  // GSAP ScrollTrigger Setup
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Hero Left/Right Parallax
      if (heroRightRef.current && heroLeftRef.current) {
        gsap.to(heroRightRef.current, {
          yPercent: -15,
          ease: 'none',
          scrollTrigger: {
            trigger: heroLeftRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.2,
          },
        });
      }

      if (floatingCardRef.current && heroLeftRef.current) {
        gsap.to(floatingCardRef.current, {
          yPercent: -40,
          rotate: 3,
          ease: 'none',
          scrollTrigger: {
            trigger: heroLeftRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.9,
          },
        });
      }

      // 2. Hide scroll prompt on initial scroll
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
          { scale: 1.15, yPercent: -8 },
          {
            scale: 1.0,
            yPercent: 8,
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
          y: 50,
          opacity: 0,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: dialecticRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        });
      }

      // 5. Analytical Modules Stagger Reveal
      if (modulesRef.current) {
        const cards = modulesRef.current.querySelectorAll('.module-card');
        gsap.from(cards, {
          y: 45,
          opacity: 0,
          duration: 0.75,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: modulesRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        });
      }

      // 6. Maxim Banner Reveal
      if (maximRef.current) {
        gsap.from(maximRef.current, {
          scale: 0.97,
          opacity: 0,
          duration: 0.8,
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
          HERO SECTION: DUAL-PILLAR CYBER-CLASSICAL STAGE
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
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: 'var(--theme-accent)' }}
              />
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

          {/* DUAL-PILLAR HERO CONTENT & INTERACTIVE ARTWORK STAGE */}
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

            {/* Right Visual Column: Interactive Cyber-Classical Stage (5 cols on lg) */}
            <div ref={heroRightRef} className="lg:col-span-5 relative w-full max-w-md mx-auto lg:max-w-none">
              {/* 3D Tilting Card Container */}
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
                {/* HUD Header Bar */}
                <div
                  className="flex items-center justify-between px-4 py-3 border-b text-[11px] font-mono"
                  style={{
                    borderColor: 'var(--theme-border)',
                    backgroundColor: 'var(--theme-surface-subtle)',
                    color: 'var(--theme-text-muted)',
                  }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2 h-2 rounded-full animate-ping shrink-0"
                      style={{ backgroundColor: 'var(--theme-accent)' }}
                    />
                    <span className="font-bold tracking-wider truncate" style={{ color: 'var(--theme-text)' }}>
                      {currentArt.subject}
                    </span>
                  </div>
                  <span
                    className="badge badge-xs font-mono font-bold shrink-0 ml-2"
                    style={{
                      backgroundColor: 'var(--theme-accent)',
                      color: 'var(--theme-accent-text)',
                    }}
                  >
                    {currentArt.badge}
                  </span>
                </div>

                {/* Artwork Viewport */}
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
                    src={currentArt.src}
                    alt={currentArt.title}
                    className="w-full h-full object-cover object-center transition-all duration-500 hover:scale-105"
                    loading="eager"
                  />

                  {/* Bottom Translucent Caption */}
                  <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/85 via-black/45 to-transparent backdrop-blur-[2px] text-white space-y-1 text-left">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-sm font-serif">{currentArt.title}</span>
                      <span className="opacity-75 text-[10.5px]">{currentArt.epoch}</span>
                    </div>
                    <p className="text-[11px] opacity-90 line-clamp-2 font-light leading-relaxed">
                      {currentArt.description}
                    </p>
                  </div>
                </div>

                {/* Tab Switcher at Bottom of Card */}
                <div
                  className="p-2 border-t grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono"
                  style={{
                    borderColor: 'var(--theme-border)',
                    backgroundColor: 'var(--theme-surface-subtle)',
                  }}
                >
                  {Object.values(HERO_ARTWORKS).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveArtKey(item.id)}
                      className="py-1.5 px-2 rounded-xl transition-all cursor-pointer font-bold truncate flex items-center justify-center gap-1"
                      style={{
                        backgroundColor: activeArtKey === item.id ? 'var(--theme-accent)' : 'transparent',
                        color: activeArtKey === item.id ? 'var(--theme-accent-text)' : 'var(--theme-text-muted)',
                        border: activeArtKey === item.id ? '1px solid var(--theme-accent)' : '1px solid transparent',
                      }}
                    >
                      <span>{item.badge}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Offset Floating Parallax Badge (Silicon Thinker) */}
              <div
                ref={floatingCardRef}
                onClick={() => setActiveArtKey(activeArtKey === 'laptop' ? 'socrates' : 'laptop')}
                className="hidden sm:flex absolute -bottom-6 -left-6 p-2 rounded-2xl shadow-2xl items-center gap-3 backdrop-blur-md cursor-pointer transition-transform hover:scale-105 z-20"
                style={{
                  backgroundColor: 'var(--theme-surface)',
                  border: '1px solid var(--theme-border)',
                  maxWidth: '230px',
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border"
                  style={{ borderColor: 'var(--theme-border)' }}
                >
                  <img
                    src="/hero/philosopher-laptop.jpg"
                    alt="Silicon Contemplation"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-0.5 text-left truncate">
                  <div
                    className="text-[9.5px] font-mono uppercase tracking-wider font-bold truncate"
                    style={{ color: 'var(--theme-accent)' }}
                  >
                    Second Brain Node
                  </div>
                  <div
                    className="text-xs font-serif font-bold leading-tight truncate"
                    style={{ color: 'var(--theme-text)' }}
                  >
                    Silicon Thinker
                  </div>
                  <div
                    className="text-[9px] font-mono opacity-60"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    0.04ms Latency
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
          SCROLL-BASED ARCHITECTURAL PANORAMA: THE ATHENS ACADEMY
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
                Fresco of Convergence // 1509 AD
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
              Raphael's masterpiece captures the eternal tension between Plato's idealism and Aristotle's empiricism under one grand vault.
            </p>
          </div>

          {/* Panoramic Stage with Scroll Parallax */}
          <div
            className="relative h-[340px] sm:h-[440px] rounded-3xl overflow-hidden shadow-2xl border group"
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

            {/* Ambient Vignette & Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/35 pointer-events-none" />

            {/* Interactive Thinker Hotspots */}
            <div className="absolute inset-0 pointer-events-auto">
              {ATHENS_FOCAL_NODES.map((node) => (
                <div
                  key={node.name}
                  className={`absolute ${node.pos} -translate-x-1/2 -translate-y-1/2 group/pin`}
                >
                  <button
                    type="button"
                    className="relative flex items-center justify-center cursor-pointer focus:outline-none"
                    aria-label={`Inspect ${node.name}`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-white animate-ping opacity-75 absolute" />
                    <span className="w-3 h-3 rounded-full bg-white text-black font-bold flex items-center justify-center text-[8px] shadow-lg border border-black/40">
                      •
                    </span>
                  </button>

                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 rounded-xl bg-black/90 text-white border border-white/20 shadow-2xl text-left opacity-0 group-hover/pin:opacity-100 transition-all duration-200 pointer-events-none z-30">
                    <div className="text-[11px] font-bold font-serif">{node.name}</div>
                    <div className="text-[9.5px] font-mono text-white/60 mb-1">{node.thesis}</div>
                    <p className="text-[10px] leading-tight text-white/80">{node.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Inscription & Direct Route Jump */}
            <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
              <div className="max-w-xl space-y-1.5 text-left">
                <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white/70">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>Dialectic Continuum // 60+ Master Minds</span>
                </div>
                <blockquote className="text-base sm:text-lg font-serif italic text-white/95 leading-snug">
                  “We do not think in isolation. Every thought is a continuation of a dialogue begun thousands of years ago.”
                </blockquote>
              </div>

              <NavLink
                to="/gallery"
                className="hero-btn-primary shrink-0 px-4 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 shadow-xl hover:scale-105 transition-transform cursor-pointer"
              >
                <span>Inspect in Gallery</span>
                <ArrowRight className="w-4 h-4 text-current" />
              </NavLink>
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
                  className="badge badge-sm font-mono font-bold border-none"
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
                className="p-3 rounded-xl relative"
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
          CORE INSTRUMENTS GRID (ANALYTICAL MODULES)
          ==================================================================== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 border-b pb-6"
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
              Analytical Modules
            </h2>
          </div>
          <span
            className="text-xs font-mono"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            Four interconnected lenses examining the perennial questions of existence.
          </span>
        </div>

        <div ref={modulesRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ANALYTICAL_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <NavLink
                to={mod.to}
                key={mod.title}
                className="module-card group relative p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-lg cursor-pointer text-left"
                style={{
                  backgroundColor: 'var(--theme-surface)',
                  border: '1px solid var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm"
                      style={{
                        backgroundColor: 'var(--theme-surface-subtle)',
                        border: '1px solid var(--theme-border)',
                        color: 'var(--theme-text)',
                      }}
                    >
                      <Icon className="w-6 h-6 text-current" />
                    </div>
                    <span
                      className="badge badge-sm font-mono border-none"
                      style={{
                        backgroundColor: 'var(--theme-surface-subtle)',
                        color: 'var(--theme-text-muted)',
                      }}
                    >
                      {mod.badge}
                    </span>
                  </div>

                  <h3
                    className="text-xl font-serif font-bold mb-2"
                    style={{ color: 'var(--theme-text)' }}
                  >
                    {mod.title}
                  </h3>
                  <p
                    className="text-xs leading-relaxed font-light"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    {mod.description}
                  </p>
                </div>

                <div
                  className="pt-6 border-t flex items-center justify-between text-xs font-mono transition-colors"
                  style={{
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-muted)',
                  }}
                >
                  <span>{mod.actionText}</span>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
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
            );
          })}
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
