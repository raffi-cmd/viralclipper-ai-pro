'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Download,
  Check,
  Image as ImageIcon,
  Sliders,
  Layers,
  Ratio,
  Type,
  RefreshCw,
  Eye
} from 'lucide-react';
import {
  ThumbnailEngine,
  ThumbnailTheme,
  ThumbnailAspectRatio,
  ThumbnailCandidateFrame,
  GeneratedThumbnailAlternative
} from '@/lib/thumbnail-generator/thumbnail-engine';
import { ViralClip } from '@/lib/types';

interface ThumbnailEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  clip: ViralClip | null;
  videoElement?: HTMLVideoElement | null;
  youtubeId?: string | null;
  onApplyThumbnail: (clipId: string, newThumbnailUrl: string) => void;
}

export const ThumbnailEditorModal: React.FC<ThumbnailEditorModalProps> = ({
  isOpen,
  onClose,
  clip,
  videoElement,
  youtubeId,
  onApplyThumbnail,
}) => {
  const [titleText, setTitleText] = useState('');
  const [theme, setTheme] = useState<ThumbnailTheme>('high_energy');
  const [aspectRatio, setAspectRatio] = useState<ThumbnailAspectRatio>('9:16');
  const [textPosition, setTextPosition] = useState<'top' | 'center' | 'bottom'>('bottom');
  const [accentColor, setAccentColor] = useState('#FFD700');
  const [showBadge, setShowBadge] = useState(true);
  const [badgeText, setBadgeText] = useState('🔥 WAJIB NONTON');

  const [frames, setFrames] = useState<ThumbnailCandidateFrame[]>([]);
  const [selectedFrameUrl, setSelectedFrameUrl] = useState<string>('');
  const [renderedPreviewUrl, setRenderedPreviewUrl] = useState<string>('');
  const [alternatives, setAlternatives] = useState<GeneratedThumbnailAlternative[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'customizer' | 'alternatives'>('customizer');

  // Load and initialize frames when modal opens or clip changes
  useEffect(() => {
    if (!isOpen || !clip) return;

    const detected = ThumbnailEngine.detectTopic(clip.title);
    setTheme(detected);

    // Punchy 3-7 words title
    const punchy = clip.hookHeadline
      .replace(/[🚨😭💔🔥✨😱]/g, '')
      .trim()
      .split(' ')
      .slice(0, 6)
      .join(' ');
    setTitleText(punchy || 'MOMEN TERBAIK');

    // Extract real candidate frames
    ThumbnailEngine.extractClipFrames({
      videoElement,
      youtubeId,
      startSec: clip.startSec,
      durationSec: clip.durationSec,
      topic: detected,
    }).then((extracted) => {
      setFrames(extracted);
      if (extracted.length > 0) {
        setSelectedFrameUrl(extracted[0].imageUrl);
      }
    });
  }, [isOpen, clip?.id]);

  // Re-render composite thumbnail when config changes
  useEffect(() => {
    if (!selectedFrameUrl || !titleText) return;

    ThumbnailEngine.renderCompositeThumbnail({
      titleText,
      theme,
      aspectRatio,
      selectedFrameUrl,
      textPosition,
      accentColor,
      showBadge,
      badgeText,
    }).then((url) => {
      setRenderedPreviewUrl(url);
    });
  }, [titleText, theme, aspectRatio, selectedFrameUrl, textPosition, accentColor, showBadge, badgeText]);

  // Generate 3 unique alternatives
  const handleGenerateAlternatives = async () => {
    setIsGenerating(true);
    try {
      const alts = await ThumbnailEngine.generateThreeAlternatives({
        titleText,
        frames,
        theme,
        aspectRatio,
      });
      setAlternatives(alts);
      setActiveTab('alternatives');
    } catch (err) {
      console.warn('Failed generating alternatives:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Download standalone thumbnail as JPG
  const handleDownloadThumbnail = () => {
    if (!renderedPreviewUrl) return;
    const a = document.createElement('a');
    a.href = renderedPreviewUrl;
    a.download = `thumbnail_${clip?.id || 'clip'}_${aspectRatio.replace(':', 'x')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleApply = () => {
    if (clip && renderedPreviewUrl) {
      onApplyThumbnail(clip.id, renderedPreviewUrl);
      onClose();
    }
  };

  if (!isOpen || !clip) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-3xl border border-neutral-800 bg-[#12141a] p-4 sm:p-6 shadow-2xl text-white my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-lg">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Intelligent Thumbnail Studio</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Topic: {theme.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Buat thumbnail berbasis frame nyata video dengan tipografi bernilai klik tinggi.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Left Preview, Right Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 py-4 flex-1 overflow-y-auto custom-scrollbar">
          {/* Left Column: Live Canvas Preview */}
          <div className="md:col-span-5 flex flex-col items-center justify-center bg-[#090a0f] p-4 rounded-2xl border border-neutral-800/80">
            <div
              className={`relative rounded-2xl overflow-hidden border-2 border-neutral-700 shadow-2xl bg-black flex items-center justify-center transition-all ${
                aspectRatio === '9:16'
                  ? 'w-[230px] aspect-[9/16]'
                  : aspectRatio === '16:9'
                  ? 'w-full max-w-[340px] aspect-video'
                  : 'w-[260px] aspect-square'
              }`}
            >
              {renderedPreviewUrl ? (
                <img
                  src={renderedPreviewUrl}
                  alt="Thumbnail Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-xs text-neutral-500">Memuat pratinjau thumbnail...</div>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2 w-full justify-center">
              <button
                onClick={handleDownloadThumbnail}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center gap-1.5 border border-neutral-700 transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Download JPG
              </button>
              <button
                onClick={handleGenerateAlternatives}
                disabled={isGenerating}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-bold text-xs flex items-center gap-1.5 border border-indigo-500/40 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isGenerating ? 'Membuat 3 Alternatif...' : '3 Alternatif AI'}
              </button>
            </div>
          </div>

          {/* Right Column: Customizer Tabs & Inputs */}
          <div className="md:col-span-7 flex flex-col space-y-4 text-xs">
            {/* View Switcher: Customizer vs 3 Alternatives */}
            <div className="flex bg-[#090a0f] p-1 rounded-xl border border-neutral-800 shrink-0">
              <button
                onClick={() => setActiveTab('customizer')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'customizer'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Kustomisasi Thumbnail
              </button>
              <button
                onClick={() => {
                  if (alternatives.length === 0) handleGenerateAlternatives();
                  else setActiveTab('alternatives');
                }}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'alternatives'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                3 Alternatif Desain
              </button>
            </div>

            {activeTab === 'customizer' ? (
              <div className="space-y-3.5 overflow-y-auto pr-1">
                {/* 1. Pilih Frame Sumber Nyata */}
                <div>
                  <label className="text-neutral-300 font-semibold mb-1.5 block flex items-center justify-between">
                    <span>1. Pilih Frame Sumber Video Nyata</span>
                    <span className="text-neutral-500 font-mono text-[11px]">{frames.length} Frame Tersedia</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {frames.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => setSelectedFrameUrl(f.imageUrl)}
                        className={`relative aspect-video rounded-xl overflow-hidden border cursor-pointer transition-all ${
                          selectedFrameUrl === f.imageUrl
                            ? 'border-indigo-500 ring-2 ring-indigo-500/50'
                            : 'border-neutral-800 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={f.imageUrl} alt={f.label} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 bg-black/80 px-1 py-0.5 rounded text-[9px] font-mono text-white">
                          {f.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Judul Thumbnail & Badge */}
                <div>
                  <label className="text-neutral-300 font-semibold mb-1 block">
                    2. Teks Judul Thumbnail (3-7 Kata Punchy)
                  </label>
                  <input
                    type="text"
                    value={titleText}
                    onChange={(e) => setTitleText(e.target.value)}
                    placeholder="Contoh: AKSI TERLIAR DI TIKUNGAN!"
                    className="w-full px-3 py-2 rounded-xl bg-[#090a0f] border border-neutral-800 focus:border-indigo-500 focus:outline-none text-white font-bold text-xs"
                  />
                </div>

                {/* 3. Preset Tema Visual Sesuai Topik */}
                <div>
                  <label className="text-neutral-300 font-semibold mb-1.5 block">
                    3. Preset Desain Sesuai Topik
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {[
                      { id: 'automotive', label: '🏎️ Otomotif' },
                      { id: 'cinematic', label: '🎬 Cinematic' },
                      { id: 'gaming', label: '🎮 Gaming' },
                      { id: 'podcast', label: '🎙️ Podcast' },
                      { id: 'educational', label: '📚 Edukasi' },
                      { id: 'minimal', label: '✨ Minimal' },
                      { id: 'high_energy', label: '⚡ High Energy' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setTheme(p.id as ThumbnailTheme)}
                        className={`px-2 py-1.5 rounded-lg border font-bold text-xs text-center transition-all ${
                          theme === p.id
                            ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                            : 'border-neutral-800 bg-[#090a0f] text-neutral-400 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Rasio Aspek & Posisi Teks */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-neutral-400 font-semibold mb-1 block">Rasio Output</label>
                    <div className="flex bg-[#090a0f] p-1 rounded-xl border border-neutral-800">
                      {(['9:16', '16:9', '1:1'] as ThumbnailAspectRatio[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => setAspectRatio(r)}
                          className={`flex-1 py-1 rounded-lg font-bold text-xs ${
                            aspectRatio === r ? 'bg-neutral-800 text-white' : 'text-neutral-400'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-neutral-400 font-semibold mb-1 block">Posisi Teks</label>
                    <div className="flex bg-[#090a0f] p-1 rounded-xl border border-neutral-800">
                      {[
                        { id: 'top', label: 'Atas' },
                        { id: 'center', label: 'Tengah' },
                        { id: 'bottom', label: 'Bawah' },
                      ].map((pos) => (
                        <button
                          key={pos.id}
                          onClick={() => setTextPosition(pos.id as any)}
                          className={`flex-1 py-1 rounded-lg font-bold text-xs ${
                            textPosition === pos.id ? 'bg-neutral-800 text-white' : 'text-neutral-400'
                          }`}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* TAB: 3 AI ALTERNATIVES */
              <div className="space-y-3 overflow-y-auto pr-1">
                <p className="text-neutral-400 text-xs">
                  Pilih salah satu dari 3 desain alternatif yang dibuat secara dinamis dengan variasi frame dan gaya penataan:
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {alternatives.map((alt, idx) => (
                    <div
                      key={alt.id}
                      onClick={() => {
                        setRenderedPreviewUrl(alt.previewUrl);
                        setActiveTab('customizer');
                      }}
                      className="p-2 rounded-2xl border border-neutral-800 bg-[#090a0f] hover:border-indigo-500 cursor-pointer transition-all flex flex-col justify-between group"
                    >
                      <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black mb-2">
                        <img src={alt.previewUrl} alt={`Alt ${idx + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute top-1 left-1 bg-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-bold text-white">
                          Opsi #{idx + 1}
                        </span>
                      </div>
                      <button className="w-full py-1 rounded-lg bg-neutral-800 group-hover:bg-indigo-600 text-white font-bold text-[10px] transition-all">
                        Gunakan Opsi Ini
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-800 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-all"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" /> Terapkan ke Klip Ini
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
