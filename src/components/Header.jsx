import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Clock,
  BookOpen,
  Palette,
  Network,
  Home,
  Menu,
  X,
  ChevronDown,
  Layers,
  Check,
  Compass
} from 'lucide-react';
import { useTheme } from '../context/useTheme';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [apparatusOpen, setApparatusOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const location = useLocation();
  const themeRef = useRef(null);

  const { theme, currentThemeObj, setTheme, THEMES } = useTheme();

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setThemeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { to: '/', label: 'Home', icon: Home, badge: null },
    { to: '/map', label: 'Neuron Map', icon: Network, badge: 'Second Brain' },
    { to: '/timeline', label: 'Chronos Timeline', icon: Clock, badge: '1,000 Facts' },
    { to: '/gallery', label: 'Infinite Gallery', icon: Compass, badge: 'Canvas' },
    { to: '/resources', label: 'Resources', icon: BookOpen, badge: 'PDF / PPT' },
  ];

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-md border-b transition-all"
      style={{
        backgroundColor: 'var(--theme-surface)',
        color: 'var(--theme-text)',
        borderColor: 'var(--theme-border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="navbar min-h-20 px-0 flex justify-between">
          
          {/* BRAND LOGO */}
          <div className="flex items-center gap-3">
            <NavLink
              to="/"
              className="flex items-center gap-3 group focus:outline-none"
            >
              <div
                className="w-10 h-10 rounded-xl font-black flex items-center justify-center text-xl transition-transform group-hover:scale-105 duration-200"
                style={{
                  backgroundColor: 'var(--theme-accent)',
                  color: 'var(--theme-accent-text)',
                }}
              >
                <span>Φ</span>
              </div>
              <div className="flex flex-col">
                <span
                  className="font-extrabold tracking-widest text-lg font-serif transition-colors"
                  style={{ color: 'var(--theme-text)' }}
                >
                  PHILOSOPHIFY
                </span>
                <span
                  className="text-[10px] font-mono tracking-widest uppercase"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  Architecture of Thought
                </span>
              </div>
            </NavLink>
          </div>

          {/* DESKTOP MULTI-NAV */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm font-medium">
              {/* Home */}
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-white text-black font-bold shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </NavLink>

              {/* Apparatus Dropdown Menu */}
              <div
                className="relative"
                onMouseEnter={() => setApparatusOpen(true)}
                onMouseLeave={() => setApparatusOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setApparatusOpen((prev) => !prev)}
                  className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                    location.pathname === '/map' || location.pathname === '/timeline' || location.pathname === '/gallery'
                      ? 'bg-white/20 text-white font-bold'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Layers className="w-4 h-4 text-white/60" />
                  <span>Apparatus</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>

                {/* Dropdown Menu Content */}
                {apparatusOpen && (
                  <div className="absolute top-full left-0 pt-1 z-[100] animate-fadeIn">
                    <div className="p-2 shadow-2xl bg-zinc-950 border border-white/20 rounded-2xl w-64 space-y-1">
                      <div className="text-[10px] uppercase font-mono tracking-wider text-white/40 px-3 py-1.5">
                        Dialectical Instruments
                      </div>

                      {/* Knowledge Map */}
                      <NavLink
                        to="/map"
                        onClick={() => setApparatusOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center justify-between p-2.5 rounded-xl text-xs transition-all ${
                            isActive
                              ? 'bg-white text-black font-bold'
                              : 'text-white/80 hover:bg-white/15 hover:text-white'
                          }`
                        }
                      >
                        <div className="flex items-center gap-2.5">
                          <Network className="w-4 h-4" />
                          <div>
                            <div className="font-semibold font-serif">Neuron Map</div>
                            <div className="text-[10px] opacity-60">Neural "Second Brain"</div>
                          </div>
                        </div>
                        <span className="badge badge-xs bg-white/20 text-white border-none font-mono">
                          Graph
                        </span>
                      </NavLink>

                      {/* Chronos Timeline */}
                      <NavLink
                        to="/timeline"
                        onClick={() => setApparatusOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center justify-between p-2.5 rounded-xl text-xs transition-all ${
                            isActive
                              ? 'bg-white text-black font-bold'
                              : 'text-white/80 hover:bg-white/15 hover:text-white'
                          }`
                        }
                      >
                        <div className="flex items-center gap-2.5">
                          <Clock className="w-4 h-4" />
                          <div>
                            <div className="font-semibold font-serif">Chronos Timeline</div>
                            <div className="text-[10px] opacity-60">1,000 Facts Across Time</div>
                          </div>
                        </div>
                        <span className="badge badge-xs bg-white/20 text-white border-none font-mono">
                          Epochs
                        </span>
                      </NavLink>

                      {/* Infinite Gallery */}
                      <NavLink
                        to="/gallery"
                        onClick={() => setApparatusOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center justify-between p-2.5 rounded-xl text-xs transition-all ${
                            isActive
                              ? 'bg-white text-black font-bold'
                              : 'text-white/80 hover:bg-white/15 hover:text-white'
                          }`
                        }
                      >
                        <div className="flex items-center gap-2.5">
                          <Compass className="w-4 h-4" />
                          <div>
                            <div className="font-semibold font-serif">Infinite Gallery</div>
                            <div className="text-[10px] opacity-60">Masterpiece Drift Plane</div>
                          </div>
                        </div>
                        <span className="badge badge-xs bg-white/20 text-white border-none font-mono">
                          Art
                        </span>
                      </NavLink>
                    </div>
                  </div>
                )}
              </div>

              {/* Resources Direct */}
              <NavLink
                to="/resources"
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-white text-black font-bold shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <BookOpen className="w-4 h-4" />
                <span>Resources</span>
                <span className="badge badge-xs border border-white/30 text-[10px] font-mono">
                  PDF / PPT
                </span>
              </NavLink>
            </div>

            {/* QUICK THEME CHANGER DROPDOWN */}
            <div className="relative ml-2 pl-3 border-l border-white/20" ref={themeRef}>
              <button
                type="button"
                onClick={() => setThemeDropdownOpen((prev) => !prev)}
                className="btn btn-sm rounded-xl gap-2 border border-white/25 bg-zinc-950 text-white hover:border-white/50 cursor-pointer shadow-sm transition-all"
                title="Quick Theme & Border Shape Switcher"
              >
                <Palette className="w-3.5 h-3.5 text-white/70" />
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shadow-xs border border-current/30"
                  style={{ backgroundColor: currentThemeObj.previewAccent }}
                />
                <span className="font-mono text-xs">{currentThemeObj.name}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {themeDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-zinc-950 border border-white/20 rounded-2xl shadow-2xl p-2 z-[100] animate-fadeIn space-y-1">
                  <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/50">
                      Quick Theme & Shape
                    </span>
                    <span className="text-[10px] font-mono text-white/40">{THEMES.length} Presets</span>
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-1 py-1 pr-0.5">
                    {THEMES.map((t) => {
                      const isSelected = t.id === theme;
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            setTheme(t.id);
                            setThemeDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-white text-black font-bold shadow-xs'
                              : 'text-white/80 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Color Swatch */}
                            <div
                              className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 shadow-xs"
                              style={{
                                backgroundColor: t.previewBg,
                                borderColor: isSelected ? 'currentColor' : 'rgba(128, 128, 128, 0.4)',
                              }}
                            >
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: t.previewAccent }}
                              />
                            </div>

                            <div>
                              <div className="text-xs font-semibold leading-tight font-serif">
                                {t.name}
                              </div>
                              <div
                                className={`text-[10px] font-mono ${
                                  isSelected ? 'text-black/70' : 'text-white/50'
                                }`}
                              >
                                Shape: {t.shapeName}
                              </div>
                            </div>
                          </div>

                          {isSelected && <Check className="w-4 h-4 shrink-0 text-black" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MOBILE MENU TOGGLE BUTTON */}
          <div className="lg:hidden flex items-center gap-2">
            {/* Quick theme cycle button for mobile */}
            <button
              onClick={() => {
                const curIdx = THEMES.findIndex((t) => t.id === theme);
                const nextTheme = THEMES[(curIdx + 1) % THEMES.length];
                setTheme(nextTheme.id);
              }}
              className="btn btn-xs rounded-lg border border-white/25 bg-zinc-950 text-white gap-1.5"
              title="Tap to cycle theme"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: currentThemeObj.previewAccent }}
              />
              <span className="font-mono text-[10px]">{currentThemeObj.name.split(' ')[0]}</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn btn-sm btn-ghost text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU ACCORDION */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-white/15 animate-fadeIn space-y-4">
            <ul className="menu menu-vertical gap-1 p-0 text-sm">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between p-3 rounded-xl ${
                          isActive
                            ? 'bg-white text-black font-bold'
                            : 'text-white/80 hover:bg-white/10'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span className="font-serif">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="badge badge-xs bg-white/20 text-white border-none font-mono">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>

            {/* Mobile Theme Selector */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-white/50 px-1">
                Quick Theme & Shape Selector
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {THEMES.map((t) => {
                  const isSelected = t.id === theme;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`p-2 rounded-xl text-left border flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-white text-black font-bold border-white'
                          : 'bg-zinc-950 border-white/15 text-white/80'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 border border-current/30"
                          style={{ backgroundColor: t.previewAccent }}
                        />
                        <span className="text-xs truncate font-serif">{t.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
