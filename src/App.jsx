import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { ThemeProvider } from './context/ThemeContext';

// Pages are loaded on demand, so the big data files (timeline, neuron map,
// gallery) are only downloaded when their page is opened.
const Home = lazy(() => import('./pages/Home'));
const Timeline = lazy(() => import('./pages/Timeline'));
const NeuronMap = lazy(() => import('./pages/NeuronMap'));
const Resources = lazy(() => import('./pages/Resources'));
const Gallery = lazy(() => import('./pages/Gallery'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Scroll to top on every page change
function RouteHandler() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return null;
}

function PageFallback() {
  return (
    <div
      className="min-h-[calc(100vh-5rem)] flex items-center justify-center font-mono text-xs"
      style={{ color: 'var(--theme-text-muted)' }}
      role="status"
    >
      <span className="route-loader" aria-hidden="true" />
      <span className="ml-3">Loading…</span>
    </div>
  );
}

// Each page fades/slides in when the path changes (CSS in index.css)
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <main className="flex-grow">
      <div key={location.pathname} className="route-enter">
        <Suspense fallback={<PageFallback />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/map" element={<NeuronMap />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <RouteHandler />
        <div
          className="flex flex-col min-h-screen antialiased font-serif transition-colors duration-200"
          style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}
        >
          <Header />
          <AnimatedRoutes />
          <Footer />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}