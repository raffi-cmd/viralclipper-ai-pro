'use client';

import React, { useState, useEffect } from 'react';
import { Download, ExternalLink, Play, RotateCcw, Type, Palette } from 'lucide-react';
import { SubtitlePreset, SubtitleSegment, SubtitleFont } from '@/lib/types';

interface VideoPlayerProps {
  youtubeId?: string;
  thumbnailUrl?: string;
  subtitles?: SubtitleSegment[];
  preset?: SubtitlePreset;
  hookTitle?: string;
  watermarkText?: string;
  startSec?: number;
  durationSec?: number;
  customFont?: SubtitleFont;
  highlightColor?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  youtubeId,
  thumbnailUrl,
  subtitles = [],
  preset = 'hormozi',
  hookTitle,
  watermarkText,
  startSec = 0,
  durationSec = 30,
  customFont = 'Montserrat',
  highlightColor = '#39FF14', // Default Hijau Stabilo Alex Hormozi
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSecond, setActiveSecond] = useState(0);

  // Reset timer saat klip baru dipilih atau ganti startSec
  useEffect(() => {
    setIsPlaying(false);
    setActiveSecond(0);
  }, [youtubeId, startSec, durationSec]);

  // Simulasi sinkronisasi kata subtitle aktif saat video diputar
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setActiveSecond((prev) => {
          if (prev >= durationSec) {
            return 0; // Loop kembali ke awal klip
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setActiveSecond(0);
    }
    return () => clearInterval(interval);
  }, [isPlaying, durationSec]);

  // Cari subtitle yang aktif di detik ini
  const activeSegment = subtitles.find(
    (s) => activeSecond >= s.start && activeSecond <= s.end
  ) || subtitles[0];

  const currentWords = activeSegment?.words || [];
  const currentSentence = activeSegment?.text || hookTitle || 'Tonton Momen Ini Sampai Habis!';

  // Tentukan kata aktif berdasarkan offset detik
  const activeWordIndex = Math.floor((activeSecond % 4) * (currentWords.length / 4));

  const endSec = startSec + durationSec;

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      {/* 9:16 Vertical Portrait Canvas */}
      <div className="relative aspect-[9/16] w-full rounded-3xl overflow-hidden border-2 border-neutral-800 shadow-2xl bg-black flex items-center justify-center group select-none">
        
        {/* Layer 1: Blurred Background */}
        {thumbnailUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-60 scale-125 transform transition-transform"
            style={{ backgroundImage: `url(${thumbnailUrl})` }}
          />
        )}

        {/* Layer 2: Foreground Real Video Player (Trimmed to Exact start & end) */}
        <div className="relative z-10 w-full aspect-video shadow-2xl overflow-hidden flex items-center justify-center bg-black/80 border-y border-white/10">
          {youtubeId ? (
            isPlaying ? (
              <iframe
                key={`${youtubeId}-${startSec}-${endSec}`}
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&start=${startSec}&end=${endSec}&rel=0&modestbranding=1&playsinline=1`}
                title="Viral Clip Player"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div
                onClick={() => setIsPlaying(true)}
                className="relative w-full h-full cursor-pointer flex items-center justify-center"
              >
                <img
                  src={thumbnailUrl || `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
                  alt="Video Thumbnail"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center transition-colors hover:bg-black/20 gap-2">
                  <div className="w-14 h-14 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                    <Play className="w-7 h-7 fill-white ml-0.5" />
                  </div>
                  <span className="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">
                    Putar Klip {durationSec} Detik
                  </span>
                </div>
              </div>
            )
          ) : (
            <div className="text-xs text-neutral-400">Pilih video terlebih dahulu</div>
          )}
        </div>

        {/* Layer 3: Hook Banner Overlay (Detik 0 - 3) */}
        {hookTitle && (
          <div className="absolute top-12 left-4 right-4 z-20 pointer-events-none">
            <div className="bg-red-600 text-white font-extrabold text-xs uppercase tracking-wider px-3 py-2 rounded-xl text-center shadow-lg border border-red-400/50">
              🚨 {hookTitle}
            </div>
          </div>
        )}

        {/* Layer 4: Real-time Dynamic Karaoke Subtitles */}
        <div className="absolute bottom-16 left-4 right-4 z-20 pointer-events-none text-center">
          <div
            className="inline-block px-4 py-2.5 bg-black/75 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl max-w-[90%]"
            style={{ fontFamily: customFont }}
          >
            {currentWords.length > 0 ? (
              <p className="text-sm font-extrabold uppercase leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                {currentWords.map((item, idx) => {
                  const isWordActive = idx === activeWordIndex;
                  return (
                    <span
                      key={idx}
                      style={{
                        color: isWordActive ? highlightColor : '#FFFFFF',
                        transform: isWordActive ? 'scale(1.15)' : 'scale(1.0)',
                        textDecoration: isWordActive ? 'underline' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                      className="inline-block mx-1 font-black"
                    >
                      {item.emoji ? `${item.emoji} ` : ''}{item.word}
                    </span>
                  );
                })}
              </p>
            ) : (
              <p
                className="text-sm font-black uppercase text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]"
                style={{ fontFamily: customFont }}
              >
                {currentSentence}
              </p>
            )}
          </div>
        </div>

        {/* Layer 5: Time Indicator & Watermark */}
        <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none text-[10px] text-white/80 font-mono">
          <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
            ⏱️ {activeSecond}s / {durationSec}s
          </span>
          {watermarkText && (
            <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm font-bold">
              @{watermarkText}
            </span>
          )}
        </div>
      </div>

      {/* Action Controls */}
      <div className="w-full mt-4 flex flex-col gap-2">
        <div className="flex gap-2">
          {isPlaying && (
            <button
              onClick={() => {
                setIsPlaying(false);
                setTimeout(() => setIsPlaying(true), 100);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 transition-all flex-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Ulangi Klip
            </button>
          )}

          {youtubeId && (
            <a
              href={`https://www.youtube.com/watch?v=${youtubeId}&t=${startSec}s`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 transition-all flex-1"
            >
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" /> Buka di YouTube
            </a>
          )}
        </div>

        <button
          onClick={() => {
            alert(`Klip berdurasi ${durationSec} detik (mulai detik ke-${startSec}) siap diposting. Gunakan caption & hashtag yang telah disiapkan di samping kanan!`);
          }}
          className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-bold text-white text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]"
        >
          <Download className="w-4 h-4" /> Unduh Klip {durationSec} Detik (9:16)
        </button>
      </div>
    </div>
  );
};
