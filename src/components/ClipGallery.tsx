'use client';

import React, { useState } from 'react';
import {
  Film,
  Play,
  Download,
  Flame,
  CheckSquare,
  Square,
  ArrowUpDown,
  Info,
  X,
  Sparkles
} from 'lucide-react';
import { ViralClip, SourceType } from '@/lib/types';

interface ClipGalleryProps {
  clips: ViralClip[];
  selectedClipId: string;
  onSelectClip: (clipId: string) => void;
  onToggleClipSelection: (clipId: string) => void;
  onExportSelected: (selectedClips: ViralClip[]) => void;
  onDirectDownloadClip?: (clip: ViralClip) => void;
  thumbnailUrl: string;
  sourceType?: SourceType;
  youtubeId?: string | null;
}

export const ClipGallery: React.FC<ClipGalleryProps> = ({
  clips,
  selectedClipId,
  onSelectClip,
  onToggleClipSelection,
  onExportSelected,
  onDirectDownloadClip,
  thumbnailUrl,
  sourceType = 'youtube',
  youtubeId,
}) => {
  const [sortBy, setSortBy] = useState<'score' | 'time' | 'duration'>('score');
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);

  const formatMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const sortedClips = [...clips].sort((a, b) => {
    if (sortBy === 'score') return b.viralScore - a.viralScore;
    if (sortBy === 'time') return a.startSec - b.startSec;
    return b.durationSec - a.durationSec;
  });

  const selectedCount = clips.filter((c) => c.isSelected).length;

  return (
    <div className="bg-[#12141a] border border-neutral-800/80 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-800/80 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-indigo-400" />
            <h4 className="text-sm sm:text-base font-bold text-white">
              Daftar Video Hasil Klip 9:16 ({clips.length} Klip)
            </h4>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Rank #1 - #{clips.length} AI Ranked
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-neutral-500 hidden sm:inline" />
            Durasi berurutan sesuai timeline video asli. Klik tombol Download untuk unduh video & subtitle langsung!
          </p>
        </div>

        {/* Sort & Multi-Select Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-[#0a0b0e] px-2 py-1 rounded-xl border border-neutral-800 text-xs text-neutral-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-neutral-500 text-[11px] hidden sm:inline">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="score">Viral Score (Tertinggi)</option>
              <option value="time">Timeline (Detik Awal - Akhir)</option>
              <option value="duration">Durasi Klip</option>
            </select>
          </div>

          <button
            onClick={() => onExportSelected(clips.filter((c) => c.isSelected))}
            disabled={selectedCount === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedCount > 0
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/50'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Download Terpilih ({selectedCount})
          </button>
        </div>
      </div>

      {/* Grid Kartu Video 9:16 Berjejer Rapi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {sortedClips.map((clip) => {
          const isSelectedInStudio = selectedClipId === clip.id;
          const isThisPlaying = playingClipId === clip.id;

          return (
            <div
              key={clip.id}
              className={`group relative rounded-2xl border overflow-hidden bg-[#161822] flex flex-col justify-between transition-all duration-200 ${
                isSelectedInStudio
                  ? 'border-indigo-500 ring-2 ring-indigo-500/40 shadow-xl shadow-indigo-500/10'
                  : 'border-neutral-800 hover:border-neutral-700 hover:bg-[#1a1c28]'
              }`}
            >
              {/* Top Controls: Checkbox & Rank Badge */}
              <div className="p-2.5 pb-1.5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleClipSelection(clip.id);
                  }}
                  className="text-neutral-400 hover:text-white"
                  title="Pilih klip ini"
                >
                  {clip.isSelected ? (
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4 text-neutral-600" />
                  )}
                </button>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                      clip.rank === 1
                        ? 'bg-amber-400 text-black shadow-sm'
                        : clip.rank === 2
                        ? 'bg-neutral-200 text-black'
                        : 'bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    RANK #{clip.rank}
                  </span>

                  <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-0.5">
                    <Flame className="w-2.5 h-2.5 fill-emerald-400" />
                    {clip.viralScore}%
                  </span>
                </div>
              </div>

              {/* 9:16 Aspect Thumbnail Frame */}
              <div className="relative aspect-[9/16] mx-2.5 rounded-xl overflow-hidden bg-black/80 border border-neutral-800/80 group-hover:border-neutral-700 transition-colors">
                {isThisPlaying && sourceType === 'youtube' && youtubeId ? (
                  <>
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&start=${clip.startSec}&end=${clip.endSec}&rel=0&modestbranding=1&playsinline=1`}
                      title={clip.title}
                      className="absolute inset-0 w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlayingClipId(null);
                      }}
                      className="absolute top-2 right-2 z-30 p-1 rounded-full bg-black/70 text-white hover:bg-black/90 shadow"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    {/* Blurred Layer */}
                    <div
                      className="absolute inset-0 bg-cover bg-center filter blur-md opacity-50 scale-125"
                      style={{ backgroundImage: `url(${thumbnailUrl})` }}
                    />

                    {/* Thumbnail Foreground */}
                    <img
                      src={thumbnailUrl}
                      alt={clip.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-85"
                    />

                    {/* Hook Banner Mini */}
                    <div className="absolute top-2 left-2 right-2 z-10">
                      <span className="block bg-red-600/90 text-white font-black text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded text-center truncate shadow">
                        🚨 {clip.hookHeadline}
                      </span>
                    </div>

                    {/* Subtitle Mini Pill */}
                    <div className="absolute bottom-3 left-2 right-2 z-10 text-center pointer-events-none">
                      <div className="bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10">
                        <span className="text-[9px] font-black text-yellow-300 uppercase line-clamp-1">
                          {clip.subtitles[0]?.text || clip.hookHeadline}
                        </span>
                      </div>
                    </div>

                    {/* Play Button Overlay */}
                    <div
                      onClick={() => {
                        onSelectClip(clip.id);
                        setPlayingClipId(clip.id);
                      }}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20 cursor-pointer"
                    >
                      <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Duration & Segment Badge */}
                    <div className="absolute bottom-10 right-2 z-10 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-white border border-white/10">
                      {clip.durationSec}s
                    </div>
                  </>
                )}
              </div>

              {/* Clip Details */}
              <div className="p-2.5 pt-2 flex flex-col justify-between flex-1">
                <div>
                  <h5 className="font-bold text-xs text-white line-clamp-1 mb-0.5">
                    {clip.title}
                  </h5>
                  <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed mb-2">
                    {clip.reasonWhyViral}
                  </p>
                </div>

                <div className="space-y-1.5 pt-1.5 border-t border-neutral-800/80">
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                    <span>Timeline:</span>
                    <span className="text-indigo-400 font-bold">
                      {formatMinSec(clip.startSec)} - {formatMinSec(clip.endSec)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      onClick={() => {
                        onSelectClip(clip.id);
                        setPlayingClipId(clip.id);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                        isSelectedInStudio
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                      }`}
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      {isSelectedInStudio ? 'Aktif' : 'Preview'}
                    </button>

                    <button
                      onClick={() => {
                        if (onDirectDownloadClip) {
                          onDirectDownloadClip(clip);
                        } else {
                          onExportSelected([clip]);
                        }
                      }}
                      className="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center gap-1 transition-all shadow-sm active:scale-95"
                    >
                      <Download className="w-2.5 h-2.5" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
