import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import Home from './pages/Home';
import Timeline from './pages/Timeline';
import NeuronMap from './pages/NeuronMap';
import Resources from './pages/Resources';
import Gallery from './pages/Gallery';
import NotFound from './pages/NotFound';

// Component to handle route changes: scrolls to top
function RouteHandler() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
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
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/map" element={<NeuronMap />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/resources" element={<Resources />} />
              {/* Fallback 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
