import React from 'react';
import { NavLink } from 'react-router-dom';
import { Network, Clock, BookOpen, ArrowUp, Compass } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      className="border-t py-16 font-serif transition-colors duration-200"
      style={{
        backgroundColor: 'var(--theme-surface)',
        color: 'var(--theme-text)',
        borderColor: 'var(--theme-border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl font-black flex items-center justify-center text-lg"
                style={{
                  backgroundColor: 'var(--theme-accent)',
                  color: 'var(--theme-accent-text)',
                }}
              >
                Φ
              </div>
              <span
                className="font-extrabold tracking-widest text-lg font-serif"
                style={{ color: 'var(--theme-text)' }}
              >
                PHILOSOPHIFY
              </span>
            </div>
            <p
              className="text-xs max-w-sm leading-relaxed"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              A minimalist epistemic apparatus built for scholars, dialecticians, and seekers. Synthesizing 2,500 years of metaphysical, ethical, and epistemological inquiry into interconnected systems.
            </p>
            <div
              className="pt-2 text-xs font-mono"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              “The unexamined life is not worth living.” — Socrates
            </div>
          </div>

          {/* Core Instruments */}
          <div className="space-y-3">
            <h4
              className="text-xs font-mono uppercase tracking-widest font-bold"
              style={{ color: 'var(--theme-text)' }}
            >
              Instruments
            </h4>
            <ul className="space-y-2 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              <li>
                <NavLink
                  to="/map"
                  className="hover:opacity-100 transition-opacity flex items-center gap-2"
                  style={{ color: 'var(--theme-text)' }}
                >
                  <Network className="w-3.5 h-3.5 opacity-60 text-current" />
                  <span>Knowledge Map ("Second Brain")</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/timeline"
                  className="hover:opacity-100 transition-opacity flex items-center gap-2"
                  style={{ color: 'var(--theme-text)' }}
                >
                  <Clock className="w-3.5 h-3.5 opacity-60 text-current" />
                  <span>Chronos Timeline (600 BC – Present)</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/resources"
                  className="hover:opacity-100 transition-opacity flex items-center gap-2"
                  style={{ color: 'var(--theme-text)' }}
                >
                  <BookOpen className="w-3.5 h-3.5 opacity-60 text-current" />
                  <span>Treatises & Slides (PDF / PPT)</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/gallery"
                  className="hover:opacity-100 transition-opacity flex items-center gap-2"
                  style={{ color: 'var(--theme-text)' }}
                >
                  <Compass className="w-3.5 h-3.5 opacity-60 text-current" />
                  <span>Infinite Gallery (Masterpiece Drift)</span>
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Epistemic Axioms */}
          <div className="space-y-3">
            <h4
              className="text-xs font-mono uppercase tracking-widest font-bold"
              style={{ color: 'var(--theme-text)' }}
            >
              Traditions
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Stoicism',
                'Existentialism',
                'Taoism',
                'Rationalism',
                'Empiricism',
                'Virtue Ethics',
                'Absurdism',
                'Phenomenology',
              ].map((tradition) => (
                <span
                  key={tradition}
                  className="px-2 py-1 rounded-md text-[10px] transition-colors"
                  style={{
                    backgroundColor: 'var(--theme-surface-subtle)',
                    border: '1px solid var(--theme-border)',
                    color: 'var(--theme-text-muted)',
                  }}
                >
                  {tradition}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
          style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
        >
          <div>
            © {CURRENT_YEAR} Philosophify. Structured for autonomous contemplation.
          </div>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 hover:opacity-100 opacity-70 transition-opacity text-xs font-mono cursor-pointer"
            style={{ color: 'var(--theme-text)' }}
          >
            <span>Back to Summit</span>
            <ArrowUp className="w-3.5 h-3.5 text-current" />
          </button>
        </div>
      </div>
    </footer>
  );
}
