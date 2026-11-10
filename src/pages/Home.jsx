import React, { useState } from 'react';
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
} from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-black text-white font-serif selection:bg-white selection:text-black">
      {/* ====================================================================
          HERMES-STYLE ARCHITECTURAL HERO SECTION
          ==================================================================== */}
      <section className="relative pt-16 pb-24 px-4 sm:px-6 lg:px-8 border-b border-white/10 overflow-hidden">
        {/* Subtle Ambient Radial Light (Hermes Focal Glow) */}
        <div
          aria-hidden="true"
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] pointer-events-none opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.02) 60%, transparent 80%)',
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

        {/* Outer Frame with Geometric Corner Marks (Hermes Technical Styling) */}
        <div className="max-w-6xl mx-auto relative z-10 space-y-10">
          {/* Top Telemetry Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono border-b border-white/10 pb-4 text-white/50">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-white font-bold tracking-widest uppercase">
                PHILOSOPHIA PRIMA // APPARATUS v2.4
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-white/40">
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

          {/* Core Headline & Philosophical Thesis */}
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/5 text-[11px] font-mono tracking-widest uppercase text-white/80 backdrop-blur-sm shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-current" />
              <span>Interconnected Epistemic Intelligence Engine</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-black tracking-tight leading-[1.08] text-balance text-white">
              THE ARCHITECTURE OF CONTEMPLATION
            </h1>

            <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed font-light">
              Synthesizing 2,500 years of human dialectic into an active, navigable cognitive graph. Interrogate perennial paradigms across 1,000 historical milestones, trace neural lineages, or wander through an infinite universe of classical art.
            </p>

            {/* UNIFIED ACTION BUTTONS WITH FLAWLESS HOVER CONTRAST */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <NavLink
                to="/map"
                className="group h-11 px-5 rounded-xl bg-white text-black hover:bg-zinc-200 border border-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all duration-200 shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Network className="w-4 h-4 text-current transition-transform duration-200 group-hover:rotate-12" />
                <span>Explore Second Brain</span>
                <ArrowRight className="w-4 h-4 text-current transition-transform duration-200 group-hover:translate-x-1" />
              </NavLink>

              <NavLink
                to="/timeline"
                className="group h-11 px-5 rounded-xl border border-white/25 bg-white/5 text-white hover:bg-white hover:text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Clock className="w-4 h-4 text-current transition-transform duration-200 group-hover:rotate-45" />
                <span>Chronos Reel</span>
              </NavLink>

              <NavLink
                to="/gallery"
                className="group h-11 px-5 rounded-xl border border-white/25 bg-white/5 text-white hover:bg-white hover:text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Compass className="w-4 h-4 text-current transition-transform duration-200 group-hover:rotate-90" />
                <span>Infinite Gallery</span>
              </NavLink>

              <NavLink
                to="/resources"
                className="group h-11 px-5 rounded-xl border border-white/20 bg-white/5 text-white/80 hover:bg-white hover:text-black font-mono text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-current" />
                <span>Compendia</span>
              </NavLink>
            </div>
          </div>

          {/* ================================================================
              HERMES-INSPIRED DIALECTIC THOUGHT CONSOLE (INTERACTIVE INQUIRY)
              ================================================================ */}
          <div className="rounded-3xl border border-white/15 bg-zinc-950/90 p-5 sm:p-7 shadow-2xl backdrop-blur-md relative overflow-hidden space-y-5">
            {/* Console Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-xs font-mono text-white/70">
                <Terminal className="w-4 h-4 text-current" />
                <span className="uppercase font-bold tracking-wider text-white">
                  Perennial Inquiries // Dialectic Stream
                </span>
              </div>
              <span className="text-[11px] font-mono text-white/40">
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
                    className={`px-3.5 py-1.5 rounded-xl font-mono text-xs whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-white text-black font-bold shadow-md scale-[1.02]'
                        : 'border border-white/15 bg-white/5 text-white/70 hover:border-white/40 hover:text-white'
                    }`}
                  >
                    <span>{inq.tag}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Dialectic Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-black border border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-inner transition-all duration-200">
              <div className="space-y-2.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="badge badge-sm font-mono bg-white text-black font-bold border-none">
                    {activeInquiry.epoch}
                  </span>
                  <span className="text-xs font-mono text-white/50 uppercase tracking-wider">
                    {activeInquiry.school}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-white leading-tight">
                  "{activeInquiry.query}"
                </h3>
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 relative">
                  <Quote className="w-4 h-4 text-white/20 absolute top-2 right-2 pointer-events-none" />
                  <p className="text-xs sm:text-sm font-serif italic text-white/80 leading-relaxed pr-6">
                    {activeInquiry.axiom}
                  </p>
                  <div className="text-[10.5px] font-mono text-white/50 mt-1">
                    — Formulated by <span className="font-semibold text-white/90">{activeInquiry.thinker}</span>
                  </div>
                </div>
              </div>

              {/* Portal Jump Action */}
              <div className="shrink-0">
                <NavLink
                  to={activeInquiry.targetLink}
                  className="group px-4 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 font-mono text-xs font-bold flex items-center gap-2 transition-all duration-200 shadow-md cursor-pointer"
                >
                  <span>{activeInquiry.linkLabel}</span>
                  <ChevronRight className="w-4 h-4 text-current transition-transform duration-200 group-hover:translate-x-1" />
                </NavLink>
              </div>
            </div>

            {/* Micro-Telemetry Footer Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center text-xs font-mono border-t border-white/10">
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="text-lg font-bold font-mono text-white">1,000</div>
                <div className="text-[10px] text-white/40 uppercase">Milestones</div>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="text-lg font-bold font-mono text-white">60+</div>
                <div className="text-[10px] text-white/40 uppercase">Thinkers</div>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="text-lg font-bold font-mono text-white">40</div>
                <div className="text-[10px] text-white/40 uppercase">Artworks</div>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="text-lg font-bold font-mono text-white">2,625</div>
                <div className="text-[10px] text-white/40 uppercase">Years of Lore</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          CORE INSTRUMENTS GRID
          ==================================================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 border-b border-white/10 pb-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-white/50 block mb-1">
              Primary Instruments
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              Analytical Modules
            </h2>
          </div>
          <span className="text-xs font-mono text-white/40">
            Four interconnected lenses examining the perennial questions of existence.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Module 1: Knowledge Map */}
          <NavLink
            to="/map"
            className="group relative p-8 rounded-3xl bg-zinc-950 border border-white/15 hover:border-white/50 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-lg cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-all duration-300 shadow-sm">
                  <Network className="w-6 h-6 text-current" />
                </div>
                <span className="badge badge-sm font-mono bg-white/10 text-white/80 border-none">
                  Neuron Graph
                </span>
              </div>

              <h3 className="text-xl font-serif font-bold mb-2 text-white">
                Knowledge Map ("Second Brain")
              </h3>
              <p className="text-xs text-white/60 leading-relaxed font-light">
                Interactive node network where every thinker, maxim, and paradigm is interconnected. The more connections a concept possesses, the larger its mass in the network.
              </p>
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/50 group-hover:text-white transition-colors">
              <span>Inspect Web</span>
              <div className="w-7 h-7 rounded-lg border border-white/15 group-hover:border-white/40 group-hover:bg-white group-hover:text-black flex items-center justify-center transition-all duration-200">
                <ArrowRight className="w-3.5 h-3.5 text-current transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </NavLink>

          {/* Module 2: Chronos Reel */}
          <NavLink
            to="/timeline"
            className="group relative p-8 rounded-3xl bg-zinc-950 border border-white/15 hover:border-white/50 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-lg cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-all duration-300 shadow-sm">
                  <Clock className="w-6 h-6 text-current" />
                </div>
                <span className="badge badge-sm font-mono bg-white/10 text-white/80 border-none">
                  Chronos Reel
                </span>
              </div>

              <h3 className="text-xl font-serif font-bold mb-2 text-white">
                Chronos Timeline
              </h3>
              <p className="text-xs text-white/60 leading-relaxed font-light">
                Vertical infinite chronometer with real-time velocity controls (Fast, Super, Auto-Tour), precision reticle, and 1,000 chronological milestones from 600 BC to 2026 AD.
              </p>
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/50 group-hover:text-white transition-colors">
              <span>Scroll Reel</span>
              <div className="w-7 h-7 rounded-lg border border-white/15 group-hover:border-white/40 group-hover:bg-white group-hover:text-black flex items-center justify-center transition-all duration-200">
                <ArrowRight className="w-3.5 h-3.5 text-current transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </NavLink>

          {/* Module 3: Philosophical Resources */}
          <NavLink
            to="/resources"
            className="group relative p-8 rounded-3xl bg-zinc-950 border border-white/15 hover:border-white/50 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-lg cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-all duration-300 shadow-sm">
                  <BookOpen className="w-6 h-6 text-current" />
                </div>
                <span className="badge badge-sm font-mono bg-white/10 text-white/80 border-none">
                  Treatises
                </span>
              </div>

              <h3 className="text-xl font-serif font-bold mb-2 text-white">
                Dialectical Resources
              </h3>
              <p className="text-xs text-white/60 leading-relaxed font-light">
                Comprehensive study materials, formatted in structured PDF and presentation PPT files for academic exploration, downloadable or viewable in an epistemic reader.
              </p>
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/50 group-hover:text-white transition-colors">
              <span>Browse Compendia</span>
              <div className="w-7 h-7 rounded-lg border border-white/15 group-hover:border-white/40 group-hover:bg-white group-hover:text-black flex items-center justify-center transition-all duration-200">
                <ArrowRight className="w-3.5 h-3.5 text-current transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </NavLink>

          {/* Module 4: Infinite Art Gallery */}
          <NavLink
            to="/gallery"
            className="group relative p-8 rounded-3xl bg-zinc-950 border border-white/15 hover:border-white/50 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-lg cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-all duration-300 shadow-sm">
                  <Compass className="w-6 h-6 text-current" />
                </div>
                <span className="badge badge-sm font-mono bg-white/10 text-white/80 border-none">
                  Infinite Drift
                </span>
              </div>

              <h3 className="text-xl font-serif font-bold mb-2 text-white">
                Infinite Gallery
              </h3>
              <p className="text-xs text-white/60 leading-relaxed font-light">
                An infinite 2D canvas of historical philosophical artworks, frescoes, and marble busts that drifts dynamically away from your cursor with distance-scaled physics.
              </p>
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/50 group-hover:text-white transition-colors">
              <span>Explore Gallery</span>
              <div className="w-7 h-7 rounded-lg border border-white/15 group-hover:border-white/40 group-hover:bg-white group-hover:text-black flex items-center justify-center transition-all duration-200">
                <ArrowRight className="w-3.5 h-3.5 text-current transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </NavLink>
        </div>
      </section>

      {/* ====================================================================
          CENTRAL MAXIM BANNER
          ==================================================================== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-white/10 bg-zinc-950">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-xs font-mono uppercase tracking-widest text-white/50 flex items-center justify-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-current" />
            <span>Axiom of the Day</span>
          </span>
          <blockquote className="text-xl sm:text-3xl font-serif italic text-white leading-relaxed">
            “He who has a why to live can bear almost any how.”
          </blockquote>
          <div className="text-xs font-mono text-white/50">
            — Friedrich Nietzsche • <span className="opacity-60">Twilight of the Idols (1889)</span>
          </div>
        </div>
      </section>
    </div>
  );
}
