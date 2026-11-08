import React from 'react';
import { NavLink } from 'react-router-dom';
import { Network, Clock, BookOpen, ArrowUp, Compass } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-white/10 bg-black text-white/80 py-16 font-serif">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white text-black font-black flex items-center justify-center text-lg">
                Φ
              </div>
              <span className="font-extrabold tracking-widest text-lg text-white">
                PHILOSOPHIFY
              </span>
            </div>
            <p className="text-xs text-white/60 max-w-sm leading-relaxed">
              A minimalist epistemic apparatus built for scholars, dialecticians, and seekers. Synthesizing 2,500 years of metaphysical, ethical, and epistemological inquiry into interconnected systems.
            </p>
            <div className="pt-2 text-xs font-mono text-white/40">
              “The unexamined life is not worth living.” — Socrates
            </div>
          </div>

          {/* Core Instruments */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-white font-bold">
              Instruments
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <NavLink to="/map" className="hover:text-white transition-colors flex items-center gap-2">
                  <Network className="w-3.5 h-3.5 opacity-60" />
                  <span>Knowledge Map ("Second Brain")</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/timeline" className="hover:text-white transition-colors flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 opacity-60" />
                  <span>Chronos Timeline (600 BC – Present)</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/resources" className="hover:text-white transition-colors flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 opacity-60" />
                  <span>Treatises & Slides (PDF / PPT)</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/gallery" className="hover:text-white transition-colors flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 opacity-60" />
                  <span>Infinite Gallery (Masterpiece Drift)</span>
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Epistemic Axioms */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-white font-bold">
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
                  className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-white/70 hover:border-white/30 transition-colors"
                >
                  {tradition}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <div>
            © {CURRENT_YEAR} Philosophify. Structured for autonomous contemplation.
          </div>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-xs font-mono cursor-pointer"
          >
            <span>Back to Summit</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
