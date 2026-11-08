import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Network,
  Clock,
  BookOpen,
  ArrowRight,
  Compass
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white font-serif selection:bg-white selection:text-black">
      {/* HERO SECTION */}
      <section className="relative pt-20 pb-20 px-4 sm:px-6 lg:px-8 border-b border-white/10 overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10 animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/5 text-[11px] font-mono tracking-widest uppercase text-white/70">
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            <span>Epistemic Exploration Apparatus</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-black tracking-tight leading-[1.08] text-balance">
            THE ARCHITECTURE OF CONTEMPLATION
          </h1>

          <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed font-light">
            An interconnected system exploring 2,500 years of philosophy across 1,000 historical facts. Navigate thinkers through the interactive "Second Brain" graph, scrub through historical epochs on the timeline, or study comprehensive PDF & PPT compendia.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <NavLink
              to="/map"
              className="btn btn-md bg-white text-black hover:bg-white/90 font-bold rounded-xl gap-2 border-none shadow-lg shadow-white/10"
            >
              <Network className="w-4 h-4" />
              <span>Explore Second Brain</span>
              <ArrowRight className="w-4 h-4" />
            </NavLink>

            <NavLink
              to="/timeline"
              className="btn btn-md btn-outline text-white border-white/30 hover:bg-white hover:text-black rounded-xl gap-2"
            >
              <Clock className="w-4 h-4" />
              <span>Open Chronos Timeline</span>
            </NavLink>

            <NavLink
              to="/resources"
              className="btn btn-md btn-ghost text-white/70 hover:text-white rounded-xl gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Study Resources</span>
            </NavLink>

            <NavLink
              to="/gallery"
              className="btn btn-md btn-ghost text-white/70 hover:text-white rounded-xl gap-2 border border-white/10"
            >
              <Compass className="w-4 h-4" />
              <span>Infinite Gallery</span>
            </NavLink>
          </div>
        </div>
      </section>

      {/* CORE INSTRUMENTS GRID */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-white/50 block mb-1">
              Primary Instruments
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              Analytical Modules
            </h2>
          </div>
          <span className="text-xs font-mono text-white/40">
            Four distinct perspectives on the same perennial questions.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Module 1: Knowledge Map */}
          <NavLink
            to="/map"
            className="group relative p-8 rounded-3xl bg-zinc-950 border border-white/15 hover:border-white/50 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-colors">
                  <Network className="w-6 h-6" />
                </div>
                <span className="badge badge-sm font-mono bg-white/10 text-white/80 border-none">
                  Neuron Graph
                </span>
              </div>

              <h3 className="text-xl font-serif font-bold mb-2 text-white">
                Knowledge Map ("Second Brain")
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Interactive node network where every thinker, maxim, and paradigm is interconnected. The more connections a concept possesses, the larger its mass in the network.
              </p>
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/50 group-hover:text-white">
              <span>Inspect Web</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </NavLink>

          {/* Module 2: Chronos Timeline */}
          <NavLink
            to="/timeline"
            className="group relative p-8 rounded-3xl bg-zinc-950 border border-white/15 hover:border-white/50 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-colors">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="badge badge-sm font-mono bg-white/10 text-white/80 border-none">
                  Chronos Rail
                </span>
              </div>

              <h3 className="text-xl font-serif font-bold mb-2 text-white">
                Chronos Timeline
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Horizontal timeline spanning from 600 BC to 2026 AD. Horizontal scrubber keeping content securely below the rail, with quick epoch jumps and 1,000 facts.
              </p>
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/50 group-hover:text-white">
              <span>Scroll Timeline</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </NavLink>

          {/* Module 3: Philosophical Resources */}
          <NavLink
            to="/resources"
            className="group relative p-8 rounded-3xl bg-zinc-950 border border-white/15 hover:border-white/50 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-colors">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="badge badge-sm font-mono bg-white/10 text-white/80 border-none">
                  Treatises
                </span>
              </div>

              <h3 className="text-xl font-serif font-bold mb-2 text-white">
                Dialectical Resources
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Comprehensive study materials, formatted in structured PDF and presentation PPT files for academic exploration, downloadable or viewable in an epistemic reader.
              </p>
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/50 group-hover:text-white">
              <span>Browse Compendia</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </NavLink>

          {/* Module 4: Infinite Art Gallery */}
          <NavLink
            to="/gallery"
            className="group relative p-8 rounded-3xl bg-zinc-950 border border-white/15 hover:border-white/50 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-colors">
                  <Compass className="w-6 h-6" />
                </div>
                <span className="badge badge-sm font-mono bg-white/10 text-white/80 border-none">
                  Infinite Drift
                </span>
              </div>

              <h3 className="text-xl font-serif font-bold mb-2 text-white">
                Infinite Gallery
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                An infinite 2D canvas of historical philosophical artworks, frescoes, and marble busts that drifts dynamically towards your cursor relative to the screen center.
              </p>
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/50 group-hover:text-white">
              <span>Explore Gallery</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </NavLink>
        </div>
      </section>

      {/* CENTRAL MAXIM BANNER */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-white/10 bg-zinc-950">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-xs font-mono uppercase tracking-widest text-white/50">
            Axiom of the Day
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
