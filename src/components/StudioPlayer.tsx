'use client';

import React, { useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  ExternalLink,
  Download,
  Clock,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { SubtitleWord, SubtitleStyleConfig, BrandingConfig } from '@/lib/types';

interface StudioPlayerProps {
  sourceType: 'youtube' | 'local';
  youtubeId?: string;
  localVideoUrl?: string;
  thumbnailUrl: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentPlaySec: number;
  durationSec: number;
  startSec: number;
  endSec: number;
  onSeek: (seconds: number) => void;
  onReset: () => void;
  subtitles: SubtitleWord[];
  activeWordIdx: number;
  styleConfig: SubtitleStyleConfig;
  brandingConfig: BrandingConfig;
  onOpenExport: () => void;
}

export const StudioPlayer: React.FC<StudioPlayerProps> = ({
  sourceType,
  youtubeId,
  localVideoUrl,
  thumbnailUrl,
  isPlaying,
  onTogglePlay,
  currentPlaySec,
  durationSec,
  startSec,
  endSec,
  onSeek,
  onReset,
  subtitles,
  activeWordIdx,
  styleConfig,
  brandingConfig,
  onOpenExport,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const formatMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Micro-phrasing: tampilkan 3-5 kata aktif agar mata penonton nyaman membaca
  const visibleWords = subtitles.slice(
    Math.max(0, activeWordIdx - 2),
    Math.min(subtitles.length, activeWordIdx + 4)
  );

  return (
    <div className="flex flex-col items-center justify-between bg-[#12141a] border border-neutral-800/80 rounded-2xl p-4 h-[640px] w-full">
      {/* Top Canvas Bar */}
      <div className="w-full flex items-center justify-between pb-2 border-b border-neutral-800/80 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-white text-[11px]">9:16 Portrait Canvas</span>
          <span className="text-[10px] text-neutral-400 font-mono bg-neutral-800 px-1.5 py-0.5 rounded">
            {formatMinSec(startSec)} - {formatMinSec(endSec)}
          </span>
        </div>

        <span className="text-[11px] font-mono text-neutral-300 font-bold">
          {formatMinSec(currentPlaySec)} / {formatMinSec(durationSec)}
        </span>
      </div>

      {/* 9:16 Frame Studio */}
      <div className="relative w-[270px] h-[460px] rounded-2xl overflow-hidden border-2 border-neutral-800 shadow-2xl bg-black flex items-center justify-center select-none my-auto">
        {/* Layer 1: Background Blur */}
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-60 scale-125"
          style={{ backgroundImage: `url(${thumbnailUrl})` }}
        />

        {/* Layer 2: Real Video Foreground */}
        <div className="relative z-10 w-full aspect-video shadow-2xl overflow-hidden flex items-center justify-center bg-black/90 border-y border-white/10">
          {sourceType === 'local' && localVideoUrl ? (
            <video
              ref={videoRef}
              src={localVideoUrl}
              className="w-full h-full object-contain pointer-events-auto"
              controls={false}
              autoPlay={isPlaying}
              loop
            />
          ) : youtubeId ? (
            isPlaying ? (
              <iframe
                key={`${youtubeId}-${startSec}-${endSec}`}
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&start=${startSec}&end=${endSec}&rel=0&modestbranding=1&playsinline=1`}
                title="Active Clip"
                className="w-full h-full border-0 pointer-events-auto"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div
                onClick={onTogglePlay}
                className="relative w-full h-full cursor-pointer flex items-center justify-center"
              >
                <img
                  src={thumbnailUrl}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center hover:bg-black/20 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="text-xs text-neutral-500">Pilih video terlebih dahulu</div>
          )}
        </div>

        {/* Layer 3: Hook Banner Overlay (0 - 3s) */}
        {brandingConfig.showHookBanner && brandingConfig.hookBannerText && (
          <div className="absolute top-6 left-3 right-3 z-20 pointer-events-none">
            <div className="bg-red-600/95 text-white font-black text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-lg text-center shadow-xl border border-red-400/40">
              🚨 {brandingConfig.hookBannerText}
            </div>
          </div>
        )}

        {/* Layer 4: Micro-Phrased Readable Subtitle (Human Readable Pill Box) */}
        <div
          className={`absolute left-3 right-3 z-20 pointer-events-none text-center transition-all ${
            styleConfig.position === 'top'
              ? 'top-16'
              : styleConfig.position === 'middle'
              ? 'top-1/2 -translate-y-1/2'
              : 'bottom-10'
          }`}
        >
          <div
            className={`inline-block px-3.5 py-2 rounded-2xl backdrop-blur-md transition-all shadow-2xl ${
              styleConfig.boxStyle === 'pill'
                ? 'bg-black/80 border border-white/15'
                : styleConfig.boxStyle === 'card'
                ? 'bg-black/95 border border-white/20'
                : styleConfig.boxStyle === 'glow'
                ? 'bg-black/60 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                : 'bg-black/70'
            }`}
            style={{ fontFamily: styleConfig.fontFamily }}
          >
            {visibleWords.length > 0 ? (
              <p
                className={`font-extrabold leading-snug tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,1)] ${
                  styleConfig.uppercase ? 'uppercase' : ''
                }`}
                style={{ fontSize: `${styleConfig.fontSize}px` }}
              >
                {visibleWords.map((item, idx) => {
                  const isWordActive = idx === (activeWordIdx % visibleWords.length);
                  return (
                    <span
                      key={idx}
                      style={{
                        color: isWordActive ? styleConfig.highlightColor : styleConfig.textColor,
                        transform: isWordActive ? 'scale(1.12)' : 'scale(1.0)',
                        textShadow: isWordActive
                          ? `0 0 10px ${styleConfig.highlightColor}`
                          : '0 2px 4px rgba(0,0,0,0.8)',
                      }}
                      className="inline-block mx-0.5 transition-all duration-150 font-black"
                    >
                      {item.word}{' '}
                      {item.emoji && <span className="inline-block ml-0.5 text-sm">{item.emoji}</span>}
                    </span>
                  );
                })}
              </p>
            ) : (
              <p
                className="font-black uppercase text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]"
                style={{ fontSize: `${styleConfig.fontSize}px`, fontFamily: styleConfig.fontFamily }}
              >
                {brandingConfig.hookBannerText || 'Tonton Sampai Habis!'}
              </p>
            )}
          </div>
        </div>

        {/* Layer 5: Watermark */}
        {brandingConfig.showWatermark && brandingConfig.watermarkText && (
          <div
            className={`absolute z-20 text-[9px] font-bold text-white/70 bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm ${
              brandingConfig.watermarkPosition === 'top-left'
                ? 'top-2 left-3'
                : brandingConfig.watermarkPosition === 'top-right'
                ? 'top-2 right-3'
                : brandingConfig.watermarkPosition === 'bottom-left'
                ? 'bottom-2 left-3'
                : 'bottom-2 right-3'
            }`}
          >
            @{brandingConfig.watermarkText}
          </div>
        )}
      </div>

      {/* Transport Controls Bar */}
      <div className="w-full space-y-2 pt-2 border-t border-neutral-800/80">
        {/* Interactive Seekbar Scrubber */}
        <div className="w-full flex items-center gap-2">
          <input
            type="range"
            min="0"
            max={durationSec}
            value={currentPlaySec}
            onChange={(e) => onSeek(parseInt(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onTogglePlay}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {isPlaying ? 'Pause' : 'Putar'}
          </button>

          <button
            onClick={onReset}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-all"
            title="Ulangi dari Detik 0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {youtubeId && (
            <a
              href={`https://www.youtube.com/watch?v=${youtubeId}&t=${startSec}s`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-all"
              title="Buka di YouTube"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={onOpenExport}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold text-white text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" /> Export Klip Ini
          </button>
        </div>
      </div>
    </div>
  );
};
