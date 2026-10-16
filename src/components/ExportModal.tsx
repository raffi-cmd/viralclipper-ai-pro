'use client';

import React, { useState } from 'react';
import {
  X,
  Download,
  FileText,
  FileCode,
  Film,
  CheckCircle2,
  Sparkles,
  Loader2,
  Layers
} from 'lucide-react';
import { ViralClip, SubtitleStyleConfig } from '@/lib/types';
import { SubtitleFileExporter } from '@/lib/subtitle-generator';
import { ClientVideoExporter } from '@/lib/client-video-exporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clipsToExport: ViralClip[];
  styleConfig: SubtitleStyleConfig;
  thumbnailUrl: string;
  watermarkText?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  clipsToExport,
  styleConfig,
  thumbnailUrl,
  watermarkText = 'ViralClipper',
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportStatusText, setExportStatusText] = useState<string>('');

  if (!isOpen || clipsToExport.length === 0) return null;

  // 1. Direct Video Render & Download (Real MP4/WebM 9:16 video!)
  const handleDownloadRealVideo = async (clip: ViralClip) => {
    try {
      setIsExportingVideo(true);
      setExportProgress(10);
      setExportStatusText(`Menyiapkan klip #${clip.rank}...`);

      const subtitleSnippet = clip.subtitles[0]?.text?.slice(0, 35) || clip.hookHeadline;

      await ClientVideoExporter.recordAndDownloadClip({
        thumbnailUrl,
        title: `${clip.title}_rank${clip.rank}`,
        durationSec: clip.durationSec,
        hookText: clip.hookHeadline,
        subtitleText: subtitleSnippet,
        watermarkText,
        fontFamily: styleConfig.fontFamily,
        highlightColor: styleConfig.highlightColor,
        onProgress: (percent, msg) => {
          setExportProgress(percent);
          setExportStatusText(msg);
        },
      });

      setDownloadSuccess(`Video 9:16 untuk Klip #${clip.rank} berhasil diunduh ke komputer Anda!`);
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err: any) {
      alert(`Gagal merender video: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsExportingVideo(false);
      setExportProgress(0);
      setExportStatusText('');
    }
  };

  // 2. Download Subtitle SRT
  const handleDownloadSRT = (clip: ViralClip) => {
    const srtContent = SubtitleFileExporter.generateSRT(clip.subtitles);
    SubtitleFileExporter.downloadBlob(
      srtContent,
      `subtitle_${clip.id}_rank${clip.rank}.srt`,
      'text/plain;charset=utf-8'
    );
    setDownloadSuccess(`File SRT Klip #${clip.rank} berhasil diunduh!`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // 3. Download Copywriting Text
  const handleDownloadCopywriting = (clip: ViralClip) => {
    const content = `=== VIRALCLIPPER AI PRO EXPORT ===\nKLIP: #${clip.rank} - ${clip.title}\nVIRAL RETENTION SCORE: ${clip.viralScore}%\nDURASI: ${clip.durationSec} Detik (Timeline: ${Math.floor(clip.startSec / 60)}:${String(clip.startSec % 60).padStart(2, '0')} - ${Math.floor(clip.endSec / 60)}:${String(clip.endSec % 60).padStart(2, '0')})\n\n[HOOK HEADLINE]\n${clip.copywriting.hookHeadline}\n\n[CAPTION MEDIA SOSIAL]\n${clip.copywriting.caption}\n\n[VIRAL HASHTAGS]\n${clip.copywriting.hashtags.join(' ')}\n\n[SUBTITLE TEXT]\n${clip.subtitles.map((s) => s.text).join('\n')}\n`;
    SubtitleFileExporter.downloadBlob(
      content,
      `copywriting_rank${clip.rank}.txt`,
      'text/plain;charset=utf-8'
    );
    setDownloadSuccess(`Naskah Copywriting Klip #${clip.rank} berhasil diunduh!`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // 4. One-Click: Download All (Video + SRT + Copywriting)
  const handleDownloadBundle = async (clip: ViralClip) => {
    handleDownloadSRT(clip);
    handleDownloadCopywriting(clip);
    await handleDownloadRealVideo(clip);
  };

  const firstClip = clipsToExport[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl border border-neutral-800 bg-[#12141a] p-5 sm:p-6 shadow-2xl text-white my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Download & Export Klip</h3>
              <p className="text-xs text-neutral-400">
                Siap diunduh langsung untuk {clipsToExport.length} klip
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Render Progress */}
        {isExportingVideo && (
          <div className="mt-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                {exportStatusText}
              </span>
              <span className="font-mono text-indigo-400">{exportProgress}%</span>
            </div>
            <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-200"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Feedback Alert */}
        {downloadSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Action Options */}
        <div className="space-y-4 py-4 text-xs">
          {/* Featured: Instant 1-Click Bundle Download */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-[#161822] border border-emerald-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Rekomendasi Instan
                </span>
                <h4 className="font-bold text-white text-sm mt-0.5">
                  Unduh Paket Lengkap (Video 9:16 + Subtitle + Naskah)
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Menghasilkan file video MP4 9:16, berkas subtitle .SRT, dan caption siap posting.
                </p>
              </div>

              <button
                disabled={isExportingVideo}
                onClick={() => handleDownloadBundle(firstClip)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center justify-center gap-2 shadow-lg ${
                  isExportingVideo
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white shadow-emerald-600/25 active:scale-95'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Unduh Sekarang</span>
              </button>
            </div>
          </div>

          {/* Individual Export Formats */}
          <div>
            <h4 className="font-semibold text-neutral-300 mb-2.5">Atau Unduh Berkas Tertentu:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* MP4 Video */}
              <button
                disabled={isExportingVideo}
                onClick={() => handleDownloadRealVideo(firstClip)}
                className="p-3 rounded-xl border border-neutral-800 bg-[#161822] hover:border-neutral-700 hover:bg-[#1c1f2b] text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Film className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-mono text-neutral-400">.MP4</span>
                </div>
                <div className="font-bold text-white group-hover:text-indigo-300">Video 9:16 (MP4)</div>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  Video klip portrait dengan subtitle & hook banner terpasang.
                </p>
              </button>

              {/* SRT Subtitle */}
              <button
                onClick={() => clipsToExport.forEach(handleDownloadSRT)}
                className="p-3 rounded-xl border border-neutral-800 bg-[#161822] hover:border-neutral-700 hover:bg-[#1c1f2b] text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-mono text-neutral-400">.SRT</span>
                </div>
                <div className="font-bold text-white group-hover:text-amber-300">File Subtitle (SRT)</div>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  Format teks subtitle universal untuk CapCut, Premiere, & TikTok.
                </p>
              </button>

              {/* Copywriting */}
              <button
                onClick={() => clipsToExport.forEach(handleDownloadCopywriting)}
                className="p-3 rounded-xl border border-neutral-800 bg-[#161822] hover:border-neutral-700 hover:bg-[#1c1f2b] text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-mono text-neutral-400">.TXT</span>
                </div>
                <div className="font-bold text-white group-hover:text-emerald-300">Naskah & Hashtag</div>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  Hook headline, deskripsi, dan 7+ hashtag viral siap copy-paste.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
