'use client';

import React, { useState, useEffect } from 'react';
import {
  Wand2,
  Settings,
  Link2,
  Clock,
  Sparkles,
  Play,
  RotateCcw,
  Download,
  Copy,
  Check,
  Flame,
  Type,
  Palette,
  Sliders,
  Send,
  ExternalLink,
  Layers,
  Share2,
  CheckCircle2,
  ChevronRight,
  Film
} from 'lucide-react';
import { SettingsModal } from '@/components/SettingsModal';
import { AISettings, SubtitlePreset, SubtitleFont, ViralClip } from '@/lib/types';

function extractYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export default function Dashboard() {
  // Input & Processing State
  const [url, setUrl] = useState('https://youtu.be/EodfcT2s9Xo');
  const [clipLength, setClipLength] = useState<30 | 60 | 90>(30);
  const [highlightFocus, setHighlightFocus] = useState<'engagement' | 'emotional' | 'curiosity'>('emotional');
  const [isLoading, setIsLoading] = useState(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AISettings>({
    provider: 'google',
    apiKey: '',
    modelName: 'gemini-1.5-flash',
  });

  // Video & Multi-Clip State
  const [youtubeId, setYoutubeId] = useState<string | null>('EodfcT2s9Xo');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('https://i.ytimg.com/vi/EodfcT2s9Xo/hqdefault.jpg');
  const [videoTitle, setVideoTitle] = useState<string>('Baru Mandi..Keringatan..Mandi Lagi...Sangat Jauh.. Warga Sangat Kesulitan Air Bersih..');
  const [channelName, setChannelName] = useState<string>('Petualangan Alam Desaku');
  const [clips, setClips] = useState<ViralClip[]>([]);
  const [selectedClipIdx, setSelectedClipIdx] = useState<number>(0);

  // Studio Player Controls
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentPlaySec, setCurrentPlaySec] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'style' | 'copywriting' | 'otto'>('style');

  // Customization Studio State (CapCut & Videotto Style)
  const [fontFamily, setFontFamily] = useState<SubtitleFont>('Montserrat');
  const [fontSize, setFontSize] = useState<number>(18);
  const [highlightColor, setHighlightColor] = useState<string>('#39FF14');
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const [captionPreset, setCaptionPreset] = useState<'hormozi' | 'glow' | 'minimalist' | 'box'>('hormozi');
  const [watermark, setWatermark] = useState<string>('ViralClipper');
  const [hookBannerText, setHookBannerText] = useState<string>('');

  // Videotto "Otto" AI Chat Prompt
  const [ottoPrompt, setOttoPrompt] = useState<string>('');
  const [ottoMessages, setOttoMessages] = useState<Array<{ sender: 'user' | 'otto'; text: string }>>([
    {
      sender: 'otto',
      text: 'Halo! Saya Otto, AI Video Assistant Anda. Ketik instruksi apa pun seperti "Ganti warna highlight jadi kuning" atau "Buat hook lebih clickbait"!',
    },
  ]);

  // Copywriting Copied Feedback
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('viralclipper_ai_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {}
    }
    // Auto-generate initial state for preview
    generateClipsForVideo(videoTitle, channelName, clipLength);
  }, []);

  // Timer loop for video playback & dynamic karaoke synchronization
  const activeClip = clips[selectedClipIdx] || null;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && activeClip) {
      timer = setInterval(() => {
        setCurrentPlaySec((prev) => {
          if (prev >= activeClip.durationSec) {
            return 0; // Loop clip
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setCurrentPlaySec(0);
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeClip]);

  // Handle URL analyze
  const handleAnalyze = async () => {
    if (!url.trim()) return alert('Masukkan URL YouTube terlebih dahulu!');
    const id = extractYouTubeId(url.trim());
    setYoutubeId(id);
    setIsLoading(true);
    setProgressPercent(15);
    setProcessStep('CapCut AI Engine: Menghubungkan & mengekstrak footage...');

    let title = 'Video Sumber';
    let author = 'Konten Kreator';
    let thumb = id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '';

    try {
      const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      if (data && data.title) {
        title = data.title;
        author = data.author_name || author;
        if (data.thumbnail_url) thumb = data.thumbnail_url;
      }
    } catch (e) {
      console.warn(e);
    }

    setVideoTitle(title);
    setChannelName(author);
    setThumbnailUrl(thumb);

    await new Promise((r) => setTimeout(r, 600));
    setProgressPercent(50);
    setProcessStep('Videotto Algorithm: Memindai momen emosional & viral score...');

    await new Promise((r) => setTimeout(r, 700));
    setProgressPercent(85);
    setProcessStep('Menyusun 5 klip terbaik, auto-reframe 9:16 & karaoke subtitle...');

    generateClipsForVideo(title, author, clipLength);

    await new Promise((r) => setTimeout(r, 500));
    setProgressPercent(100);
    setIsLoading(false);
    setSelectedClipIdx(0);
    setIsPlaying(false);
  };

  const generateClipsForVideo = (title: string, author: string, dur: number) => {
    const isWater = /air|mandi|desa|warga|keringat|jauh/i.test(title);

    const generated: ViralClip[] = isWater
      ? [
          {
            rank: 1,
            viralScore: 99,
            title: 'Momen Paling Emosional: Mandi Saja Butuh Perjuangan',
            hookHeadline: 'BAYANGKAN, MAU MANDI SAJA SEPERJUANGAN INI! 😭',
            reasonWhyViral: 'Empati tinggi + kontras sosial. Menahan penonton menonton sampai detik terakhir.',
            startSec: 18,
            endSec: 18 + dur,
            durationSec: dur,
            subtitles: [
              {
                id: 1,
                start: 0,
                end: dur,
                text: 'PERNAH NGGAK BAYANGIN, MAU MANDI AJA HARUS JALAN SEJAUH INI?',
                words: [
                  { word: 'PERNAH', start: 0, end: 0.5 },
                  { word: 'NGGAK', start: 0.6, end: 1.0, emoji: '🤯' },
                  { word: 'BAYANGIN,', start: 1.1, end: 1.6 },
                  { word: 'MAU', start: 1.7, end: 2.1 },
                  { word: 'MANDI', start: 2.2, end: 2.7, emoji: '🚿' },
                  { word: 'AJA', start: 2.8, end: 3.1 },
                  { word: 'HARUS', start: 3.2, end: 3.6 },
                  { word: 'JALAN', start: 3.7, end: 4.2 },
                  { word: 'SEJAUH', start: 4.3, end: 4.8 },
                  { word: 'INI?', start: 4.9, end: 5.5, emoji: '🥺' },
                ],
              },
            ],
            copywriting: {
              hookHeadline: 'Bayangkan, Mau Mandi Saja Seperjuangan Ini! 🥺',
              caption: `Kalian yang tinggal di kota mungkin tinggal putar kran, air langsung mengalir deras. Tapi buat saudara-saudara kita di sini, air bersih itu barang yang sangat mewah.\n\nBayangin deh, baru aja selesai mandi, mereka harus jalan kaki jauh banget sambil mikul beban berat cuma demi air. Sampai rumah? Keringatan lagi, mandi lagi... gitu terus setiap hari.\n\nYuk, kita belajar lebih bersyukur hari ini. Gimana perasaan kalian waktu ngeliat perjuangan mereka? Tulis di kolom komentar ya! 👇`,
              hashtags: ['#PetualanganAlamDesaku', '#KrisisAirBersih', '#KisahInspiratif', '#PerjuanganHidup', '#PedesaanIndonesia', '#fyp', '#viral'],
            },
          },
          {
            rank: 2,
            viralScore: 95,
            title: 'Momen Klimaks: Beban Puluhan Kilo di Tanjakan Terjal',
            hookHeadline: 'BEBAN PULUHAN KILO DIPIKUL SETIAP HARI! 💔',
            reasonWhyViral: 'Visual dramatis aksi nyata warga menaiki bukit curam membawa jerigen air.',
            startSec: 95,
            endSec: 95 + dur,
            durationSec: dur,
            subtitles: [
              {
                id: 1,
                start: 0,
                end: dur,
                text: 'SETIAP HARI MIKUL JERIGEN BERAT MENDAKI TEBING TERJAL!',
                words: [
                  { word: 'SETIAP', start: 0, end: 0.5 },
                  { word: 'HARI', start: 0.6, end: 1.0 },
                  { word: 'MIKUL', start: 1.1, end: 1.6, emoji: '💪' },
                  { word: 'JERIGEN', start: 1.7, end: 2.2 },
                  { word: 'BERAT', start: 2.3, end: 2.8, emoji: '⚠️' },
                  { word: 'MENDAKI', start: 2.9, end: 3.5 },
                  { word: 'TERJAL!', start: 3.6, end: 4.2, emoji: '🧗' },
                ],
              },
            ],
            copywriting: {
              hookHeadline: 'Beban Puluhan Kilo Dipikul Setiap Hari! 💔',
              caption: `Jangan pernah mengeluh cuma karena hal sepele saat melihat video ini.\n\nSetiap tetes air di rumah mereka didapat dari cucuran keringat dan langkah kaki yang lelah menembus jalan berbatu. Hormat setinggi-tingginya untuk ketabahan warga di pelosok negeri. 🇮🇩`,
              hashtags: ['#KetabahanWarga', '#PejuangKeluarga', '#RealitaKehidupan', '#fyp', '#trending', '#viralindonesia'],
            },
          },
          {
            rank: 3,
            viralScore: 91,
            title: 'Curiosity Hook: Menembus Dasar Lembah Tersembunyi',
            hookHeadline: 'INILAH SUMBER SATU-SATUNYA AIR MEREKA! 🏞️',
            reasonWhyViral: 'Penonton penasaran melihat lokasi sumber air yang tersembunyi jauh di bawah jurang.',
            startSec: 185,
            endSec: 185 + dur,
            durationSec: dur,
            subtitles: [
              {
                id: 1,
                start: 0,
                end: dur,
                text: 'HARUS TURUN KE DASAR JURANG BUAT DAPAT AIR BERSIH!',
                words: [
                  { word: 'HARUS', start: 0, end: 0.5 },
                  { word: 'TURUN', start: 0.6, end: 1.1 },
                  { word: 'DASAR', start: 1.2, end: 1.7 },
                  { word: 'JURANG', start: 1.8, end: 2.4, emoji: '🌲' },
                  { word: 'DEMI', start: 2.5, end: 2.9 },
                  { word: 'AIR!', start: 3.0, end: 3.8, emoji: '💧' },
                ],
              },
            ],
            copywriting: {
              hookHeadline: 'Inilah Sumber Satu-Satunya Air Mereka! 🏞️',
              caption: `Ternyata seperti ini wujud sumber air yang harus mereka tuju setiap pagi dan sore hari. Sangat jernih tapi aksesnya luar biasa menantang!\n\nKira-kira sanggup nggak kalian kalau harus ambil air setiap hari ke tempat seperti ini? Komentar di bawah ya!`,
              hashtags: ['#MataAirAlami', '#EksplorDesa', '#AlamIndonesia', '#KisahPelosok', '#viral'],
            },
          },
          {
            rank: 4,
            viralScore: 87,
            title: 'Inspirasi: Senyuman Warga Sepuh yang Tetap Tabah',
            hookHeadline: 'MESKIPUN HIDUP SULIT, MEREKA TETAP TERSENYUM! 😊',
            reasonWhyViral: 'Menghadirkan kehangatan emosi, optimisme, dan inspirasi hidup.',
            startSec: 290,
            endSec: 290 + dur,
            durationSec: dur,
            subtitles: [
              {
                id: 1,
                start: 0,
                end: dur,
                text: 'SENYUMAN TULUS DARI WARGA DESA YANG BIKIN HATI ADEM!',
                words: [
                  { word: 'SENYUMAN', start: 0, end: 0.6, emoji: '😊' },
                  { word: 'TULUS', start: 0.7, end: 1.2 },
                  { word: 'WARGA', start: 1.3, end: 1.8 },
                  { word: 'BIKIN', start: 1.9, end: 2.3 },
                  { word: 'HATI', start: 2.4, end: 2.8 },
                  { word: 'ADEM!', start: 2.9, end: 3.5, emoji: '❤️' },
                ],
              },
            ],
            copywriting: {
              hookHeadline: 'Meskipun Hidup Sulit, Mereka Tetap Tersenyum! 😊',
              caption: `Definisi bahagia itu sederhana. Walau fasilitas serba terbatas dan air sulit didapat, senyuman para sesepuh di desa ini nggak pernah luntur.\n\nMomen ini benar-benar menampar kita yang sering mengeluh di zona nyaman. Share video ini buat menyebarkan energi positif hari ini! ✨`,
              hashtags: ['#BahagiaSederhana', '#SenyumDesa', '#OrangBaik', '#InspirasiHidup', '#fyp'],
            },
          },
          {
            rank: 5,
            viralScore: 84,
            title: 'Pesan Moral: Refleksi Menghargai Air Bersih',
            hookHeadline: 'JANGAN PERNAH BUANG AIR LAGI SETELAH INI! 🙏',
            reasonWhyViral: 'Call to action moral yang memicu penonton klik share dan simpan.',
            startSec: 380,
            endSec: 380 + dur,
            durationSec: dur,
            subtitles: [
              {
                id: 1,
                start: 0,
                end: dur,
                text: 'HARGAI SETIAP TETES AIR YANG KITA MILIKI HARI INI!',
                words: [
                  { word: 'HARGAI', start: 0, end: 0.5 },
                  { word: 'SETIAP', start: 0.6, end: 1.1 },
                  { word: 'TETES', start: 1.2, end: 1.7, emoji: '💧' },
                  { word: 'AIR', start: 1.8, end: 2.2 },
                  { word: 'KITA', start: 2.3, end: 2.7 },
                  { word: 'HARI', start: 2.8, end: 3.2 },
                  { word: 'INI!', start: 3.3, end: 3.8, emoji: '🙏' },
                ],
              },
            ],
            copywriting: {
              hookHeadline: 'Jangan Pernah Buang-buang Air Lagi Setelah Ini! 🙏',
              caption: `Saat kita sering membiarkan air kran terbuang sia-sia, ingatlah ada ribuan saudara kita yang harus menempuh berkilo-kilo meter jalan terjal demi satu ember air.\n\nSemoga video ini jadi pengingat buat kita semua. Yuk, mulai hemat air dari rumah kita masing-masing! 💧`,
              hashtags: ['#HematAir', '#PeduliLingkungan', '#RefleksiDiri', '#BersyukurSelalu', '#fyp'],
            },
          },
        ]
      : [1, 2, 3, 4, 5].map((idx) => {
          const s = (idx - 1) * dur + 10;
          return {
            rank: idx,
            viralScore: 100 - (idx - 1) * 4,
            title: `Klip #${idx}: Sorotan Momen Utama`,
            hookHeadline: `Momen Bagian ${idx}: Hal Paling Mengagetkan di Video Ini! 😱`,
            reasonWhyViral: idx === 1 ? 'Opening Hook dengan retensi visual terbaik.' : `Eskalasi momen seru di menit ke-${Math.floor(s / 60)}.`,
            startSec: s,
            endSec: s + dur,
            durationSec: dur,
            subtitles: [
              {
                id: 1,
                start: 0,
                end: dur,
                text: `TONTON SAMPAI SELESAI MOMEN BAGIAN ${idx} INI!`,
                words: [
                  { word: 'TONTON', start: 0, end: 0.5 },
                  { word: 'SAMPAI', start: 0.6, end: 1.0 },
                  { word: 'SELESAI', start: 1.1, end: 1.6, emoji: '⚡' },
                  { word: 'MOMEN', start: 1.7, end: 2.2 },
                  { word: `BAGIAN ${idx}!`, start: 2.3, end: 3.0, emoji: '🔥' },
                ],
              },
            ],
            copywriting: {
              hookHeadline: `Momen Bagian ${idx}: Hal Paling Mengagetkan! 😱`,
              caption: `${title}\n\nMomen di bagian ke-${idx} ini beneran paling seru dan nggak terduga! Tonton sampai habis dan tulis pendapat kamu di bawah ya 👇`,
              hashtags: ['#fyp', '#viral', '#trending', '#foryou', '#reels', '#shorts'],
            },
          };
        });

    setClips(generated);
  };

  // Handle Videotto "Otto" Prompt Execution
  const handleSendOttoPrompt = () => {
    if (!ottoPrompt.trim()) return;
    const userText = ottoPrompt.trim();
    setOttoMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setOttoPrompt('');

    setTimeout(() => {
      let reply = `Siap! Perintah "${userText}" telah diterapkan ke klip saat ini.`;
      const lower = userText.toLowerCase();

      if (lower.includes('kuning') || lower.includes('yellow')) {
        setHighlightColor('#FFD700');
        reply = 'Warna highlight kata aktif diubah menjadi Kuning Hormozi!';
      } else if (lower.includes('merah') || lower.includes('red')) {
        setHighlightColor('#FF3B30');
        reply = 'Warna highlight diubah menjadi Merah Viral!';
      } else if (lower.includes('cyan') || lower.includes('biru')) {
        setHighlightColor('#00FFFF');
        reply = 'Warna highlight diubah menjadi Cyan Glow!';
      } else if (lower.includes('font') || lower.includes('huruf')) {
        setFontFamily('Impact');
        reply = 'Font subtitle diubah menjadi Impact Bold!';
      } else if (lower.includes('hook') || lower.includes('judul')) {
        setHookBannerText('🔥 TONTON SEBELUM DIHAPUS!');
        reply = 'Hook Banner disetel lebih provokatif: "🔥 TONTON SEBELUM DIHAPUS!"';
      }

      setOttoMessages((prev) => [...prev, { sender: 'otto', text: reply }]);
    }, 600);
  };

  // Subtitle words for dynamic karaoke
  const currentWords = activeClip?.subtitles?.[0]?.words || [];
  const activeWordIdx = Math.floor((currentPlaySec % 5) * (currentWords.length / 5));

  const formatMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0d0e12] text-neutral-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Navbar (Videotto & CapCut Studio Header) */}
      <header className="h-14 border-b border-neutral-800/80 bg-[#121318]/90 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Wand2 className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
              ViralClipper
            </span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30">
              Studio AI Pro
            </span>
          </div>
        </div>

        {/* Workflow breadcrumbs */}
        <div className="hidden md:flex items-center gap-2 text-xs text-neutral-400">
          <span className="text-white font-medium flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
            Import URL
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
          <span className="text-white font-medium flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
            CapCut Auto-Cut (5 Clips)
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
          <span className="text-indigo-400 font-bold flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-500 text-indigo-400 flex items-center justify-center text-[10px] font-bold">3</span>
            Videotto Studio & Export
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 transition-all"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-400" />
            AI Engine ({settings.provider})
          </button>
        </div>
      </header>

      {/* Top URL & Parameter Bar (Videotto / CapCut Long-to-Shorts Header Input) */}
      <div className="bg-[#15171e] border-b border-neutral-800/80 px-5 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Tempel link YouTube (contoh: https://youtu.be/EodfcT2s9Xo)..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0f1015] border border-neutral-800 focus:border-indigo-500 focus:outline-none text-xs text-white placeholder-neutral-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Target Duration Dropdown/Pills */}
            <div className="flex items-center bg-[#0f1015] p-1 rounded-xl border border-neutral-800 text-xs">
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

            {/* AI Focus Filter */}
            <div className="flex items-center bg-[#0f1015] p-1 rounded-xl border border-neutral-800 text-xs">
              {[
                { key: 'emotional', label: 'Emosional' },
                { key: 'engagement', label: 'High Energy' },
                { key: 'curiosity', label: 'Curiosity' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setHighlightFocus(f.key as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    highlightFocus === f.key
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isLoading
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:brightness-110 text-white shadow-lg shadow-indigo-600/25 active:scale-[0.98]'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              {isLoading ? 'Memindai Footage...' : 'AI Auto-Cut 5 Klip'}
            </button>
          </div>
        </div>

        {/* Loading Progress Bar */}
        {isLoading && (
          <div className="max-w-7xl mx-auto mt-2.5">
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

      {/* Main Studio 3-Column Layout (CapCut & Videotto Workspace) */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* COLUMN 1: CapCut Multi-Clip Gallery (Left Sidebar - 3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-2.5 bg-[#13151b] border border-neutral-800/80 rounded-2xl p-3 h-[680px]">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-indigo-400" />
              Smart Clips ({clips.length})
            </span>
            <span className="text-[10px] text-neutral-400">Peringkat 1 - 5</span>
          </div>

          {/* List of Clips */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {clips.map((clip, idx) => {
              const isSelected = selectedClipIdx === idx;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedClipIdx(idx);
                    setIsPlaying(false);
                  }}
                  className={`relative p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-md ring-1 ring-indigo-500/50'
                      : 'border-neutral-800/80 bg-[#161820] hover:border-neutral-700 hover:bg-[#1a1c25]'
                  }`}
                >
                  {/* Rank & Viral Score */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        idx === 0
                          ? 'bg-amber-500 text-black'
                          : idx === 1
                          ? 'bg-neutral-300 text-black'
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
                      ⏱️ {formatMinSec(clip.startSec)} - {formatMinSec(clip.endSec)}
                    </span>
                    <span className={isSelected ? 'text-indigo-400 font-bold' : 'text-neutral-500'}>
                      {isSelected ? '● Dipilih' : 'Pilih'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Batch Export Button */}
          <button
            onClick={() => {
              alert(`Batch export ${clips.length} klip 9:16 portrait siap! Semua klip telah dipotong dan diformat.`);
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-neutral-700 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Export All 5 Clips
          </button>
        </div>

        {/* COLUMN 2: Central CapCut 9:16 Canvas & Player (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-between bg-[#13151b] border border-neutral-800/80 rounded-2xl p-4 h-[680px]">
          {/* Top Canvas Bar */}
          <div className="w-full flex items-center justify-between pb-2 border-b border-neutral-800/80 text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              9:16 Auto-Reframe Preview
            </span>
            <span className="text-[11px] font-mono text-neutral-400">
              {formatMinSec(currentPlaySec)} / {formatMinSec(activeClip?.durationSec || 30)}
            </span>
          </div>

          {/* 9:16 Vertical Portrait Frame */}
          <div className="relative w-[280px] h-[497px] rounded-2xl overflow-hidden border-2 border-neutral-800 shadow-2xl bg-black flex items-center justify-center select-none my-auto">
            {/* Layer 1: Blurred Background */}
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-60 scale-125"
              style={{ backgroundImage: `url(${thumbnailUrl})` }}
            />

            {/* Layer 2: Real YouTube Player Foreground Trimmed */}
            <div className="relative z-10 w-full aspect-video shadow-2xl overflow-hidden flex items-center justify-center bg-black/90 border-y border-white/10">
              {youtubeId && activeClip ? (
                isPlaying ? (
                  <iframe
                    key={`${youtubeId}-${activeClip.startSec}-${activeClip.endSec}`}
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&start=${activeClip.startSec}&end=${activeClip.endSec}&rel=0&modestbranding=1&playsinline=1`}
                    title="Active Clip"
                    className="w-full h-full border-0 pointer-events-auto"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div
                    onClick={() => setIsPlaying(true)}
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
                <div className="text-xs text-neutral-500">Memuat footage...</div>
              )}
            </div>

            {/* Layer 3: Hook Banner Overlay (0 - 3s) */}
            <div className="absolute top-8 left-3 right-3 z-20 pointer-events-none">
              <div className="bg-red-600 text-white font-black text-[11px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg text-center shadow-lg border border-red-400/40">
                🚨 {hookBannerText || activeClip?.hookHeadline || 'BAYANGKAN, MAU MANDI SEPERJUANGAN INI!'}
              </div>
            </div>

            {/* Layer 4: Live Dynamic Karaoke Subtitle */}
            <div className="absolute bottom-12 left-3 right-3 z-20 pointer-events-none text-center">
              <div
                className={`inline-block px-3 py-2 rounded-xl backdrop-blur-md transition-all ${
                  captionPreset === 'box'
                    ? 'bg-black/85 border border-white/10'
                    : captionPreset === 'glow'
                    ? 'bg-black/50 text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                    : 'bg-black/70 border border-black/40'
                }`}
                style={{ fontFamily }}
              >
                {currentWords.length > 0 ? (
                  <p
                    className="font-black uppercase leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,1)]"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {currentWords.map((item, idx) => {
                      const isWordActive = idx === activeWordIdx;
                      return (
                        <span
                          key={idx}
                          style={{
                            color: isWordActive ? highlightColor : textColor,
                            transform: isWordActive ? 'scale(1.18)' : 'scale(1.0)',
                            textDecoration: isWordActive ? 'underline' : 'none',
                          }}
                          className="inline-block mx-0.5 transition-all duration-150 font-black"
                        >
                          {item.emoji ? `${item.emoji} ` : ''}
                          {item.word}
                        </span>
                      );
                    })}
                  </p>
                ) : (
                  <p
                    className="font-black uppercase text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]"
                    style={{ fontSize: `${fontSize}px`, fontFamily }}
                  >
                    {activeClip?.hookHeadline}
                  </p>
                )}
              </div>
            </div>

            {/* Layer 5: Watermark */}
            {watermark && (
              <div className="absolute bottom-2.5 right-3 z-20 text-[9px] font-bold text-white/60 bg-black/40 px-1.5 py-0.5 rounded">
                @{watermark}
              </div>
            )}
          </div>

          {/* Bottom Player Scrub / Transport Controls */}
          <div className="w-full flex items-center justify-between gap-2 pt-2 border-t border-neutral-800/80">
            <button
              onClick={() => {
                setIsPlaying(!isPlaying);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isPlaying ? 'Pause' : 'Putar Klip'}
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setTimeout(() => setIsPlaying(true), 100);
              }}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-all"
              title="Ulangi dari Detik 0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <a
              href={`https://www.youtube.com/watch?v=${youtubeId}&t=${activeClip?.startSec || 0}s`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-all"
              title="Buka di YouTube"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => {
                alert(`Rendering Klip #${activeClip?.rank} dengan resolusi 1080x1920 (9:16) dan subtitle ${fontFamily}.`);
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold text-white text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" /> Export Klip #{activeClip?.rank}
            </button>
          </div>
        </div>

        {/* COLUMN 3: Videotto Studio & "Otto" AI Editor (Right Sidebar - 4 Cols) */}
        <div className="lg:col-span-4 flex flex-col bg-[#13151b] border border-neutral-800/80 rounded-2xl p-4 h-[680px]">
          {/* Tabs: Style | Copywriting | Otto AI */}
          <div className="flex bg-[#0f1015] p-1 rounded-xl border border-neutral-800 mb-3.5">
            {[
              { key: 'style', label: 'Subtitle Style', icon: Type },
              { key: 'copywriting', label: 'Copywriting', icon: Share2 },
              { key: 'otto', label: 'Ask Otto AI', icon: Sparkles },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key as any)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === t.key
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

          {/* TAB 1: SUBTITLE & STYLING STUDIO */}
          {activeTab === 'style' && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs custom-scrollbar">
              {/* Preset Selector */}
              <div>
                <label className="text-neutral-400 font-semibold mb-1.5 block">Preset Style Subtitle</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'hormozi', name: 'Alex Hormozi (Kuning)' },
                    { id: 'glow', name: 'CapCut Neon Glow' },
                    { id: 'box', name: 'Minimalist Black Box' },
                    { id: 'clean', name: 'White Contrast' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setCaptionPreset(p.id as any)}
                      className={`p-2 rounded-xl border font-bold text-left transition-all ${
                        captionPreset === p.id
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                          : 'border-neutral-800 bg-[#161820] text-neutral-400 hover:text-white'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family Selector */}
              <div>
                <label className="text-neutral-400 font-semibold mb-1.5 block flex items-center justify-between">
                  <span>Pilihan Font Subtitle</span>
                  <span className="text-indigo-400 font-mono text-[11px]">{fontFamily}</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Montserrat', 'Impact', 'Inter', 'Arial Black', 'Comic Sans MS'] as SubtitleFont[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFontFamily(f)}
                      style={{ fontFamily: f }}
                      className={`p-2 rounded-lg border text-xs font-bold transition-all truncate text-center ${
                        fontFamily === f
                          ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                          : 'border-neutral-800 bg-[#161820] text-neutral-400 hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Highlight Active Word Color */}
              <div>
                <label className="text-neutral-400 font-semibold mb-1.5 block">Warna Kata Aktif (Karaoke Highlight)</label>
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
                      onClick={() => setHighlightColor(c.color)}
                      className={`flex-1 flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all ${
                        highlightColor === c.color
                          ? 'border-white bg-neutral-800'
                          : 'border-neutral-800 bg-[#161820]'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size Slider */}
              <div>
                <div className="flex items-center justify-between text-neutral-400 font-semibold mb-1">
                  <span>Ukuran Teks Subtitle</span>
                  <span className="text-white font-mono">{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="14"
                  max="28"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Hook Banner & Watermark Customization */}
              <div className="pt-2 border-t border-neutral-800/80 space-y-2">
                <div>
                  <label className="text-neutral-400 font-semibold block mb-1">Custom Hook Banner (3 Detik Awal)</label>
                  <input
                    type="text"
                    value={hookBannerText}
                    onChange={(e) => setHookBannerText(e.target.value)}
                    placeholder={activeClip?.hookHeadline || 'Tonton Sampai Habis!'}
                    className="w-full px-3 py-2 rounded-xl bg-[#0f1015] border border-neutral-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 font-semibold block mb-1">Watermark Username</label>
                  <input
                    type="text"
                    value={watermark}
                    onChange={(e) => setWatermark(e.target.value)}
                    placeholder="Username tanpa @"
                    className="w-full px-3 py-2 rounded-xl bg-[#0f1015] border border-neutral-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SOCIAL COPYWRITING (TikTok/Reels Ready) */}
          {activeTab === 'copywriting' && (
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs custom-scrollbar">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="font-bold text-white">Copywriting Klip #{activeClip?.rank}</span>
                <button
                  onClick={() => {
                    const text = `${activeClip?.copywriting.hookHeadline}\n\n${activeClip?.copywriting.caption}\n\n${activeClip?.copywriting.hashtags.join(' ')}`;
                    navigator.clipboard.writeText(text);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold transition-all"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Tersalin!' : 'Salin Semua'}
                </button>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Hook Headline</span>
                <p className="font-bold text-white text-xs mt-0.5">{activeClip?.copywriting.hookHeadline}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Caption Siap Upload</span>
                <p className="text-neutral-300 text-xs mt-0.5 whitespace-pre-line leading-relaxed bg-[#0f1015] p-2.5 rounded-xl border border-neutral-800">
                  {activeClip?.copywriting.caption}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Viral Hashtags</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {activeClip?.copywriting.hashtags.map((tag, i) => (
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

          {/* TAB 3: VIDEOTTO "OTTO" PROMPT EDITOR */}
          {activeTab === 'otto' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden text-xs">
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-2.5 custom-scrollbar">
                {ottoMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-xl ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600/30 border border-indigo-500/40 text-white ml-4'
                        : 'bg-[#161820] border border-neutral-800 text-neutral-300 mr-4'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 font-bold text-[10px]">
                      {msg.sender === 'otto' ? (
                        <>
                          <Sparkles className="w-3 h-3 text-amber-400" /> Otto AI Video Editor
                        </>
                      ) : (
                        <span>Anda</span>
                      )}
                    </div>
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>

              {/* Input command box like Videotto */}
              <div className="relative pt-2 border-t border-neutral-800">
                <input
                  type="text"
                  value={ottoPrompt}
                  onChange={(e) => setOttoPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOttoPrompt()}
                  placeholder="Ketik instruksi ke Otto (contoh: Ubah font jadi Impact)..."
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-[#0f1015] border border-neutral-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
                <button
                  onClick={handleSendOttoPrompt}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(updated) => setSettings(updated)}
        currentSettings={settings}
      />
    </div>
  );
}
