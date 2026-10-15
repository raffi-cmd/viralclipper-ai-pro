'use client';

import React from 'react';
import { Flame, Play, Clock, Sparkles } from 'lucide-react';
import { ViralClip } from '@/lib/types';

interface ClipSelectorProps {
  clips: ViralClip[];
  selectedIndex: number;
  onSelectClip: (index: number) => void;
}

export const ClipSelector: React.FC<ClipSelectorProps> = ({
  clips,
  selectedIndex,
  onSelectClip,
}) => {
  if (!clips || clips.length === 0) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h4 className="font-bold text-sm text-white">
            Hasil Potongan Klip Viral Terdeteksi ({clips.length} Klip)
          </h4>
        </div>
        <span className="text-[11px] text-neutral-400">Diurutkan berdasarkan Potensi Viral</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {clips.map((clip, idx) => {
          const isSelected = selectedIndex === idx;
          return (
            <div
              key={idx}
              onClick={() => onSelectClip(idx)}
              className={`relative cursor-pointer p-3.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500'
                  : 'border-neutral-800 bg-neutral-950/70 hover:border-neutral-700 hover:bg-neutral-900/80'
              }`}
            >
              {/* Badge Rank & Score */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                      idx === 0
                        ? 'bg-amber-500 text-black'
                        : idx === 1
                        ? 'bg-neutral-300 text-black'
                        : 'bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    RANK #{clip.rank}
                  </span>
                  {idx === 0 && (
                    <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                      <Flame className="w-3 h-3 fill-amber-400" /> TOP VIRAL
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  <Flame className="w-3 h-3" /> {clip.viralScore}% Score
                </div>
              </div>

              {/* Title / Hook */}
              <h5 className="font-bold text-xs text-white line-clamp-1 mb-1">
                {clip.hookHeadline}
              </h5>

              {/* Reason why viral */}
              <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed mb-2.5">
                {clip.reasonWhyViral}
              </p>

              {/* Time Range & Action */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-[10px] text-neutral-400">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-neutral-500" /> {formatTime(clip.startSec)} - {formatTime(clip.endSec)} ({clip.durationSec}s)
                </span>

                <span
                  className={`flex items-center gap-1 font-bold ${
                    isSelected ? 'text-indigo-400' : 'text-neutral-400'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" /> {isSelected ? 'Sedang Diputar' : 'Pilih Klip'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
