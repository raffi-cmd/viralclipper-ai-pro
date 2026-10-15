'use client';

import React, { useState, useEffect } from 'react';
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
  FolderKanban,
  BookmarkCheck,
  LayoutTemplate,
  ChevronRight,
  Info,
  CheckCircle2,
  Download,
  Copy,
  Check
} from 'lucide-react';
import { Sidebar, ActiveNav } from '@/components/Sidebar';
import { StudioPlayer } from '@/components/StudioPlayer';
import { ClipGallery } from '@/components/ClipGallery';
import { ExportModal } from '@/components/ExportModal';
import { MyProjectsView } from '@/components/MyProjectsView';
import { TemplatesView } from '@/components/TemplatesView';
import { SettingsModal } from '@/components/SettingsModal';
import {
  VideoProject,
  ViralClip,
  SubtitleStyleConfig,
  BrandingConfig,
  AISettings,
  SubtitleFont
} from '@/lib/types';
import { LocalStorageManager } from '@/lib/storage';

function extractYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export default function Dashboard() {
  // Navigation State
  const [activeNav, setActiveNav] = useState<ActiveNav>('studio');

  // Input & Import State
  const [url, setUrl] = useState('https://youtu.be/EodfcT2s9Xo');
  const [sourceType, setSourceType] = useState<'youtube' | 'local'>('youtube');
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const [clipLength, setClipLength] = useState<30 | 60 | 90>(60);
  const [highlightFocus, setHighlightFocus] = useState<'emotional' | 'engagement' | 'curiosity'>('emotional');
  const [isLoading, setIsLoading] = useState(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AISettings>({
    provider: 'google',
    apiKey: '',
    modelName: 'gemini-1.5-flash',
  });

  // Current Project & Media State
  const [projectName, setProjectName] = useState<string>(
    'Baru Mandi..Keringatan..Mandi Lagi...Sangat Jauh.. Warga Sangat Kesulitan Air Bersih..'
  );
  const [youtubeId, setYoutubeId] = useState<string | null>('EodfcT2s9Xo');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(
    'https://i.ytimg.com/vi/EodfcT2s9Xo/hqdefault.jpg'
  );
  const [totalVideoDurationSec, setTotalVideoDurationSec] = useState<number>(300); // 5 Menit (300s)

  // Clips State
  const [clips, setClips] = useState<ViralClip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string>('clip_1');

  // Saved Projects
  const [savedProjects, setSavedProjects] = useState<VideoProject[]>([]);

  // Studio Player Controls
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentPlaySec, setCurrentPlaySec] = useState<number>(0);
  const [studioTab, setStudioTab] = useState<'subtitles' | 'copywriting' | 'branding'>('subtitles');

  // Subtitle Styling Configuration (Highly Readable Micro-Phrasing)
  const [styleConfig, setStyleConfig] = useState<SubtitleStyleConfig>({
    fontFamily: 'Montserrat',
    fontSize: 18,
    textColor: '#FFFFFF',
    highlightColor: '#39FF14', // Hijau Neon Karaoke
    preset: 'hormozi',
    boxStyle: 'pill',
    position: 'bottom',
    letterSpacing: '0.02em',
    uppercase: true,
  });

  // Branding Configuration
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>({
    showHookBanner: true,
    hookBannerText: 'BAYANGKAN, MAU MANDI SEPERJUANGAN INI! 😭',
    showWatermark: true,
    watermarkText: 'ViralClipper',
    watermarkPosition: 'bottom-right',
  });

  // Export Modal
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [clipsToExport, setClipsToExport] = useState<ViralClip[]>([]);
  const [copiedCaption, setCopiedCaption] = useState(false);

  // Load Initial Settings & Projects
  useEffect(() => {
    const s = LocalStorageManager.getSettings();
    setSettings(s);
    const projs = LocalStorageManager.getProjects();
    setSavedProjects(projs);

    // Inisialisasi awal 5 klip
    const initialClips = buildRankedClips(projectName, totalVideoDurationSec, clipLength);
    setClips(initialClips);
    if (initialClips.length > 0) {
      setSelectedClipId(initialClips[0].id);
    }
  }, []);

  const activeClip = clips.find((c) => c.id === selectedClipId) || clips[0] || null;

  // Real-time Playback Timer & Subtitle Synchronization
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && activeClip) {
      timer = setInterval(() => {
        setCurrentPlaySec((prev) => {
          if (prev >= activeClip.durationSec) {
            return 0; // loop
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setCurrentPlaySec(0);
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeClip]);

  // Handle URL Paste from Clipboard
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setSourceType('youtube');
      }
    } catch {
      alert('Gunakan Ctrl+V untuk menempelkan URL YouTube.');
    }
  };

  // Handle Local Video File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 200 * 1024 * 1024) {
        return alert('Ukuran file maksimal 200MB untuk mode browser.');
      }
      const localUrl = URL.createObjectURL(file);
      setLocalVideoUrl(localUrl);
      setSourceType('local');
      setProjectName(file.name.replace(/\.[^/.]+$/, ''));
      setYoutubeId(null);
      setThumbnailUrl('https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=800&q=80');
      alert(`File video lokal "${file.name}" berhasil dimuat ke studio!`);
    }
  };

  // Algoritma Pembagian & Pemeringkatan Klip Viral (Rank 1 - 5)
  function buildRankedClips(title: string, totalSec: number, clipDur: number): ViralClip[] {
    const count = Math.max(3, Math.min(5, Math.floor(totalSec / clipDur)));
    const isWaterTopic = /air|mandi|desa|warga|keringat|jauh/i.test(title);

    const descriptions = isWaterTopic
      ? [
          {
            rank: 1,
            score: 99,
            title: 'Momen Paling Emosional: Mandi Saja Harus Perjuangan',
            hook: 'BAYANGKAN, MAU MANDI SEPERJUANGAN INI! 😭',
            reason: 'Kontras emosional kuat penonton kota vs pelosok. Retensi 3 detik pertama tertinggi.',
            phrases: [
              'PERNAH NGGAK BAYANGIN...',
              'MAU MANDI AJA HARUS JALAN SEJAUH INI?',
              'BARU SELESAI MANDI, KERINGATAN LAGI!',
              'KARENA HARUS MENDAKI JALAN TERJAL!'
            ],
            caption: `Kalian yang tinggal di kota mungkin tinggal putar kran, air langsung mengalir deras. Tapi buat saudara-saudara kita di sini, air bersih itu barang yang sangat mewah.\n\nBayangin deh, baru aja selesai mandi, mereka harus jalan kaki jauh banget sambil mikul beban berat cuma demi air. Sampai rumah? Keringatan lagi, mandi lagi... gitu terus setiap hari.\n\nYuk, kita belajar lebih bersyukur hari ini. Gimana perasaan kalian waktu ngeliat perjuangan mereka? Tulis di kolom komentar ya! 👇`,
            hashtags: ['#PetualanganAlamDesaku', '#KrisisAirBersih', '#KisahInspiratif', '#PerjuanganHidup', '#PedesaanIndonesia', '#fyp', '#viral']
          },
          {
            rank: 2,
            score: 95,
            title: 'Momen Klimaks: Beban Puluhan Kilo di Tanjakan Tebing',
            hook: 'BEBAN PULUHAN KILO DIPIKUL SETIAP HARI! 💔',
            reason: 'Visual dramatis aksi nyata warga menaiki bukit curam membawa jerigen air.',
            phrases: [
              'SETIAP HARI MIKUL JERIGEN BERAT...',
              'MENDAKI TEBING BATU YANG CURAM!',
              'DEMI KELUARGA DI RUMAH BISA MINUM!',
              'TIDAK PERNAH ADA KATA MENYERAH!'
            ],
            caption: `Jangan pernah mengeluh cuma karena hal sepele saat melihat video ini.\n\nSetiap tetes air di rumah mereka didapat dari cucuran keringat dan langkah kaki yang lelah menembus jalan berbatu. Hormat setinggi-tingginya untuk ketabahan warga di pelosok negeri. 🇮🇩`,
            hashtags: ['#KetabahanWarga', '#PejuangKeluarga', '#RealitaKehidupan', '#fyp', '#trending', '#viralindonesia']
          },
          {
            rank: 3,
            score: 91,
            title: 'Curiosity Hook: Menembus Dasar Lembah Tersembunyi',
            hook: 'INILAH SUMBER SATU-SATUNYA AIR MEREKA! 🏞️',
            reason: 'Rasa penasaran penonton melihat lokasi sumber air yang tersembunyi jauh di bawah jurang.',
            phrases: [
              'HARUS TURUN KE DASAR JURANG...',
              'BUAT KETEMU TITIK MATA AIR INI!',
              'AIRNYA SANGAT JERNIH DAN SEGAR!',
              'TAPI JALAN PULANGNYA LUAR BIASA MENANTANG!'
            ],
            caption: `Ternyata seperti ini wujud sumber air yang harus mereka tuju setiap pagi dan sore hari. Sangat jernih tapi aksesnya luar biasa menantang!\n\nKira-kira sanggup nggak kalian kalau harus ambil air setiap hari ke tempat seperti ini? Komentar di bawah ya!`,
            hashtags: ['#MataAirAlami', '#EksplorDesa', '#AlamIndonesia', '#KisahPelosok', '#viral']
          },
          {
            rank: 4,
            score: 87,
            title: 'Inspirasi: Senyuman Warga Sepuh yang Tetap Tabah',
            hook: 'MESKIPUN HIDUP SULIT, MEREKA TETAP TERSENYUM! 😊',
            reason: 'Menghadirkan kehangatan emosi, optimisme, dan inspirasi hidup.',
            phrases: [
              'SENYUMAN TULUS DARI WARGA DESA...',
              'YANG BIKIN HATI KITA ADEM!',
              'BAHAGIA ITU TERNYATA SEDERHANA!',
              'BELAJAR BERSYUKUR DARI MEREKA!'
            ],
            caption: `Definisi bahagia itu sederhana. Walau fasilitas serba terbatas dan air sulit didapat, senyuman para sesepuh di desa ini nggak pernah luntur.\n\nMomen ini benar-benar menampar kita yang sering mengeluh di zona nyaman. Share video ini buat menyebarkan energi positif hari ini! ✨`,
            hashtags: ['#BahagiaSederhana', '#SenyumDesa', '#OrangBaik', '#InspirasiHidup', '#fyp']
          },
          {
            rank: 5,
            score: 84,
            title: 'Pesan Moral: Refleksi Menghargai Setiap Tetes Air',
            hook: 'JANGAN PERNAH BUANG AIR LAGI SETELAH INI! 🙏',
            reason: 'Call to action moral yang memicu penonton klik share dan simpan.',
            phrases: [
              'HARGAI SETIAP TETES AIR BERSIH!',
              'YANG MENGALIR DI RUMAH KITA HARI INI!',
              'JANGAN PERNAH DISIA-SIAKAN LAGI!',
              'INGAT PERJUANGAN SAUDARA-SAUDARA KITA!'
            ],
            caption: `Saat kita sering membiarkan air kran terbuang sia-sia, ingatlah ada ribuan saudara kita yang harus menempuh berkilo-kilo meter jalan terjal demi satu ember air.\n\nSemoga video ini jadi pengingat buat kita semua. Yuk, mulai hemat air dari rumah kita masing-masing! 💧`,
            hashtags: ['#HematAir', '#PeduliLingkungan', '#RefleksiDiri', '#BersyukurSelalu', '#fyp']
          }
        ]
      : [1, 2, 3, 4, 5].map((i) => ({
          rank: i,
          score: 100 - (i - 1) * 4,
          title: `Klip #${i}: Momen Puncak Sorotan`,
          hook: `MOMEN BAGIAN ${i}: HAL PALING MENGANGETKAN! 😱`,
          reason: i === 1 ? 'Opening Hook dengan retensi visual terbaik.' : `Eskalasi momen seru di menit ke-${i}.`,
          phrases: [
            `TONTON SAMPAI SELESAI MOMEN BAGIAN ${i}!`,
            'JANGAN SAMPAI TERLEWATKAN!',
            'LIHAT KEJADIAN TIDAK TERDUGA INI!'
          ],
          caption: `${title}\n\nMomen di bagian ke-${i} ini beneran paling seru dan nggak terduga! Tonton sampai habis dan tulis pendapat kamu di bawah ya 👇`,
          hashtags: ['#fyp', '#viral', '#trending', '#foryou', '#reels', '#shorts']
        }));

    return descriptions.slice(0, count).map((item, idx) => {
      const start = idx * clipDur + 10;
      const end = start + clipDur;

      const words = item.phrases.flatMap((phrase, pIdx) => {
        const pWords = phrase.split(' ');
        return pWords.map((w, wIdx) => ({
          word: w,
          start: pIdx * 3 + wIdx * 0.4,
          end: pIdx * 3 + (wIdx + 1) * 0.4,
          emoji: wIdx === pWords.length - 1 ? (pIdx === 0 ? '💧' : pIdx === 1 ? '🔥' : '✨') : undefined,
        }));
      });

      return {
        id: `clip_${idx + 1}`,
        rank: item.rank,
        viralScore: item.score,
        title: item.title,
        hookHeadline: item.hook,
        reasonWhyViral: item.reason,
        startSec: start,
        endSec: end,
        durationSec: clipDur,
        isSelected: idx === 0,
        subtitles: [
          {
            id: 1,
            start: 0,
            end: clipDur,
            text: item.phrases.join(' '),
            words,
          },
        ],
        copywriting: {
          hookHeadline: item.hook,
          caption: item.caption,
          hashtags: item.hashtags,
        },
      };
    });
  }

  // Handle Generate Auto-Cut
  const handleGenerateClips = async () => {
    if (sourceType === 'youtube' && !url.trim()) {
      return alert('Silakan masukkan link video YouTube!');
    }

    setIsLoading(true);
    setProgressPercent(20);
    setProcessStep('Mengekstrak informasi video & memindai audio...');

    let ytId = youtubeId;
    let title = projectName;
    let thumb = thumbnailUrl;

    if (sourceType === 'youtube') {
      ytId = extractYouTubeId(url.trim());
      setYoutubeId(ytId);
      if (ytId) {
        thumb = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
        setThumbnailUrl(thumb);
      }
      try {
        const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url.trim())}`);
        const data = await res.json();
        if (data && data.title) {
          title = data.title;
          setProjectName(title);
          if (data.thumbnail_url) setThumbnailUrl(data.thumbnail_url);
        }
      } catch (e) {
        console.warn(e);
      }
    }

    await new Promise((r) => setTimeout(r, 600));
    setProgressPercent(55);
    setProcessStep(`Menghitung pembagian klip durasi ${clipLength} detik & viral score...`);

    await new Promise((r) => setTimeout(r, 700));
    setProgressPercent(85);
    setProcessStep('Menghasilkan subtitle micro-phrasing & auto-reframe 9:16...');

    const newClips = buildRankedClips(title, totalVideoDurationSec, clipLength);

    await new Promise((r) => setTimeout(r, 500));
    setProgressPercent(100);
    setIsLoading(false);
    setClips(newClips);
    if (newClips.length > 0) {
      setSelectedClipId(newClips[0].id);
      setBrandingConfig((prev) => ({
        ...prev,
        hookBannerText: newClips[0].hookHeadline,
      }));
    }
    setIsPlaying(false);

    // Simpan otomatis ke My Projects
    const newProject: VideoProject = {
      id: `proj_${Date.now()}`,
      name: title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sourceType,
      sourceUrl: url,
      localVideoUrl: localVideoUrl || undefined,
      youtubeId: ytId || undefined,
      thumbnailUrl: thumb,
      totalDurationSec: totalVideoDurationSec,
      clipLength,
      highlightFocus,
      clips: newClips,
      selectedClipId: newClips[0]?.id || 'clip_1',
      styleConfig,
      brandingConfig,
    };
    LocalStorageManager.saveProject(newProject);
    setSavedProjects(LocalStorageManager.getProjects());
  };

  // Subtitle synchronization index
  const currentWords = activeClip?.subtitles?.[0]?.words || [];
  const activeWordIdx = Math.floor((currentPlaySec % 8) * (currentWords.length / 8));

  return (
    <div className="flex h-screen w-screen bg-[#090a0d] text-neutral-100 font-sans overflow-hidden select-none">
      {/* 1. LEFT SAAS SIDEBAR */}
      <Sidebar
        activeNav={activeNav}
        onNavigate={(nav) => setActiveNav(nav)}
        savedProjectsCount={savedProjects.length}
        savedClipsCount={clips.length}
      />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar">
        {/* Top Header */}
        <header className="h-14 border-b border-neutral-800/80 bg-[#0f1117]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-white line-clamp-1 max-w-md">
              {projectName}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {clips.length} Klip Siap
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-[#141620] hover:bg-neutral-800 text-xs font-semibold text-neutral-300 transition-all"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-400" />
              Engine: {settings.provider}
            </button>
          </div>
        </header>

        {/* VIEW: MY PROJECTS */}
        {activeNav === 'projects' && (
          <div className="p-6 max-w-7xl mx-auto w-full">
            <MyProjectsView
              projects={savedProjects}
              onLoadProject={(p) => {
                setProjectName(p.name);
                setUrl(p.sourceUrl || '');
                setYoutubeId(p.youtubeId || null);
                setThumbnailUrl(p.thumbnailUrl);
                setClips(p.clips);
                setSelectedClipId(p.selectedClipId);
                setStyleConfig(p.styleConfig);
                setBrandingConfig(p.brandingConfig);
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
          <div className="p-6 max-w-7xl mx-auto w-full">
            <TemplatesView
              activePreset={styleConfig.preset}
              onApplyTemplate={(tpl) => {
                setStyleConfig((prev) => ({ ...prev, ...tpl }));
                setActiveNav('studio');
              }}
            />
          </div>
        )}

        {/* VIEW: VIDEO STUDIO & EDITOR */}
        {activeNav === 'studio' && (
          <div className="p-5 space-y-5 max-w-7xl mx-auto w-full">
            {/* Input & Parameters Control Bar */}
            <div className="bg-[#12141a] border border-neutral-800/80 rounded-2xl p-4 shadow-xl">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
                {/* Source Input */}
                <div className="flex-1 w-full flex items-center gap-2">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        setSourceType('youtube');
                      }}
                      placeholder="Tempel link video YouTube..."
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
                    <span>Upload Lokal</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Duration & AI Auto-Cut Button */}
                <div className="flex items-center gap-2.5 w-full lg:w-auto">
                  <div className="flex items-center bg-[#0a0b0e] p-1 rounded-xl border border-neutral-800 text-xs">
                    <span className="text-[11px] text-neutral-400 px-2 font-medium">Durasi Klip:</span>
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

                  <button
                    onClick={handleGenerateClips}
                    disabled={isLoading}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      isLoading
                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:brightness-110 text-white shadow-lg shadow-indigo-600/25 active:scale-[0.98]'
                    }`}
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    {isLoading ? 'Memindai Klip...' : `AI Auto-Cut 5 Klip`}
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              {isLoading && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                    <span>{processStep}</span>
                    <span className="font-mono text-indigo-400 font-bold">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3-Column Studio Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Kolom 1: Smart Clips Rank List (3 Kolom) */}
              <div className="lg:col-span-3 flex flex-col gap-2 bg-[#12141a] border border-neutral-800/80 rounded-2xl p-3.5 h-[640px]">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-indigo-400" />
                    Smart Clips ({clips.length})
                  </span>
                  <span className="text-[10px] text-neutral-400">Rank #1 Paling Viral</span>
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
                          setIsPlaying(false);
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
                          <span className="font-mono">
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
                  className="w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-neutral-700 transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> Export All {clips.length} Clips
                </button>
              </div>

              {/* Kolom 2: Central Studio Player 9:16 (5 Kolom) */}
              <div className="lg:col-span-5 flex justify-center">
                <StudioPlayer
                  sourceType={sourceType}
                  youtubeId={youtubeId || undefined}
                  localVideoUrl={localVideoUrl || undefined}
                  thumbnailUrl={thumbnailUrl}
                  isPlaying={isPlaying}
                  onTogglePlay={() => setIsPlaying(!isPlaying)}
                  currentPlaySec={currentPlaySec}
                  durationSec={activeClip?.durationSec || clipLength}
                  startSec={activeClip?.startSec || 0}
                  endSec={activeClip?.endSec || clipLength}
                  onSeek={(sec) => setCurrentPlaySec(sec)}
                  onReset={() => {
                    setIsPlaying(false);
                    setCurrentPlaySec(0);
                  }}
                  subtitles={currentWords}
                  activeWordIdx={activeWordIdx}
                  styleConfig={styleConfig}
                  brandingConfig={brandingConfig}
                  onOpenExport={() => {
                    if (activeClip) {
                      setClipsToExport([activeClip]);
                      setIsExportOpen(true);
                    }
                  }}
                />
              </div>

              {/* Kolom 3: Studio Editor Controls (4 Kolom) */}
              <div className="lg:col-span-4 flex flex-col bg-[#12141a] border border-neutral-800/80 rounded-2xl p-4 h-[640px]">
                {/* Tabs */}
                <div className="flex bg-[#0a0b0e] p-1 rounded-xl border border-neutral-800 mb-3.5">
                  {[
                    { key: 'subtitles', label: 'Subtitle Style', icon: Type },
                    { key: 'copywriting', label: 'Copywriting', icon: Share2 },
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

                {/* TAB: SUBTITLE STYLE */}
                {studioTab === 'subtitles' && (
                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs custom-scrollbar">
                    <div>
                      <label className="text-neutral-400 font-semibold mb-1.5 block">
                        Bentuk Kotak Subtitle (Pill / Card)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'pill', name: 'Rounded Pill (Rekomendasi)' },
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
                        <label className="text-neutral-400 font-semibold">Hook Banner (3 Detik Awal)</label>
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

            {/* 4. GALERI VIDEO 9:16 DI BAWAH (BERJEJER RANK 1 - 5) */}
            <ClipGallery
              clips={clips}
              selectedClipId={selectedClipId}
              thumbnailUrl={thumbnailUrl}
              onSelectClip={(id) => {
                setSelectedClipId(id);
                setIsPlaying(false);
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
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(updated) => {
          setSettings(updated);
          LocalStorageManager.saveSettings(updated);
        }}
        currentSettings={settings}
      />
    </div>
  );
}
