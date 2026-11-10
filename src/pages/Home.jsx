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

  return (
    <div
      className="min-h-screen font-serif transition-colors duration-200"
      style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}
    >
      {/* ====================================================================
          HERMES-STYLE ARCHITECTURAL HERO SECTION
          ==================================================================== */}
      <section
        className="relative pt-16 pb-24 px-4 sm:px-6 lg:px-8 border-b overflow-hidden"
        style={{ borderColor: 'var(--theme-border)' }}
      >
        {/* Subtle Ambient Radial Light (Hermes Focal Glow) */}
        <div
          aria-hidden="true"
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] pointer-events-none opacity-10 blur-3xl"
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

        {/* Outer Frame with Geometric Corner Marks (Hermes Technical Styling) */}
        <div className="max-w-6xl mx-auto relative z-10 space-y-10">
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

          {/* Core Headline & Philosophical Thesis */}
          <div className="text-center space-y-6 max-w-4xl mx-auto">
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
              className="text-4xl sm:text-6xl lg:text-7xl font-serif font-black tracking-tight leading-[1.08] text-balance"
              style={{ color: 'var(--theme-text)' }}
            >
              THE ARCHITECTURE OF CONTEMPLATION
            </h1>

            <p
              className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-light"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              Synthesizing 2,500 years of human dialectic into an active, navigable cognitive graph. Interrogate perennial paradigms across 1,000 historical milestones, trace neural lineages, or wander through an infinite universe of classical art.
            </p>

            {/* UNIFIED ACTION BUTTONS WITH FLAWLESS HOVER CONTRAST */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
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
          </div>

          {/* ================================================================
              HERMES-INSPIRED DIALECTIC THOUGHT CONSOLE (INTERACTIVE INQUIRY)
              ================================================================ */}
          <div
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
              className="p-5 sm:p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-inner transition-all duration-200"
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
                  className="group px-4 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all duration-200 shadow-md cursor-pointer"
                  style={{
                    backgroundColor: 'var(--theme-accent)',
                    color: 'var(--theme-accent-text)',
                    border: '1px solid var(--theme-accent)',
                  }}
                >
                  <span>{activeInquiry.linkLabel}</span>
                  <ChevronRight className="w-4 h-4 text-current transition-transform duration-200 group-hover:translate-x-1" />
                </NavLink>
              </div>
            </div>

            {/* Micro-Telemetry Footer Strip */}
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center text-xs font-mono border-t"
              style={{ borderColor: 'var(--theme-border)' }}
            >
              {[
                { value: '1,000', label: 'Milestones' },
                { value: '60+', label: 'Thinkers' },
                { value: '40', label: 'Artworks' },
                { value: '2,625', label: 'Years of Lore' },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="p-2.5 rounded-xl"
                  style={{
                    backgroundColor: 'var(--theme-bg)',
                    border: '1px solid var(--theme-border)',
                  }}
                >
                  <div
                    className="text-lg font-bold font-mono"
                    style={{ color: 'var(--theme-text)' }}
                  >
                    {metric.value}
                  </div>
                  <div
                    className="text-[10px] uppercase font-mono"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          CORE INSTRUMENTS GRID
          ==================================================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ANALYTICAL_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <NavLink
                to={mod.to}
                key={mod.title}
                className="group relative p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-lg cursor-pointer"
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
