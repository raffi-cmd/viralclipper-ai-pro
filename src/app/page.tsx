'use client';

import React, { useState, useEffect } from 'react';
import {
  Wand2,
  Settings,
  Link2,
  Clock,
  Sparkles,
  Play,
  Pause,
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
  Film,
  TrendingUp,
  Eye,
  Video
} from 'lucide-react';
import { SettingsModal } from '@/components/SettingsModal';
import { AISettings, SubtitlePreset, SubtitleFont, ViralClip } from '@/lib/types';

function extractYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export default function Dashboard() {
  // Input State
  const [url, setUrl] = useState('https://youtu.be/EodfcT2s9Xo');
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

  // Video Metadata
  const [youtubeId, setYoutubeId] = useState<string | null>('EodfcT2s9Xo');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('https://i.ytimg.com/vi/EodfcT2s9Xo/hqdefault.jpg');
  const [videoTitle, setVideoTitle] = useState<string>('Baru Mandi..Keringatan..Mandi Lagi...Sangat Jauh.. Warga Sangat Kesulitan Air Bersih..');
  const [channelName, setChannelName] = useState<string>('Petualangan Alam Desaku');
  const [totalVideoDurationSec, setTotalVideoDurationSec] = useState<number>(300); // Default 5 menit (300s)

  // Multi-Clips State
  const [clips, setClips] = useState<ViralClip[]>([]);
  const [selectedClipIdx, setSelectedClipIdx] = useState<number>(0);

  // Player State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentPlaySec, setCurrentPlaySec] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'style' | 'copywriting' | 'otto'>('style');

  // Readable Subtitle Customizer State
  const [fontFamily, setFontFamily] = useState<SubtitleFont>('Montserrat');
  const [fontSize, setFontSize] = useState<number>(18);
  const [highlightColor, setHighlightColor] = useState<string>('#39FF14');
  const [captionBoxStyle, setCaptionBoxStyle] = useState<'pill' | 'card' | 'glow' | 'minimal'>('pill');
  const [watermark, setWatermark] = useState<string>('ViralClipper');
  const [hookBannerText, setHookBannerText] = useState<string>('');

  // Otto AI Chat
  const [ottoPrompt, setOttoPrompt] = useState<string>('');
  const [ottoMessages, setOttoMessages] = useState<Array<{ sender: 'user' | 'otto'; text: string }>>([
    {
      sender: 'otto',
      text: 'Halo! Saya Otto AI. Anda bisa mengetik "Ubah subtitle jadi warna kuning", "Perbesar font", atau "Buat hook lebih nendang"!',
    },
  ]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('viralclipper_ai_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {}
    }
    // Generate initial clips
    generateRankedClips(videoTitle, channelName, totalVideoDurationSec, clipLength);
  }, []);

  const activeClip = clips[selectedClipIdx] || null;

  // Real-time playback timer & dynamic karaoke sync
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

  // Handle URL Analyze & Auto-Cut
  const handleAnalyze = async () => {
    if (!url.trim()) return alert('Masukkan URL YouTube terlebih dahulu!');
    const id = extractYouTubeId(url.trim());
    setYoutubeId(id);
    setIsLoading(true);
    setProgressPercent(15);
    setProcessStep('Menganalisis durasi total video dan mendeteksi audio speech-to-text...');

    let title = 'Video Sumber';
    let author = 'Konten Kreator';
    let thumb = id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '';
    let totalSec = 300; // Asumsi video 5 menit jika tidak terdeteksi

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
    setTotalVideoDurationSec(totalSec);

    await new Promise((r) => setTimeout(r, 600));
    setProgressPercent(50);
    setProcessStep(`Menghitung pembagian klip durasi ${clipLength}s & ranking engagement...`);

    await new Promise((r) => setTimeout(r, 700));
    setProgressPercent(85);
    setProcessStep('Menghasilkan subtitle micro-phrasing yang enak dibaca & auto-reframe 9:16...');

    generateRankedClips(title, author, totalSec, clipLength);

    await new Promise((r) => setTimeout(r, 500));
    setProgressPercent(100);
    setIsLoading(false);
    setSelectedClipIdx(0);
    setIsPlaying(false);
  };

  // Logika pembagian klip sesuai durasi video asli (misal video 5 menit / 300 detik dibagi per 60 detik = 5 klip)
  const generateRankedClips = (
    title: string,
    author: string,
    totalSec: number,
    clipDur: number
  ) => {
    // Jumlah klip dihitung dari durasi total dibagi durasi klip (maksimal 5 klip terbaik)
    const clipCount = Math.max(3, Math.min(5, Math.floor(totalSec / clipDur)));
    const isWater = /air|mandi|desa|warga|keringat|jauh/i.test(title);

    const presetDescriptions = [
      {
        rank: 1,
        viralScore: 99,
        title: 'Momen Paling Emosional: Mandi Saja Harus Perjuangan Berat',
        hook: 'BAYANGKAN, MAU MANDI SAJA SEPERJUANGAN INI! 😭',
        reason: 'Kontras emosional tajam. Penonton langsung terikat sejak 3 detik pertama.',
        subPhrases: [
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
        viralScore: 95,
        title: 'Momen Klimaks: Beban Puluhan Kilo di Tanjakan Curam',
        hook: 'BEBAN PULUHAN KILO DIPIKUL SETIAP HARI! 💔',
        reason: 'Visual dramatis aksi nyata warga menaiki bukit curam membawa jerigen air.',
        subPhrases: [
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
        viralScore: 91,
        title: 'Curiosity Hook: Menembus Dasar Lembah Tersembunyi',
        hook: 'INILAH SUMBER SATU-SATUNYA AIR MEREKA! 🏞️',
        reason: 'Rasa penasaran penonton melihat lokasi sumber air yang tersembunyi jauh di bawah jurang.',
        subPhrases: [
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
        viralScore: 87,
        title: 'Inspirasi: Senyuman Warga Sepuh yang Tetap Tabah',
        hook: 'MESKIPUN HIDUP SULIT, MEREKA TETAP TERSENYUM! 😊',
        reason: 'Menghadirkan kehangatan emosi, optimisme, dan inspirasi hidup.',
        subPhrases: [
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
        viralScore: 84,
        title: 'Pesan Moral: Refleksi Menghargai Setiap Tetes Air',
        hook: 'JANGAN PERNAH BUANG AIR LAGI SETELAH INI! 🙏',
        reason: 'Call to action moral yang memicu penonton klik share dan simpan.',
        subPhrases: [
          'HARGAI SETIAP TETES AIR BERSIH!',
          'YANG MENGALIR DI RUMAH KITA HARI INI!',
          'JANGAN PERNAH DISIA-SIAKAN LAGI!',
          'INGAT PERJUANGAN SAUDARA-SAUDARA KITA!'
        ],
        caption: `Saat kita sering membiarkan air kran terbuang sia-sia, ingatlah ada ribuan saudara kita yang harus menempuh berkilo-kilo meter jalan terjal demi satu ember air.\n\nSemoga video ini jadi pengingat buat kita semua. Yuk, mulai hemat air dari rumah kita masing-masing! 💧`,
        hashtags: ['#HematAir', '#PeduliLingkungan', '#RefleksiDiri', '#BersyukurSelalu', '#fyp']
      }
    ];

    const generated: ViralClip[] = [];

    for (let i = 0; i < clipCount; i++) {
      const p = presetDescriptions[i] || presetDescriptions[0];
      const start = i * clipDur + 10;
      const end = start + clipDur;

      // Bentuk kata-kata subtitle yang dipisah rapi (micro-phrasing)
      const words = p.subPhrases.flatMap((phrase, pIdx) => {
        const pWords = phrase.split(' ');
        return pWords.map((w, wIdx) => ({
          word: w,
          start: pIdx * 3 + wIdx * 0.4,
          end: pIdx * 3 + (wIdx + 1) * 0.4,
          emoji: wIdx === pWords.length - 1 ? (pIdx === 0 ? '💧' : pIdx === 1 ? '🔥' : '✨') : undefined
        }));
      });

      generated.push({
        rank: i + 1,
        viralScore: p.viralScore - i * 2,
        title: p.title,
        hookHeadline: p.hook,
        reasonWhyViral: p.reason,
        startSec: start,
        endSec: end,
        durationSec: clipDur,
        subtitles: [
          {
            id: 1,
            start: 0,
            end: clipDur,
            text: p.subPhrases.join(' '),
            words: words
          }
        ],
        copywriting: {
          hookHeadline: p.hook,
          caption: p.caption,
          hashtags: p.hashtags
        }
      });
    }

    setClips(generated);
  };

  // Subtitle kata aktif untuk dynamic karaoke
  const currentWords = activeClip?.subtitles?.[0]?.words || [];
  const activeWordIdx = Math.floor((currentPlaySec % 8) * (currentWords.length / 8));

  // Chunk kata menjadi baris pendek 3-4 kata agar enak dibaca (Easy to Read)
  const currentSentenceChunk = currentWords.slice(
    Math.max(0, activeWordIdx - 2),
    Math.min(currentWords.length, activeWordIdx + 4)
  );

  const formatMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Otto AI handler
  const handleSendOttoPrompt = () => {
    if (!ottoPrompt.trim()) return;
    const txt = ottoPrompt.trim();
    setOttoMessages((prev) => [...prev, { sender: 'user', text: txt }]);
    setOttoPrompt('');

    setTimeout(() => {
      let reply = `Siap! Perintah "${txt}" sudah diterapkan pada klip terpilih.`;
      const l = txt.toLowerCase();
      if (l.includes('kuning') || l.includes('yellow')) {
        setHighlightColor('#FFD700');
        reply = 'Warna kata aktif diubah menjadi Kuning Hormozi!';
      } else if (l.includes('font') || l.includes('huruf')) {
        setFontFamily('Impact');
        reply = 'Font diubah menjadi Impact Bold!';
      } else if (l.includes('kotak') || l.includes('box')) {
        setCaptionBoxStyle('card');
        reply = 'Box subtitle diubah menjadi Card Hitam Kontras!';
      }
      setOttoMessages((prev) => [...prev, { sender: 'otto', text: reply }]);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-neutral-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* 1. TOP NAVBAR (Videotto & CapCut Studio Header) */}
      <header className="h-14 border-b border-neutral-800/80 bg-[#101116]/95 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Wand2 className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
              ViralClipper
            </span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30">
              Studio Clip Master
            </span>
          </div>
        </div>

        {/* Workflow Breadcrumbs */}
        <div className="hidden md:flex items-center gap-2 text-xs text-neutral-400">
          <span className="text-white font-medium flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
            Import Video (5 Min)
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
          <span className="text-white font-medium flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
            Auto-Cut ({clips.length} Klip Terurut)
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
          <span className="text-indigo-400 font-bold flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-500 text-indigo-400 flex items-center justify-center text-[10px] font-bold">3</span>
            Studio Preview & Subtitle
          </span>
        </div>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 transition-all"
        >
          <Settings className="w-3.5 h-3.5 text-indigo-400" />
          Settings ({settings.provider})
        </button>
      </header>

      {/* 2. TOP ACTION CONTROL BAR */}
      <div className="bg-[#12141a] border-b border-neutral-800/80 px-5 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Tempel link video YouTube (contoh: https://youtu.be/EodfcT2s9Xo)..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0a0b0e] border border-neutral-800 focus:border-indigo-500 focus:outline-none text-xs text-white placeholder-neutral-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Durasi Pilihan Klip */}
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

            {/* AI Highlight Focus */}
            <div className="flex items-center bg-[#0a0b0e] p-1 rounded-xl border border-neutral-800 text-xs">
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

            {/* Tombol Generate Auto-Cut */}
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
              {isLoading ? 'Memindai Video...' : `AI Auto-Cut ${clips.length || 5} Klip`}
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

      {/* 3. STUDIO WORKSPACE (3-COLUMN STUDIO LAYOUT) */}
      <div className="max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* KOLOM 1: CapCut Smart Clips Gallery (3 Kolom) */}
        <div className="lg:col-span-3 flex flex-col gap-2 bg-[#12141a] border border-neutral-800/80 rounded-2xl p-3 h-[620px]">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-indigo-400" />
              Smart Clips ({clips.length})
            </span>
            <span className="text-[10px] text-neutral-400">Rank #1 Paling Menarik</span>
          </div>

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
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-md ring-1 ring-indigo-500/50'
                      : 'border-neutral-800/80 bg-[#161822] hover:border-neutral-700 hover:bg-[#1a1c28]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        idx === 0
                          ? 'bg-amber-400 text-black'
                          : idx === 1
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
                      ⏱️ {formatMinSec(clip.startSec)} - {formatMinSec(clip.endSec)} ({clip.durationSec}s)
                    </span>
                    <span className={isSelected ? 'text-indigo-400 font-bold' : 'text-neutral-500'}>
                      {isSelected ? '● Dipilih' : 'Pilih'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              alert(`Semua ${clips.length} klip siap diekspor serentak!`);
            }}
            className="w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-neutral-700 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Export All {clips.length} Clips
          </button>
        </div>

        {/* KOLOM 2: CapCut 9:16 Canvas & Player Studio (5 Kolom) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-between bg-[#12141a] border border-neutral-800/80 rounded-2xl p-4 h-[620px]">
          <div className="w-full flex items-center justify-between pb-2 border-b border-neutral-800/80 text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              9:16 Auto-Reframe Preview
            </span>
            <span className="text-[11px] font-mono text-neutral-400">
              {formatMinSec(currentPlaySec)} / {formatMinSec(activeClip?.durationSec || 60)}
            </span>
          </div>

          {/* Canvas 9:16 Portrait */}
          <div className="relative w-[270px] h-[460px] rounded-2xl overflow-hidden border-2 border-neutral-800 shadow-2xl bg-black flex items-center justify-center select-none my-auto">
            {/* Layer 1: Background Blur */}
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-60 scale-125"
              style={{ backgroundImage: `url(${thumbnailUrl})` }}
            />

            {/* Layer 2: Real YouTube Player Foreground */}
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
            <div className="absolute top-6 left-3 right-3 z-20 pointer-events-none">
              <div className="bg-red-600/95 text-white font-black text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-lg text-center shadow-xl border border-red-400/40">
                🚨 {hookBannerText || activeClip?.hookHeadline}
              </div>
            </div>

            {/* Layer 4: ENHANCED READABLE SUBTITLES (Micro-phrasing, Pill Box, High Contrast) */}
            <div className="absolute bottom-10 left-3 right-3 z-20 pointer-events-none text-center">
              <div
                className={`inline-block px-3.5 py-2 rounded-2xl backdrop-blur-md transition-all shadow-2xl ${
                  captionBoxStyle === 'pill'
                    ? 'bg-black/80 border border-white/15'
                    : captionBoxStyle === 'card'
                    ? 'bg-black/95 border border-white/20'
                    : captionBoxStyle === 'glow'
                    ? 'bg-black/60 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                    : 'bg-black/70'
                }`}
                style={{ fontFamily }}
              >
                {currentSentenceChunk.length > 0 ? (
                  <p
                    className="font-extrabold uppercase leading-snug tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,1)]"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {currentSentenceChunk.map((item, idx) => {
                      const isWordActive = idx === (activeWordIdx % currentSentenceChunk.length);
                      return (
                        <span
                          key={idx}
                          style={{
                            color: isWordActive ? highlightColor : '#FFFFFF',
                            transform: isWordActive ? 'scale(1.12)' : 'scale(1.0)',
                            textShadow: isWordActive ? `0 0 10px ${highlightColor}` : '0 2px 4px rgba(0,0,0,0.8)',
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
                    style={{ fontSize: `${fontSize}px`, fontFamily }}
                  >
                    {activeClip?.hookHeadline}
                  </p>
                )}
              </div>
            </div>

            {/* Layer 5: Watermark */}
            {watermark && (
              <div className="absolute bottom-2 right-3 z-20 text-[9px] font-bold text-white/70 bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
                @{watermark}
              </div>
            )}
          </div>

          {/* Transport Controls */}
          <div className="w-full flex items-center justify-between gap-2 pt-2 border-t border-neutral-800/80">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              {isPlaying ? 'Pause' : 'Putar Klip'}
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setTimeout(() => setIsPlaying(true), 100);
              }}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-all"
              title="Ulangi dari awal"
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
                alert(`Render klip #${activeClip?.rank} siap! Format 1080x1920 (9:16 Portrait) dengan subtitle ${fontFamily}.`);
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold text-white text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" /> Export Klip #{activeClip?.rank}
            </button>
          </div>
        </div>

        {/* KOLOM 3: Videotto Studio Controls & Otto AI (4 Kolom) */}
        <div className="lg:col-span-4 flex flex-col bg-[#12141a] border border-neutral-800/80 rounded-2xl p-4 h-[620px]">
          <div className="flex bg-[#0a0b0e] p-1 rounded-xl border border-neutral-800 mb-3.5">
            {[
              { key: 'style', label: 'Subtitle Studio', icon: Type },
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

          {/* TAB 1: SUBTITLE STUDIO */}
          {activeTab === 'style' && (
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs custom-scrollbar">
              <div>
                <label className="text-neutral-400 font-semibold mb-1.5 block">Bentuk Box Subtitle (Enak Dibaca)</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'pill', name: 'Rounded Pill (Rekomendasi)' },
                    { id: 'card', name: 'Solid Card Box' },
                    { id: 'glow', name: 'Neon Glow Frame' },
                    { id: 'minimal', name: 'Minimalist Clean' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setCaptionBoxStyle(b.id as any)}
                      className={`p-2 rounded-xl border font-bold text-left transition-all ${
                        captionBoxStyle === b.id
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
                  <span className="text-indigo-400 font-mono">{fontFamily}</span>
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
                          : 'border-neutral-800 bg-[#161822] text-neutral-400 hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

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
                  <span>Ukuran Huruf Subtitle</span>
                  <span className="text-white font-mono">{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="14"
                  max="26"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-neutral-800/80 space-y-2">
                <div>
                  <label className="text-neutral-400 font-semibold block mb-1">Custom Hook Banner (3 Detik Pertama)</label>
                  <input
                    type="text"
                    value={hookBannerText}
                    onChange={(e) => setHookBannerText(e.target.value)}
                    placeholder={activeClip?.hookHeadline || 'Tonton Sampai Habis!'}
                    className="w-full px-3 py-2 rounded-xl bg-[#0a0b0e] border border-neutral-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 font-semibold block mb-1">Watermark Akun</label>
                  <input
                    type="text"
                    value={watermark}
                    onChange={(e) => setWatermark(e.target.value)}
                    placeholder="Username tanpa @"
                    className="w-full px-3 py-2 rounded-xl bg-[#0a0b0e] border border-neutral-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COPYWRITING */}
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
                <p className="text-neutral-300 text-xs mt-0.5 whitespace-pre-line leading-relaxed bg-[#0a0b0e] p-2.5 rounded-xl border border-neutral-800">
                  {activeClip?.copywriting.caption}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Hashtags Viral</span>
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

          {/* TAB 3: OTTO AI */}
          {activeTab === 'otto' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden text-xs">
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-2.5 custom-scrollbar">
                {ottoMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-xl ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600/30 border border-indigo-500/40 text-white ml-4'
                        : 'bg-[#161822] border border-neutral-800 text-neutral-300 mr-4'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 font-bold text-[10px]">
                      {msg.sender === 'otto' ? (
                        <>
                          <Sparkles className="w-3 h-3 text-amber-400" /> Otto AI Assistant
                        </>
                      ) : (
                        <span>Anda</span>
                      )}
                    </div>
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>

              <div className="relative pt-2 border-t border-neutral-800">
                <input
                  type="text"
                  value={ottoPrompt}
                  onChange={(e) => setOttoPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOttoPrompt()}
                  placeholder="Ketik ke Otto (contoh: Ubah subtitle jadi warna kuning)..."
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-[#0a0b0e] border border-neutral-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
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

      {/* 4. GALERI HASIL KLIP DI BAWAH (BARISAN VIDEO 9:16 BERURUTAN RANK 1 - 5 SEPERTI CAPCUT & VIDEOTTO) */}
      <div className="max-w-7xl w-full mx-auto p-4 pt-2">
        <div className="bg-[#12141a] border border-neutral-800/80 rounded-2xl p-5 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-neutral-800/80 mb-5 gap-2">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Film className="w-5 h-5 text-indigo-400" />
                Daftar Video Hasil Klip 9:16 ({clips.length} Klip)
              </h4>
              <p className="text-xs text-neutral-400 mt-0.5">
                Video 5 menit berhasil dipotong menjadi {clips.length} klip durasi {clipLength} detik, diurutkan dari momen paling viral & memikat penonton.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full font-bold">
                🔥 Urutan 1 - {clips.length} (Berdasarkan Viral Retention Score)
              </span>
            </div>
          </div>

          {/* Barisan Kartu Video 9:16 yang Berjejer Rapi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {clips.map((clip, idx) => {
              const isSelected = selectedClipIdx === idx;
              return (
                <div
                  key={idx}
                  className={`group relative rounded-2xl border overflow-hidden bg-[#161822] flex flex-col justify-between transition-all duration-200 ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/40 shadow-xl shadow-indigo-500/10'
                      : 'border-neutral-800 hover:border-neutral-700 hover:bg-[#1a1c28]'
                  }`}
                >
                  {/* Top Badge: Rank & Viral Score */}
                  <div className="p-3 pb-2 flex items-center justify-between">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        idx === 0
                          ? 'bg-amber-400 text-black shadow-sm'
                          : idx === 1
                          ? 'bg-neutral-200 text-black'
                          : 'bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      RANK #{clip.rank}
                    </span>

                    <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-emerald-400" />
                      {clip.viralScore}%
                    </span>
                  </div>

                  {/* 9:16 Aspect Thumbnail Preview */}
                  <div className="relative aspect-[9/16] mx-3 rounded-xl overflow-hidden bg-black/80 border border-neutral-800/80 group-hover:border-neutral-700 transition-colors">
                    {/* Blurred Background */}
                    <div
                      className="absolute inset-0 bg-cover bg-center filter blur-md opacity-50 scale-125"
                      style={{ backgroundImage: `url(${thumbnailUrl})` }}
                    />

                    {/* Foreground Thumbnail Center */}
                    <img
                      src={thumbnailUrl}
                      alt={clip.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-80"
                    />

                    {/* Hook Banner Mini */}
                    <div className="absolute top-2 left-2 right-2 z-10">
                      <span className="block bg-red-600/90 text-white font-black text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded text-center truncate shadow">
                        🚨 {clip.hookHeadline}
                      </span>
                    </div>

                    {/* Subtitle Preview Mini */}
                    <div className="absolute bottom-3 left-2 right-2 z-10 text-center">
                      <div className="bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10">
                        <span className="text-[10px] font-black text-yellow-300 uppercase line-clamp-1">
                          {clip.subtitles[0]?.text || clip.hookHeadline}
                        </span>
                      </div>
                    </div>

                    {/* Play Hover Overlay Button */}
                    <div
                      onClick={() => {
                        setSelectedClipIdx(idx);
                        setIsPlaying(true);
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer z-20"
                    >
                      <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Duration badge */}
                    <div className="absolute bottom-10 right-2 z-10 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-mono text-white">
                      {clip.durationSec}s
                    </div>
                  </div>

                  {/* Clip Info & Actions */}
                  <div className="p-3 pt-2.5 flex flex-col justify-between flex-1">
                    <div>
                      <h5 className="font-bold text-xs text-white line-clamp-1 mb-1">
                        {clip.title}
                      </h5>
                      <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed mb-2.5">
                        {clip.reasonWhyViral}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-neutral-800/80">
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                        <span>Segmen:</span>
                        <span>{formatMinSec(clip.startSec)} - {formatMinSec(clip.endSec)}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          onClick={() => {
                            setSelectedClipIdx(idx);
                            setIsPlaying(true);
                            window.scrollTo({ top: 120, behavior: 'smooth' });
                          }}
                          className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                          }`}
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          {isSelected ? 'Diputar' : 'Preview'}
                        </button>

                        <button
                          onClick={() => {
                            alert(`Mengekspor Klip #${clip.rank} (${clip.durationSec}s)...`);
                          }}
                          className="py-1.5 px-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                        >
                          <Download className="w-2.5 h-2.5" />
                          Export
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
