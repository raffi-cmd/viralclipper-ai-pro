'use client';

import React, { useState } from 'react';
import {
  X,
  Download,
  FileText,
  FileCode,
  Film,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers
} from 'lucide-react';
import { ViralClip, SubtitleStyleConfig } from '@/lib/types';
import { SubtitleFileExporter } from '@/lib/subtitle-generator';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clipsToExport: ViralClip[];
  styleConfig: SubtitleStyleConfig;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  clipsToExport,
  styleConfig,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen || clipsToExport.length === 0) return null;

  const handleDownloadSRT = (clip: ViralClip) => {
    const srtContent = SubtitleFileExporter.generateSRT(clip.subtitles);
    SubtitleFileExporter.downloadBlob(
      srtContent,
      `subtitle_${clip.id}_rank${clip.rank}.srt`,
      'text/plain;charset=utf-8'
    );
    setDownloadSuccess(`File SRT untuk Klip #${clip.rank} berhasil diunduh!`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDownloadASS = (clip: ViralClip) => {
    const assContent = SubtitleFileExporter.generateASS(clip.subtitles, styleConfig);
    SubtitleFileExporter.downloadBlob(
      assContent,
      `styled_${clip.id}_rank${clip.rank}.ass`,
      'text/plain;charset=utf-8'
    );
    setDownloadSuccess(`File ASS Styling untuk Klip #${clip.rank} berhasil diunduh!`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDownloadCopywriting = (clip: ViralClip) => {
    const content = `=== VIRALCLIPPER AI PRO EXPORT ===\nKLIP RANK: #${clip.rank}\nVIRAL RETENTION SCORE: ${clip.viralScore}%\nDURASI: ${clip.durationSec} DETIK\nTIMESTAMPS: Detik ke-${clip.startSec} sampai ${clip.endSec}\n\n[HOOK HEADLINE]\n${clip.copywriting.hookHeadline}\n\n[CAPTION MEDIA SOSIAL]\n${clip.copywriting.caption}\n\n[VIRAL HASHTAGS]\n${clip.copywriting.hashtags.join(' ')}\n\n[SUBTITLES TRANSLATION]\n${clip.subtitles.map((s) => s.text).join('\n')}\n`;
    SubtitleFileExporter.downloadBlob(
      content,
      `copywriting_rank${clip.rank}.txt`,
      'text/plain;charset=utf-8'
    );
    setDownloadSuccess(`Naskah Copywriting Klip #${clip.rank} berhasil diunduh!`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl border border-neutral-800 bg-[#12141a] p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Export Center</h3>
              <p className="text-xs text-neutral-400">
                Pilih format ekspor untuk {clipsToExport.length} klip terpilih
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

        {/* Feedback Alert */}
        {downloadSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Download Options */}
        <div className="space-y-4 py-4 text-xs">
          <div className="space-y-3">
            <h4 className="font-semibold text-neutral-300">1. Unduh Berkas Aset & Subtitle (Siap Pakai)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <button
                onClick={() => clipsToExport.forEach(handleDownloadSRT)}
                className="p-3 rounded-xl border border-neutral-800 bg-[#161822] hover:border-neutral-700 hover:bg-[#1c1f2b] text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-mono text-neutral-400">.SRT</span>
                </div>
                <div className="font-bold text-white group-hover:text-amber-300">Format SRT</div>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  Kompatibel dengan YouTube, CapCut, Premiere Pro, & DaVinci.
                </p>
              </button>

              <button
                onClick={() => clipsToExport.forEach(handleDownloadASS)}
                className="p-3 rounded-xl border border-neutral-800 bg-[#161822] hover:border-neutral-700 hover:bg-[#1c1f2b] text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-mono text-neutral-400">.ASS</span>
                </div>
                <div className="font-bold text-white group-hover:text-indigo-300">Format ASS Styling</div>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  Membawa konfigurasi font {styleConfig.fontFamily} & warna karaoke.
                </p>
              </button>

              <button
                onClick={() => clipsToExport.forEach(handleDownloadCopywriting)}
                className="p-3 rounded-xl border border-neutral-800 bg-[#161822] hover:border-neutral-700 hover:bg-[#1c1f2b] text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-mono text-neutral-400">.TXT</span>
                </div>
                <div className="font-bold text-white group-hover:text-emerald-300">Copywriting Naskah</div>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  Berisi Hook, Caption, dan 7+ Hashtag siap upload.
                </p>
              </button>
            </div>
          </div>

          {/* Backend Video Rendering Status */}
          <div className="pt-3 border-t border-neutral-800/80">
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#161822] border border-neutral-800">
              <Server className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-neutral-200">Video Render Engine (MP4 9:16)</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    GitHub Pages Client Mode
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Di lingkungan web statis GitHub Pages, pemotongan video YouTube dilakukan via embedded player untuk melindungi hak cipta dan batasan CORS browser. 
                  Untuk merender file fisik MP4 1080x1920 dengan FFmpeg binary, jalankan backend server lokal (<code>npm run dev</code>).
                </p>
              </div>
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
