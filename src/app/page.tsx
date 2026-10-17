'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Wand2,
  Settings,
  Link2,
  Clock,
  Sparkles,
  Upload,
  Clipboard,
  X,
  Share2,
  Type,
  Flame,
  Film,
  Download,
  Copy,
  Check,
  Video,
  Play,
  Layers,
  AlertCircle,
  Sliders,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import { Sidebar, ActiveNav } from '@/components/Sidebar';
import { StudioPlayer } from '@/components/StudioPlayer';
import { ClipGallery } from '@/components/ClipGallery';
import { ExportModal } from '@/components/ExportModal';
import { ThumbnailEditorModal } from '@/components/ThumbnailEditorModal';
import { MyProjectsView } from '@/components/MyProjectsView';
import { TemplatesView } from '@/components/TemplatesView';
import { SettingsModal } from '@/components/SettingsModal';
import {
  VideoProject,
  ViralClip,
  SubtitleStyleConfig,
  BrandingConfig,
  AISettings,
  SubtitleFont,
  SourceCategory,
  EditingStyle,
  ProcessingJob
} from '@/lib/types';
import { LocalStorageManager } from '@/lib/storage';
import { SourceAdapterRegistry } from '@/lib/source-adapters';
import { IntelligentHighlightDetector } from '@/lib/highlight-engine/highlight-detector';
import { ClientVideoRenderer } from '@/lib/rendering-engine/client-renderer';
import { SubtitleFileExporter } from '@/lib/subtitle-generator';
import { ProcessingJobManager } from '@/lib/job-manager';
import { ThumbnailEngine } from '@/lib/thumbnail-generator/thumbnail-engine';

