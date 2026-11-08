import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  Presentation,
  Download,
  Eye,
  Search,
  CheckCircle,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PHILOSOPHY_RESOURCES, RESOURCE_CATEGORIES } from '../database/resourcesData';
import { useTheme } from '../context/useTheme';

export default function Resources() {
  const { currentThemeObj } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('All Materials');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewResource, setPreviewResource] = useState(null);
  const [downloadToast, setDownloadToast] = useState(null);

  // Filter items
  const filteredResources = PHILOSOPHY_RESOURCES.filter((res) => {
    const matchesCat =
      selectedCategory === 'All Materials' || res.category === selectedCategory;
    const matchesFormat =
      selectedFormat === 'all' || res.type.toLowerCase() === selectedFormat.toLowerCase();
    const matchesSearch =
      searchQuery.trim() === '' ||
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.abstract.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesFormat && matchesSearch;
  });

  const handleDownload = (res) => {
    setDownloadToast({
      title: res.downloadFilename,
      type: res.type,
      size: res.size,
    });

    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.8 },
      colors: [currentThemeObj.accent, '#ffffff', '#888888'],
    });

    setTimeout(() => {
      setDownloadToast(null);
    }, 3800);
  };

  return (
    <div className="min-h-screen bg-black text-white font-serif py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* HEADER & INTRO */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white/50 mb-2">
              <BookOpen className="w-3.5 h-3.5" /> Curated Academic Repository
            </div>
            <h1 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-white">
              PHILOSOPHY RESOURCES
            </h1>
            <p className="text-xs sm:text-sm text-white/60 font-light mt-1 max-w-2xl">
              Downloadable treatise reading dossiers (PDF) and seminar lecture slide decks (PPTX). Placeholders configured for your upcoming academic documents.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search treatises, slides, authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white transition-colors font-mono"
            />
          </div>
        </div>

        {/* CONTROLS: FORMAT FILTER + CATEGORY PILLS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Format Selector Tabs */}
          <div className="join border border-white/15 rounded-2xl p-1 bg-zinc-950">
            <button
              onClick={() => setSelectedFormat('all')}
              className={`join-item btn btn-xs font-mono text-[11px] rounded-xl border-none cursor-pointer transition-colors ${
                selectedFormat === 'all'
                  ? 'bg-white text-black font-bold'
                  : 'text-white/70 hover:text-white bg-transparent'
              }`}
            >
              All Formats ({PHILOSOPHY_RESOURCES.length})
            </button>
            <button
              onClick={() => setSelectedFormat('pdf')}
              className={`join-item btn btn-xs font-mono text-[11px] rounded-xl border-none gap-1.5 cursor-pointer transition-colors ${
                selectedFormat === 'pdf'
                  ? 'bg-white text-black font-bold'
                  : 'text-white/70 hover:text-white bg-transparent'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>PDF Treatises</span>
            </button>
            <button
              onClick={() => setSelectedFormat('ppt')}
              className={`join-item btn btn-xs font-mono text-[11px] rounded-xl border-none gap-1.5 cursor-pointer transition-colors ${
                selectedFormat === 'ppt'
                  ? 'bg-white text-black font-bold'
                  : 'text-white/70 hover:text-white bg-transparent'
              }`}
            >
              <Presentation className="w-3 h-3" />
              <span>PPT Slide Decks</span>
            </button>
          </div>

          {/* Category Dropdown/Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {RESOURCE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-[11px] font-mono border whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-white text-black font-bold border-white shadow-xs'
                    : 'bg-zinc-950 text-white/60 border-white/15 hover:border-white/40 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* RESOURCE CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredResources.map((res) => {
            return (
              <div
                key={res.id}
                className="rounded-3xl border border-white/15 bg-zinc-950 p-6 sm:p-8 flex flex-col justify-between hover:border-white/40 transition-all duration-300 space-y-6 shadow-md"
              >
                <div className="space-y-4">
                  {/* Top badges row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-sm font-mono font-bold bg-white text-black border-none text-[10px]">
                        {res.type}
                      </span>
                      <span className="badge badge-sm badge-outline border-white/20 text-white/60 font-mono text-[10px]">
                        {res.size}
                      </span>
                      <span className="text-[11px] font-mono text-white/40">
                        {res.pages}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-white/50">
                      {res.category}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-white leading-snug">
                      {res.title}
                    </h3>
                    <p className="text-xs text-white/60 italic mt-1">
                      {res.subtitle}
                    </p>
                  </div>

                  {/* Abstract */}
                  <p className="text-xs text-white/70 leading-relaxed font-light">
                    {res.abstract}
                  </p>

                  {/* Academic Level & Author */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-white/50 pt-2 border-t border-white/10">
                    <span>Author: {res.author}</span>
                    <span>Level: {res.academicLevel}</span>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleDownload(res)}
                    className="btn btn-sm flex-1 bg-white text-black hover:bg-zinc-200 border-none font-bold rounded-xl gap-2 shadow-md cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {res.type}</span>
                  </button>

                  <button
                    onClick={() => setPreviewResource(res)}
                    className="btn btn-sm btn-outline border-white/20 text-white hover:bg-white hover:text-black rounded-xl gap-1.5 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview Index</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* EMPTY STATE */}
        {filteredResources.length === 0 && (
          <div className="text-center py-20 rounded-3xl border border-white/10 bg-zinc-950 p-8 space-y-3">
            <BookOpen className="w-10 h-10 text-white/20 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Resources Found</h3>
            <p className="text-xs text-white/50 max-w-sm mx-auto">
              No files matched your active query. Try resetting your search or filter tags.
            </p>
          </div>
        )}

      </div>

      {/* TABLE OF CONTENTS / PREVIEW MODAL */}
      {previewResource && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-zinc-950 border border-white/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setPreviewResource(null)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full border border-white/20 hover:bg-white hover:text-black flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="badge badge-sm bg-white text-black font-mono font-bold border-none text-[10px]">
                {previewResource.format}
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
                {previewResource.title}
              </h2>
              <p className="text-xs italic text-white/60">
                {previewResource.subtitle}
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-wider text-white/50">
                Document Structure & Chapters
              </div>
              <ul className="space-y-2 text-xs">
                {previewResource.tableOfContents.map((chap, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-xl bg-black border border-white/10 flex items-center justify-between"
                  >
                    <span className="text-white">{chap}</span>
                    <span className="badge badge-xs bg-white/10 text-white font-mono">
                      Sec {idx + 1}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs font-mono text-white/60">
              <span>Status: Placeholder Specimen</span>
              <span>Ready for Upload</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPreviewResource(null)}
                className="btn btn-sm btn-ghost text-white cursor-pointer hover:bg-white/10"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDownload(previewResource);
                  setPreviewResource(null);
                }}
                className="btn btn-sm bg-white text-black hover:bg-zinc-200 border-none font-bold rounded-xl gap-2 cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Simulate Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOWNLOAD TOAST */}
      {downloadToast && (
        <div className="toast toast-bottom toast-end z-50">
          <div className="alert bg-zinc-950 border border-white/20 shadow-2xl rounded-2xl text-xs p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-white" />
            <div>
              <div className="font-bold text-white">
                Downloading {downloadToast.type} Specimen
              </div>
              <div className="text-[11px] text-white/60 font-mono">
                {downloadToast.title} ({downloadToast.size})
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
