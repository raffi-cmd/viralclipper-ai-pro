'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Volume2,
  VolumeX,
  Maximize2,
  Film,
  Sparkles,
  ExternalLink,
  Layers
} from 'lucide-react';
import { ViralClip, SubtitleStyleConfig, BrandingConfig, SourceCategory } from '@/lib/types';

interface StudioPlayerProps {
  clip: ViralClip | null;
  sourceCategory: SourceCategory;
  sourceEmbedUrl?: string;
  sourceThumbnailUrl: string;
  styleConfig: SubtitleStyleConfig;
  brandingConfig: BrandingConfig;
  onDownloadClip: (clip: ViralClip) => void;
  onOpenExportModal: () => void;
}

export const StudioPlayer: React.FC<StudioPlayerProps> = ({
  clip,
  sourceCategory,
  sourceEmbedUrl,
  sourceThumbnailUrl,
  styleConfig,
  brandingConfig,
  onDownloadClip,
  onOpenExportModal,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(clip?.durationSec || 60);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [playerMode, setPlayerMode] = useState<'rendered_clip' | 'source_inspector'>('rendered_clip');

  // Sync duration with active clip
  useEffect(() => {
    if (clip) {
      setDuration(clip.durationSec);
      setCurrentTime(0);
      setIsPlaying(false);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    }
  }, [clip?.id, clip?.durationSec]);

  // Handle play/pause
  const togglePlay = () => {
    if (!videoRef.current) {
      setIsPlaying(!isPlaying);
      return;
    }

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn('Autoplay prevented:', e);
        setIsPlaying(false);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.currentTime >= duration) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (newSec: number) => {
    setCurrentTime(newSec);
    if (videoRef.current) {
      videoRef.current.currentTime = newSec;
    }
  };

  const handleReset = () => {
    handleSeek(0);
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsPlaying(false);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formatMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Micro-phrasing active subtitle calculation
  const currentSubtitles = clip?.subtitles || [];
  const activeSegment = currentSubtitles.find(
    (s) => currentTime >= s.start && currentTime <= s.end
  ) || currentSubtitles[0];

  const activeWords = activeSegment?.words || [];
  const activeWordIdx = activeWords.findIndex(
    (w) => currentTime >= w.start && currentTime <= w.end
  );

  const visibleWords = activeWords.slice(
    Math.max(0, activeWordIdx - 2),
    Math.min(activeWords.length, activeWordIdx + 4)
  );

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-between bg-[#12141a] border border-neutral-800/80 rounded-2xl p-3 sm:p-4 h-auto lg:h-[640px] w-full shadow-2xl relative"
    >
      {/* Top Bar: Mode Selector & Duration Info */}
      <div className="w-full flex items-center justify-between pb-2 border-b border-neutral-800/80 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex bg-[#090a0f] p-0.5 rounded-lg border border-neutral-800">
            <button
              onClick={() => setPlayerMode('rendered_clip')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                playerMode === 'rendered_clip'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Film className="w-3 h-3 text-indigo-300" />
              <span>Rendered Clip (9:16)</span>
            </button>
            {sourceEmbedUrl && (
              <button
                onClick={() => setPlayerMode('source_inspector')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                  playerMode === 'source_inspector'
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3 text-neutral-400" />
                <span>Source Inspector</span>
              </button>
            )}
          </div>
        </div>

        {clip && (
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
              Source: {formatMinSec(clip.startSec)} - {formatMinSec(clip.endSec)}
            </span>
            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Clip: {formatMinSec(currentTime)} / {formatMinSec(duration)}
            </span>
          </div>
        )}
      </div>

      {/* Main 9:16 Portrait Canvas (Rendered Media Element - ZERO YouTube Ads!) */}
      <div className="relative w-full max-w-[270px] aspect-[9/16] rounded-2xl overflow-hidden border-2 border-neutral-800 shadow-2xl bg-black flex items-center justify-center select-none my-3 sm:my-auto">
        {playerMode === 'rendered_clip' ? (
          <>
            {/* Background Blur */}
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-50 scale-125 pointer-events-none"
              style={{ backgroundImage: `url(${sourceThumbnailUrl})` }}
            />

            {/* Native Video Element for the Rendered Clip */}
            <div className="relative z-10 w-full aspect-video shadow-2xl overflow-hidden flex items-center justify-center bg-black/90 border-y border-white/10">
              {clip?.renderedVideoUrl ? (
                <video
                  ref={videoRef}
                  src={clip.renderedVideoUrl}
                  className="w-full h-full object-contain pointer-events-auto cursor-pointer"
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  onClick={togglePlay}
                  playsInline
                />
              ) : (
                <div
                  onClick={togglePlay}
                  className="relative w-full h-full cursor-pointer flex items-center justify-center group"
                >
                  <img
                    src={sourceThumbnailUrl}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center hover:bg-black/20 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
                      <Play className="w-6 h-6 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Hook Banner (Detik 0 - 3.5) */}
            {brandingConfig.showHookBanner && (currentTime <= 3.5 || !isPlaying) && (
              <div className="absolute top-6 left-3 right-3 z-20 pointer-events-none">
                <div className="bg-red-600/95 text-white font-black text-[10px] sm:text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-lg text-center shadow-xl border border-red-400/40">
                  🚨 {brandingConfig.hookBannerText || clip?.hookHeadline || 'TONTON SAMPAI SELESAI!'}
                </div>
              </div>
            )}

            {/* Synchronized Micro-Phrasing Subtitle */}
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
                    ? 'bg-black/85 border border-white/15'
                    : styleConfig.boxStyle === 'card'
                    ? 'bg-black/95 border border-white/20'
                    : styleConfig.boxStyle === 'glow'
                    ? 'bg-black/70 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
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
                    {clip?.hookHeadline || 'Tonton Sampai Habis!'}
                  </p>
                )}
              </div>
            </div>

            {/* Watermark */}
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
          </>
        ) : (
          /* Source Inspector Mode */
          <div className="w-full h-full bg-black flex flex-col items-center justify-center p-3 text-center">
            {sourceEmbedUrl ? (
              <iframe
                src={`${sourceEmbedUrl}?start=${clip?.startSec || 0}&end=${clip?.endSec || 60}&autoplay=1`}
                title="Source Video Inspector"
                className="w-full h-full border-0 rounded-xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <p className="text-xs text-neutral-400">Stream sumber tidak memerlukan embed eksternal.</p>
            )}
          </div>
        )}
      </div>

      {/* Transport Controls Bar (Strictly Rendered Clip Timeline) */}
      <div className="w-full space-y-2 pt-2 border-t border-neutral-800/80">
        {/* Seekbar */}
        <div className="w-full flex items-center gap-2">
          <input
            type="range"
            min="0"
            max={duration}
            step="0.1"
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={togglePlay}
              className="px-3 sm:px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Putar'}</span>
            </button>

            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-all"
              title="Reset ke Awal Klip (Detik 0)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={toggleMute}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-all"
              title={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {clip && (
              <button
                onClick={() => onDownloadClip(clip)}
                className="py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold text-white text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                title="Download file video klip MP4 ini"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download Klip #{clip.rank}</span>
                <span className="sm:hidden">Download</span>
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-all hidden sm:block"
              title="Layar Penuh"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
