'use client';

import React, { useState } from 'react';
import { Download, ExternalLink, Play } from 'lucide-react';
import { SubtitlePreset, SubtitleSegment } from '@/lib/types';

interface VideoPlayerProps {
  youtubeId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  subtitles?: SubtitleSegment[];
  preset?: SubtitlePreset;
  hookTitle?: string;
  watermarkText?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  youtubeId,
  thumbnailUrl,
  subtitles,
  preset = 'hormozi',
  hookTitle,
  watermarkText,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Kata aktif untuk simulasi subtitle Hormozi di atas canvas
  const defaultSub = subtitles?.[0]?.text || hookTitle || "Warga Harus Jalan Kiloan Meter Demi Air Bersih...";

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      {/* 9:16 Vertical Portrait Canvas */}
      <div className="relative aspect-[9/16] w-full rounded-3xl overflow-hidden border-2 border-neutral-800 shadow-2xl bg-black flex items-center justify-center group">
        
        {/* Layer 1: Blurred Background */}
        {thumbnailUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-60 scale-125 transform transition-transform"
            style={{ backgroundImage: `url(${thumbnailUrl})` }}
          />
        )}

        {/* Layer 2: Foreground Real Video / Embedded Player */}
        <div className="relative z-10 w-full aspect-video shadow-2xl overflow-hidden flex items-center justify-center bg-black/80 border-y border-white/10">
          {youtubeId ? (
            isPlaying ? (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                title="Viral Clip Preview"
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
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-colors hover:bg-black/10">
                  <div className="w-14 h-14 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                    <Play className="w-7 h-7 fill-white ml-0.5" />
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="text-xs text-neutral-400">Video tidak ditemukan</div>
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

        {/* Layer 4: Dynamic Subtitle (Alex Hormozi / Minimalist / Neon) */}
        <div className="absolute bottom-20 left-4 right-4 z-20 pointer-events-none text-center">
          {preset === 'hormozi' ? (
            <div className="inline-block px-4 py-2 bg-black/60 rounded-xl backdrop-blur-sm border border-black/40">
              <span className="font-extrabold text-sm uppercase text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] tracking-wide">
                {defaultSub.split(' ').map((word, idx) => (
                  <span
                    key={idx}
                    className={idx === 1 ? 'text-[#39FF14] underline text-base font-black mx-1' : 'mx-0.5'}
                  >
                    {word}{' '}
                  </span>
                ))}
              </span>
            </div>
          ) : preset === 'minimalist' ? (
            <div className="inline-block px-4 py-1.5 bg-black/80 rounded-lg text-white font-bold text-xs tracking-normal">
              {defaultSub}
            </div>
          ) : (
            <div className="inline-block px-4 py-1.5 text-cyan-300 font-extrabold text-sm drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
              ✨ {defaultSub}
            </div>
          )}
        </div>

        {/* Layer 5: Watermark */}
        {watermarkText && (
          <div className="absolute bottom-4 right-4 z-20 text-[10px] font-bold text-white/70 bg-black/40 px-2 py-0.5 rounded pointer-events-none">
            @{watermarkText}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="w-full mt-4 flex flex-col gap-2">
        {youtubeId && (
          <a
            href={`https://www.youtube.com/watch?v=${youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 transition-all"
          >
            <ExternalLink className="w-4 h-4 text-neutral-400" /> Buka Video Asli di YouTube
          </a>
        )}

        <button
          onClick={() => {
            alert('Untuk download MP4 hasil render 9:16 offline, jalankan backend lokal (npm run dev) dengan ffmpeg terpasang. Di cloud mode, silakan putar dan preview langsung di sini!');
          }}
          className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-bold text-white text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]"
        >
          <Download className="w-4 h-4" /> Unduh Klip 9:16 HD
        </button>
      </div>
    </div>
  );
};