export default function Dashboard() {
  // Navigation State
  const [activeNav, setActiveNav] = useState<ActiveNav>('studio');

  // Input & Import State
  const [url, setUrl] = useState('https://youtu.be/EodfcT2s9Xo');
  const [sourceCategory, setSourceCategory] = useState<SourceCategory>('youtube');
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const [localVideoFile, setLocalVideoFile] = useState<File | null>(null);

  // Configuration Parameters
  const [clipLength, setClipLength] = useState<30 | 60 | 90>(60);
  const [maxClips, setMaxClips] = useState<number>(5);
  const [editingStyle, setEditingStyle] = useState<EditingStyle>('emotional');

  // Hidden video ref for frame extraction
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);

  // Job & Processing State
  const [jobManager] = useState(() => new ProcessingJobManager());
  const [currentJob, setCurrentJob] = useState<ProcessingJob>({
    id: 'idle',
    status: 'idle',
    progress: 0,
    stepDescription: 'Siap memproses video.',
    canCancel: false,
  });

  // Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AISettings>({
    provider: 'google',
    apiKey: '',
    modelName: 'gemini-1.5-flash',
  });

  // Project & Media State
  const [projectName, setProjectName] = useState<string>('Proyek Video Viral');
  const [sourceEmbedUrl, setSourceEmbedUrl] = useState<string | undefined>(
    'https://www.youtube.com/embed/EodfcT2s9Xo'
  );
  const [youtubeId, setYoutubeId] = useState<string | null>('EodfcT2s9Xo');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80'
  );
  const [totalVideoDurationSec, setTotalVideoDurationSec] = useState<number>(300);
  const [sourceNotice, setSourceNotice] = useState<string | null>(null);

  // Clips State
  const [clips, setClips] = useState<ViralClip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string>('clip_1');

  // Saved Projects
  const [savedProjects, setSavedProjects] = useState<VideoProject[]>([]);
  const [studioTab, setStudioTab] = useState<'subtitles' | 'copywriting' | 'branding'>('subtitles');

  // Subtitle Styling Configuration
  const [styleConfig, setStyleConfig] = useState<SubtitleStyleConfig>({
    fontFamily: 'Montserrat',
    fontSize: 18,
    textColor: '#FFFFFF',
    highlightColor: '#39FF14', // Neon Green Karaoke
    preset: 'hormozi',
    boxStyle: 'pill',
    position: 'bottom',
    letterSpacing: '0.02em',
    uppercase: true,
  });

  // Branding Configuration (Dynamically updated per clip)
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>({
    showHookBanner: true,
    hookBannerText: '',
    showWatermark: true,
    watermarkText: 'ViralClipper',
    watermarkPosition: 'bottom-right',
  });

  // Export Modal & Thumbnail Editor Modal
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [clipsToExport, setClipsToExport] = useState<ViralClip[]>([]);
  const [isThumbnailEditorOpen, setIsThumbnailEditorOpen] = useState(false);
  const [clipToEditThumbnail, setClipToEditThumbnail] = useState<ViralClip | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Subscribe to job manager
  useEffect(() => {
    return jobManager.subscribe((job) => setCurrentJob(job));
  }, [jobManager]);

  // Load Initial Settings & Projects
  useEffect(() => {
    const s = LocalStorageManager.getSettings();
    setSettings(s);
    const projs = LocalStorageManager.getProjects();
    setSavedProjects(projs);

    // Initial highlight detection with proper topic-aware hooks
    IntelligentHighlightDetector.detectHighlights({
      title: 'Aksi Performa Mesin dan Sorotan Video',
      totalDurationSec: totalVideoDurationSec,
      targetClipDurationSec: clipLength,
      editingStyle,
      maxClips,
    }).then((initialClips) => {
      setClips(initialClips);
      if (initialClips.length > 0) {
        setSelectedClipId(initialClips[0].id);
        setBrandingConfig((prev) => ({
          ...prev,
          hookBannerText: initialClips[0].hookHeadline,
        }));
      }
    });
  }, []);

  const activeClip = clips.find((c) => c.id === selectedClipId) || clips[0] || null;

  // Handle URL change & source detection
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setLocalVideoFile(null);
    setLocalVideoUrl(null);

    const validation = SourceAdapterRegistry.validate(newUrl);
    if (validation.isValid) {
      setSourceCategory(validation.category);
      setSourceNotice(null);
      if (validation.category === 'youtube' && validation.normalizedIdentifier) {
        setYoutubeId(validation.normalizedIdentifier);
      } else {
        setYoutubeId(null);
      }
    } else {
      setSourceNotice(validation.errorMessage || null);
    }
  };

  // Handle URL Paste
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleUrlChange(text);
      }
    } catch {
      alert('Gunakan pintasan keyboard Ctrl+V untuk menempelkan tautan.');
    }
  };

  // Handle Local Video Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = SourceAdapterRegistry.validate(file);
    if (!validation.isValid) {
      return alert(validation.errorMessage);
    }

    jobManager.startJob(`upload_${Date.now()}`, 'Membaca metadata berkas video lokal...');
    try {
      const metadata = await SourceAdapterRegistry.getMetadata(file);
      const mediaAccess = await SourceAdapterRegistry.getMediaAccess(file);

      setLocalVideoFile(file);
      setLocalVideoUrl(mediaAccess.mediaStreamUrl || null);
      setSourceCategory('local');
      setYoutubeId(null);
      setProjectName(metadata.title);
      setThumbnailUrl(metadata.thumbnailUrl);
      setTotalVideoDurationSec(metadata.durationSec);
      setSourceNotice('Akses penuh video lokal aktif. Video dapat langsung diputar dan dirender 100% di browser.');

      jobManager.completeJob(`Video lokal "${file.name}" siap diproses!`);
      showToast(`Berkas "${file.name}" (${metadata.durationSec}s) berhasil dimuat!`);
    } catch (err: any) {
      jobManager.failJob(err?.message || 'Gagal membaca berkas video.');
    }
  };

  // Process / Generate Clips Pipeline
  const handleGenerateClips = async () => {
    const inputTarget = sourceCategory === 'local' && localVideoFile ? localVideoFile : url.trim();

    const validation = SourceAdapterRegistry.validate(inputTarget);
    if (!validation.isValid) {
      return alert(validation.errorMessage || 'Tautan atau berkas tidak valid.');
    }

    jobManager.startJob(`job_${Date.now()}`, 'Memvalidasi sumber & mengekstrak metadata video...');

    try {
      // 1. Fetch metadata
      const metadata = await SourceAdapterRegistry.getMetadata(inputTarget);
      setProjectName(metadata.title);
      setThumbnailUrl(metadata.thumbnailUrl);
      setTotalVideoDurationSec(metadata.durationSec);

      // 2. Check media access
      const access = await SourceAdapterRegistry.getMediaAccess(inputTarget, settings.backendServerUrl);
      setSourceEmbedUrl(access.sourceEmbedUrl);

      if (!access.canExtractDirectBytes && !settings.backendServerUrl) {
        setSourceNotice(
          'Catatan: Hosting web statis membatasi streaming raw binary URL online (CORS). Untuk perenderan klip MP4 instan tanpa server, silakan gunakan Upload Video Lokal.'
        );
      } else {
        setSourceNotice(null);
      }

      // 3. Highlight candidate detection across timeline
      jobManager.updateStage('analyzing', 45, `Menganalisis konten video (Gaya: ${editingStyle.toUpperCase()})...`);
      await new Promise((r) => setTimeout(r, 600));

      jobManager.updateStage('ranking', 75, `Menghitung skor viral & ranking klip (Target: ${clipLength}s)...`);

      const detectedClips = await IntelligentHighlightDetector.detectHighlights({
        title: metadata.title,
        totalDurationSec: metadata.durationSec,
        targetClipDurationSec: clipLength,
        editingStyle,
        maxClips,
        aiSettings: settings,
        mediaFile: localVideoFile || undefined,
      });

      // 4. Set thumbnails from real video frames if available
      const topic = ThumbnailEngine.detectTopic(metadata.title);
      for (const c of detectedClips) {
        const frames = await ThumbnailEngine.extractClipFrames({
          videoElement: hiddenVideoRef.current,
          youtubeId,
          startSec: c.startSec,
          durationSec: c.durationSec,
          fallbackImage: metadata.thumbnailUrl,
          topic,
        });
        if (frames.length > 0) {
          (c as any).customThumbnailUrl = frames[0].imageUrl;
        }
      }

      jobManager.updateStage('rendering', 90, 'Menyiapkan canvas & sinkronisasi subtitle karaoke...');
      await new Promise((r) => setTimeout(r, 400));

      jobManager.completeJob(`Selesai! Ditemukan ${detectedClips.length} klip highlight.`);
      setClips(detectedClips);

      if (detectedClips.length > 0) {
        setSelectedClipId(detectedClips[0].id);
        setBrandingConfig((prev) => ({
          ...prev,
          hookBannerText: detectedClips[0].hookHeadline,
        }));
      }

      // Save project
      const newProject: VideoProject = {
        id: `proj_${Date.now()}`,
        name: metadata.title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        sourceCategory,
        sourceType: sourceCategory,
        sourceUrl: typeof inputTarget === 'string' ? inputTarget : undefined,
        localVideoUrl: localVideoUrl || undefined,
        thumbnailUrl: metadata.thumbnailUrl,
        totalDurationSec: metadata.durationSec,
        clipLength,
        maxClips,
        editingStyle,
        highlightFocus: editingStyle,
        clips: detectedClips,
        selectedClipId: detectedClips[0]?.id || 'clip_1',
        styleConfig,
        brandingConfig,
      };
      LocalStorageManager.saveProject(newProject);
      setSavedProjects(LocalStorageManager.getProjects());

      showToast(`${detectedClips.length} klip highlight berhasil ditemukan dengan penilaian AI!`);
    } catch (err: any) {
      jobManager.failJob(err?.message || 'Terjadi kesalahan saat memproses video.');
    }
  };

  // Direct 1-Click Download of Active Clip
  const handleDirectDownloadClip = async (clip: ViralClip) => {
    showToast(`Merender & mengunduh Klip #${clip.rank}...`);

    // 1. Download Subtitle SRT
    const srt = SubtitleFileExporter.generateSRT(clip.subtitles);
    SubtitleFileExporter.downloadBlob(
      srt,
      `${clip.title.slice(0, 25)}_rank${clip.rank}.srt`,
      'text/plain;charset=utf-8'
    );

    // 2. Download Copywriting
    const txt = `=== VIRALCLIPPER AI PRO ===\nKLIP #${clip.rank} (${clip.durationSec}s)\nRENTANG TIMELINE: Detik ${clip.startSec} sampai ${clip.endSec}\n\n[HOOK]\n${clip.hookHeadline}\n\n[CAPTION]\n${clip.copywriting.caption}\n\n[HASHTAGS]\n${clip.copywriting.hashtags.join(' ')}\n`;
    SubtitleFileExporter.downloadBlob(
      txt,
      `${clip.title.slice(0, 25)}_rank${clip.rank}_copywriting.txt`,
      'text/plain;charset=utf-8'
    );

    // 3. Render physical MP4 9:16 Video file
    try {
      const renderResult = await ClientVideoRenderer.renderClip({
        localMediaUrl: localVideoUrl || undefined,
        thumbnailUrl: (clip as any).customThumbnailUrl || thumbnailUrl,
        startSec: clip.startSec,
        durationSec: clip.durationSec,
        hookText: clip.hookHeadline,
        subtitles: clip.subtitles,
        styleConfig,
        brandingConfig,
      });

      // Update clip with rendered video object URL so it immediately plays in Studio Player!
      setClips((prev) =>
        prev.map((c) =>
          c.id === clip.id
            ? { ...c, renderedVideoUrl: renderResult.blobUrl, renderedVideoBlob: renderResult.blob }
            : c
        )
      );

      const a = document.createElement('a');
      a.href = renderResult.blobUrl;
      a.download = renderResult.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showToast(`Video MP4 Klip #${clip.rank} berhasil diunduh!`);
    } catch (e: any) {
      console.warn('Render notice:', e);
    }
  };

  // Apply customized thumbnail from ThumbnailEditorModal
  const handleApplyCustomThumbnail = (clipId: string, newThumbnailUrl: string) => {
    setClips((prev) =>
      prev.map((c) => (c.id === clipId ? { ...c, customThumbnailUrl: newThumbnailUrl } : c))
    );
    showToast('Thumbnail klip berhasil diperbarui!');
  };

  const isJobActive =
    currentJob.status !== 'idle' &&
    currentJob.status !== 'completed' &&
    currentJob.status !== 'failed' &&
    currentJob.status !== 'cancelled';

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen w-screen bg-[#090a0d] text-neutral-100 font-sans select-none overflow-x-hidden">
      {/* Hidden video element for local video frame capture */}
      {localVideoUrl && (
        <video
          ref={hiddenVideoRef}
          src={localVideoUrl}
          className="hidden"
          preload="auto"
          muted
          playsInline
        />
      )}

      {/* 1. LEFT SIDEBAR */}
      <Sidebar
        activeNav={activeNav}
        onNavigate={(nav) => {
          if (nav === 'settings') {
            setIsSettingsOpen(true);
          } else {
            setActiveNav(nav);
          }
        }}
        savedProjectsCount={savedProjects.length}
        savedClipsCount={clips.length}
      />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full lg:overflow-y-auto custom-scrollbar">
        {/* Top Header */}
        <header className="h-14 border-b border-neutral-800/80 bg-[#0f1117]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2 pl-10 lg:pl-0 text-xs">
            <span className="font-bold text-white line-clamp-1 max-w-xs sm:max-w-md">
              {projectName}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              {clips.length} Klip Siap
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-[#141620] hover:bg-neutral-800 text-xs font-semibold text-neutral-300 transition-all"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Engine:</span> {settings.provider}
            </button>
          </div>
        </header>

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 p-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
            <Check className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* VIEW: MY PROJECTS */}
        {activeNav === 'projects' && (
          <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
            <MyProjectsView
              projects={savedProjects}
              onLoadProject={(p) => {
                setProjectName(p.name);
                setUrl(p.sourceUrl || '');
                setSourceCategory(p.sourceCategory || 'youtube');
                setThumbnailUrl(p.thumbnailUrl);
                setClips(p.clips);
                setSelectedClipId(p.selectedClipId);
                setStyleConfig(p.styleConfig);
                setBrandingConfig(p.brandingConfig);
                setEditingStyle(p.editingStyle || 'emotional');
                setMaxClips(p.maxClips || 5);
                setActiveNav('studio');
              }}
              onDeleteProject={(id) => {
                LocalStorageManager.deleteProject(id);
                setSavedProjects(LocalStorageManager.getProjects());
              }}
              onNewProject={() => setActiveNav('studio')}
            />
          </div>
        )}

        {/* VIEW: SUBTITLE TEMPLATES */}
        {activeNav === 'templates' && (
          <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
            <TemplatesView
              activePreset={styleConfig.preset}
              onApplyTemplate={(tpl) => {
                setStyleConfig((prev) => ({ ...prev, ...tpl }));
                setActiveNav('studio');
                showToast('Preset subtitle diterapkan.');
              }}
            />
          </div>
        )}

        {/* VIEW: MY CLIPS GALLERY */}
        {activeNav === 'clips' && (
          <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Film className="w-5 h-5 text-indigo-400" />
                  Koleksi Klip Aktif ({clips.length} Klip Tersedia)
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Pratinjau, edit thumbnail, dan unduh klip video yang telah dihasilkan dari proyek saat ini.
                </p>
              </div>
              <button
                onClick={() => setActiveNav('studio')}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                Buka di Studio Editor
              </button>
            </div>

            <ClipGallery
              clips={clips}
              selectedClipId={selectedClipId}
              defaultThumbnailUrl={thumbnailUrl}
              sourceCategory={sourceCategory}
              onSelectClip={(id) => {
                setSelectedClipId(id);
                setActiveNav('studio');
              }}
              onToggleClipSelection={(id) => {
                setClips((prev) =>
                  prev.map((c) => (c.id === id ? { ...c, isSelected: !c.isSelected } : c))
                );
              }}
              onExportSelected={(selected) => {
                setClipsToExport(selected);
                setIsExportOpen(true);
              }}
              onDirectDownloadClip={handleDirectDownloadClip}
              onOpenThumbnailEditorForClip={(clip) => {
                setClipToEditThumbnail(clip);
                setIsThumbnailEditorOpen(true);
              }}
            />
          </div>
        )}

        {/* VIEW: VIDEO STUDIO & EDITOR */}
        {activeNav === 'studio' && (
          <div className="p-3 sm:p-5 space-y-4 sm:space-y-5 max-w-7xl mx-auto w-full">
            {/* Input & Parameters Control Bar */}
            <div className="bg-[#12141a] border border-neutral-800/80 rounded-2xl p-3 sm:p-4 shadow-xl space-y-3">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
                {/* Source Input */}
                <div className="flex-1 w-full flex items-center gap-2">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      placeholder="Tempel tautan YouTube, TikTok, atau Instagram Reel..."
                      className="w-full pl-9 pr-16 py-2 rounded-xl bg-[#0a0b0e] border border-neutral-800 focus:border-indigo-500 focus:outline-none text-xs text-white placeholder-neutral-500"
                    />
                    <button
                      onClick={handlePasteClipboard}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[10px] font-bold text-neutral-300"
                      title="Paste link dari clipboard"
                    >
                      Paste
                    </button>
                  </div>

                  {/* Local Video Upload Option */}
                  <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-800 bg-[#0a0b0e] hover:bg-neutral-800/80 text-xs font-semibold text-neutral-300 cursor-pointer transition-all shrink-0">
                    <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">Upload Video Lokal</span>
                    <span className="sm:hidden">Upload</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Duration, Style & Clip Count Controls */}
                <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2.5 w-full lg:w-auto">
                  {/* Clip Duration Preset */}
                  <div className="flex items-center bg-[#0a0b0e] p-1 rounded-xl border border-neutral-800 text-xs">
                    <span className="text-[11px] text-neutral-400 px-2 font-medium">Durasi:</span>
                    {([30, 60, 90] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setClipLength(d)}
                        className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                          clipLength === d
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {d}s
                      </button>
                    ))}
                  </div>

                  {/* Editing Style Selector */}
                  <div className="flex items-center bg-[#0a0b0e] p-1 rounded-xl border border-neutral-800 text-xs">
                    <span className="text-[11px] text-neutral-400 px-2 font-medium">Gaya:</span>
                    <select
                      value={editingStyle}
                      onChange={(e) => setEditingStyle(e.target.value as EditingStyle)}
                      className="bg-transparent text-xs text-white focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="emotional" className="bg-[#12141a]">Emotional (Haru & Cerita)</option>
                      <option value="high_energy" className="bg-[#12141a]">High Energy (Aksi Cepat)</option>
                      <option value="curiosity" className="bg-[#12141a]">Curiosity (Penuh Tanya)</option>
                    </select>
                  </div>

                  {/* Max Clips Selector (1 - 10) */}
                  <div className="flex items-center bg-[#0a0b0e] p-1 rounded-xl border border-neutral-800 text-xs">
                    <span className="text-[11px] text-neutral-400 px-2 font-medium">Maks Klip:</span>
                    <select
                      value={maxClips}
                      onChange={(e) => setMaxClips(parseInt(e.target.value, 10))}
                      className="bg-transparent text-xs text-white focus:outline-none cursor-pointer pr-1"
                    >
                      {[3, 5, 8, 10].map((n) => (
                        <option key={n} value={n} className="bg-[#12141a]">
                          {n} Klip
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* AI Auto-Cut Button */}
                  <button
                    onClick={handleGenerateClips}
                    disabled={isJobActive}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      isJobActive
                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:brightness-110 text-white shadow-lg shadow-indigo-600/25 active:scale-[0.98]'
                    }`}
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    {isJobActive ? 'Menganalisis...' : `AI Auto-Cut ${maxClips} Klip`}
                  </button>
                </div>
              </div>

              {/* Source Notice / Capability Guidance */}
              {sourceNotice && (
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-indigo-400" />
                  <span>{sourceNotice}</span>
                </div>
              )}

              {/* Asynchronous Job Progress Tracker */}
              {isJobActive && (
                <div className="mt-2 pt-2 border-t border-neutral-800/80">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                      <span className="font-semibold text-white">{currentJob.stepDescription}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-indigo-400 font-bold">{currentJob.progress}%</span>
                      {currentJob.canCancel && (
                        <button
                          onClick={() => jobManager.cancelJob()}
                          className="text-[10px] text-red-400 hover:text-red-300 underline"
                        >
                          Batalkan
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${currentJob.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3-Column Studio Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
              {/* Kolom 1: Ranked Clips List */}
              <div className="lg:col-span-3 flex flex-col gap-2 bg-[#12141a] border border-neutral-800/80 rounded-2xl p-3.5 max-h-[500px] lg:h-[640px]">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-indigo-400" />
                    Kandidat Klip ({clips.length})
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">Diferensiasi Skor</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {clips.map((clip) => {
                    const isSelected = selectedClipId === clip.id;
                    return (
                      <div
                        key={clip.id}
                        onClick={() => {
                          setSelectedClipId(clip.id);
                          setBrandingConfig((prev) => ({
                            ...prev,
                            hookBannerText: clip.hookHeadline,
                          }));
                        }}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500/10 shadow-md ring-1 ring-indigo-500/50'
                            : 'border-neutral-800/80 bg-[#161822] hover:border-neutral-700 hover:bg-[#1a1c28]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                              clip.rank === 1
                                ? 'bg-amber-400 text-black'
                                : clip.rank === 2
                                ? 'bg-neutral-200 text-black'
                                : 'bg-neutral-800 text-neutral-300'
                            }`}
                          >
                            RANK #{clip.rank}
                          </span>

                          <span className="flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            <Flame className="w-2.5 h-2.5 fill-emerald-400" />
                            {clip.viralScore}%
                          </span>
                        </div>

                        <h6 className="font-bold text-xs text-white line-clamp-1 mb-1">
                          {clip.title}
                        </h6>

                        <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed mb-2">
                          {clip.reasonWhyViral}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-neutral-500 border-t border-neutral-800/80 pt-1.5">
                          <span className="font-mono text-indigo-400">
                            ⏱️ {Math.floor(clip.startSec / 60)}:{String(clip.startSec % 60).padStart(2, '0')} - {Math.floor(clip.endSec / 60)}:{String(clip.endSec % 60).padStart(2, '0')}
                          </span>
                          <span className={isSelected ? 'text-indigo-400 font-bold' : 'text-neutral-500'}>
                            {isSelected ? '● Aktif' : 'Pilih'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    setClipsToExport(clips);
                    setIsExportOpen(true);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-neutral-700 transition-all shrink-0"
                >
                  <Download className="w-3.5 h-3.5" /> Download All ({clips.length})
                </button>
              </div>

              {/* Kolom 2: Studio Player 9:16 (Native Rendered Clip Player) */}
              <div className="lg:col-span-5 flex justify-center">
                <StudioPlayer
                  clip={activeClip}
                  sourceCategory={sourceCategory}
                  sourceEmbedUrl={sourceEmbedUrl}
                  sourceThumbnailUrl={(activeClip as any)?.customThumbnailUrl || thumbnailUrl}
                  localVideoUrl={localVideoUrl}
                  styleConfig={styleConfig}
                  brandingConfig={brandingConfig}
                  onDownloadClip={handleDirectDownloadClip}
                  onOpenExportModal={() => {
                    if (activeClip) {
                      setClipsToExport([activeClip]);
                      setIsExportOpen(true);
                    }
                  }}
                  onOpenThumbnailEditor={() => {
                    if (activeClip) {
                      setClipToEditThumbnail(activeClip);
                      setIsThumbnailEditorOpen(true);
                    }
                  }}
                />
              </div>

              {/* Kolom 3: Studio Editor Controls */}
              <div className="lg:col-span-4 flex flex-col bg-[#12141a] border border-neutral-800/80 rounded-2xl p-4 max-h-[500px] lg:h-[640px]">
                {/* Tabs */}
                <div className="flex bg-[#0a0b0e] p-1 rounded-xl border border-neutral-800 mb-3.5 shrink-0">
                  {[
                    { key: 'subtitles', label: 'Subtitle', icon: Type },
                    { key: 'copywriting', label: 'Naskah', icon: Share2 },
                    { key: 'branding', label: 'Branding', icon: Sparkles },
                  ].map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.key}
                        onClick={() => setStudioTab(t.key as any)}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          studioTab === t.key
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>

                {/* TAB: SUBTITLES */}
                {studioTab === 'subtitles' && (
                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs custom-scrollbar">
                    <div>
                      <label className="text-neutral-400 font-semibold mb-1.5 block">
                        Bentuk Kotak Subtitle
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'pill', name: 'Rounded Pill (Populer)' },
                          { id: 'card', name: 'Solid Card Box' },
                          { id: 'glow', name: 'Neon Glow Frame' },
                          { id: 'minimal', name: 'Clean Transparent' },
                        ].map((b) => (
                          <button
                            key={b.id}
                            onClick={() =>
                              setStyleConfig((prev) => ({ ...prev, boxStyle: b.id as any }))
                            }
                            className={`p-2 rounded-xl border font-bold text-left transition-all ${
                              styleConfig.boxStyle === b.id
                                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                                : 'border-neutral-800 bg-[#161822] text-neutral-400 hover:text-white'
                            }`}
                          >
                            {b.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-neutral-400 font-semibold mb-1.5 block flex items-center justify-between">
                        <span>Pilihan Font Subtitle</span>
                        <span className="text-indigo-400 font-mono">{styleConfig.fontFamily}</span>
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['Montserrat', 'Impact', 'Inter', 'Arial Black', 'Comic Sans MS'] as SubtitleFont[]).map(
                          (f) => (
                            <button
                              key={f}
                              onClick={() => setStyleConfig((prev) => ({ ...prev, fontFamily: f }))}
                              style={{ fontFamily: f }}
                              className={`p-2 rounded-lg border text-xs font-bold transition-all truncate text-center ${
                                styleConfig.fontFamily === f
                                  ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                                  : 'border-neutral-800 bg-[#161822] text-neutral-400 hover:text-white'
                              }`}
                            >
                              {f}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-neutral-400 font-semibold mb-1.5 block">
                        Warna Kata Aktif (Karaoke Highlight)
                      </label>
                      <div className="flex gap-2">
                        {[
                          { name: 'Neon Green', color: '#39FF14' },
                          { name: 'Hormozi Gold', color: '#FFD700' },
                          { name: 'Cyan Glow', color: '#00FFFF' },
                          { name: 'Viral Red', color: '#FF3B30' },
                          { name: 'Pure White', color: '#FFFFFF' },
                        ].map((c) => (
                          <button
                            key={c.color}
                            onClick={() =>
                              setStyleConfig((prev) => ({ ...prev, highlightColor: c.color }))
                            }
                            className={`flex-1 flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all ${
                              styleConfig.highlightColor === c.color
                                ? 'border-white bg-neutral-800'
                                : 'border-neutral-800 bg-[#161822]'
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-neutral-400 font-semibold mb-1">
                        <span>Ukuran Font Subtitle</span>
                        <span className="text-white font-mono">{styleConfig.fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="14"
                        max="26"
                        value={styleConfig.fontSize}
                        onChange={(e) =>
                          setStyleConfig((prev) => ({ ...prev, fontSize: parseInt(e.target.value) }))
                        }
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* TAB: COPYWRITING */}
                {studioTab === 'copywriting' && activeClip && (
                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs custom-scrollbar">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                      <span className="font-bold text-white">Naskah Klip #{activeClip.rank}</span>
                      <button
                        onClick={() => {
                          const text = `${activeClip.copywriting.hookHeadline}\n\n${activeClip.copywriting.caption}\n\n${activeClip.copywriting.hashtags.join(' ')}`;
                          navigator.clipboard.writeText(text);
                          setCopiedCaption(true);
                          setTimeout(() => setCopiedCaption(false), 2000);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold transition-all"
                      >
                        {copiedCaption ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedCaption ? 'Tersalin!' : 'Salin Semua'}
                      </button>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Hook Headline</span>
                      <p className="font-bold text-white text-xs mt-0.5">{activeClip.copywriting.hookHeadline}</p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Caption Siap Upload</span>
                      <p className="text-neutral-300 text-xs mt-0.5 whitespace-pre-line leading-relaxed bg-[#0a0b0e] p-2.5 rounded-xl border border-neutral-800">
                        {activeClip.copywriting.caption}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Hashtags Viral</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {activeClip.copywriting.hashtags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-[11px]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: BRANDING */}
                {studioTab === 'branding' && (
                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs custom-scrollbar">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-neutral-400 font-semibold">Hook Banner (Detik Awal)</label>
                        <input
                          type="checkbox"
                          checked={brandingConfig.showHookBanner}
                          onChange={(e) =>
                            setBrandingConfig((prev) => ({ ...prev, showHookBanner: e.target.checked }))
                          }
                          className="accent-indigo-500"
                        />
                      </div>
                      <input
                        type="text"
                        value={brandingConfig.hookBannerText}
                        onChange={(e) =>
                          setBrandingConfig((prev) => ({ ...prev, hookBannerText: e.target.value }))
                        }
                        placeholder="Contoh: Tonton Sampai Habis!"
                        className="w-full px-3 py-2 rounded-xl bg-[#0a0b0e] border border-neutral-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-neutral-400 font-semibold">Watermark Username</label>
                        <input
                          type="checkbox"
                          checked={brandingConfig.showWatermark}
                          onChange={(e) =>
                            setBrandingConfig((prev) => ({ ...prev, showWatermark: e.target.checked }))
                          }
                          className="accent-indigo-500"
                        />
                      </div>
                      <input
                        type="text"
                        value={brandingConfig.watermarkText}
                        onChange={(e) =>
                          setBrandingConfig((prev) => ({ ...prev, watermarkText: e.target.value }))
                        }
                        placeholder="Username tanpa @"
                        className="w-full px-3 py-2 rounded-xl bg-[#0a0b0e] border border-neutral-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. GALERI VIDEO 9:16 DI BAWAH */}
            <ClipGallery
              clips={clips}
              selectedClipId={selectedClipId}
              defaultThumbnailUrl={thumbnailUrl}
              sourceCategory={sourceCategory}
              onSelectClip={(id) => {
                setSelectedClipId(id);
                const target = clips.find((c) => c.id === id);
                if (target) {
                  setBrandingConfig((prev) => ({
                    ...prev,
                    hookBannerText: target.hookHeadline,
                  }));
                }
                window.scrollTo({ top: 120, behavior: 'smooth' });
              }}
              onToggleClipSelection={(id) => {
                setClips((prev) =>
                  prev.map((c) => (c.id === id ? { ...c, isSelected: !c.isSelected } : c))
                );
              }}
              onExportSelected={(selected) => {
                setClipsToExport(selected);
                setIsExportOpen(true);
              }}
              onDirectDownloadClip={handleDirectDownloadClip}
              onOpenThumbnailEditorForClip={(clip) => {
                setClipToEditThumbnail(clip);
                setIsThumbnailEditorOpen(true);
              }}
            />
          </div>
        )}
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        clipsToExport={clipsToExport}
        styleConfig={styleConfig}
        brandingConfig={brandingConfig}
        thumbnailUrl={thumbnailUrl}
        localMediaUrl={localVideoUrl || undefined}
      />

      {/* Thumbnail Editor Modal */}
      <ThumbnailEditorModal
        isOpen={isThumbnailEditorOpen}
        onClose={() => setIsThumbnailEditorOpen(false)}
        clip={clipToEditThumbnail}
        videoElement={hiddenVideoRef.current}
        youtubeId={youtubeId}
        onApplyThumbnail={handleApplyCustomThumbnail}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(updated) => {
          setSettings(updated);
          LocalStorageManager.saveSettings(updated);
          showToast('Pengaturan AI & Backend berhasil disimpan.');
        }}
        currentSettings={settings}
      />
    </div>
  );
}
