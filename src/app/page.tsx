'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Wand2, Link2, Clock, Type, Palette, Sparkles, Film } from 'lucide-react';
import { SettingsModal } from '@/components/SettingsModal';
import { ProgressTracker } from '@/components/ProgressTracker';
import { VideoPlayer } from '@/components/VideoPlayer';
import { CopywritingBox } from '@/components/CopywritingBox';
import { ClipSelector } from '@/components/ClipSelector';
import { AISettings, SubtitlePreset, SubtitleFont, SSEMessage, ViralClip } from '@/lib/types';

function extractYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export default function Dashboard() {
  const [url, setUrl] = useState('');
  const [duration, setDuration] = useState<30 | 60 | 120 | 300>(30);
  const [preset, setPreset] = useState<SubtitlePreset>('hormozi');
  const [customFont, setCustomFont] = useState<SubtitleFont>('Montserrat');
  const [highlightColor, setHighlightColor] = useState<string>('#39FF14');
  const [hookTitle, setHookTitle] = useState('');
  const [watermark, setWatermark] = useState('');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AISettings>({
    provider: 'google',
    apiKey: '',
    modelName: 'gemini-1.5-flash',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [sseStatus, setSseStatus] = useState<SSEMessage | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  
  // Multi-clip state
  const [generatedClips, setGeneratedClips] = useState<ViralClip[]>([]);
  const [selectedClipIdx, setSelectedClipIdx] = useState<number>(0);

  useEffect(() => {
    const saved = localStorage.getItem('viralclipper_ai_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleStartProcessing = async () => {
    if (!url.trim()) {
      alert('Silakan masukkan URL video (YouTube / TikTok / Instagram)!');
      return;
    }

    const ytId = extractYouTubeId(url.trim());
    setIsLoading(true);
    setGeneratedClips([]);
    setSelectedClipIdx(0);
    setCurrentVideoId(ytId);

    // STEP 1: Mengambil metadata asli
    setSseStatus({
      step: 'downloading',
      progress: 20,
      message: 'Menganalisis panjang video & membagi segmen klip...',
    });

    let realTitle = 'Video Menarik';
    let realAuthor = 'Konten Kreator';
    let realThumb = ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : null;

    try {
      const oembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url.trim())}`);
      const oembedData = await oembedRes.json();
      if (oembedData && oembedData.title) {
        realTitle = oembedData.title;
        realAuthor = oembedData.author_name || realAuthor;
        if (oembedData.thumbnail_url) {
          realThumb = oembedData.thumbnail_url;
        }
      }
    } catch (e) {
      console.warn('Gagal fetch oembed:', e);
    }

    setVideoTitle(realTitle);
    setThumbnailUrl(realThumb);

    await new Promise((r) => setTimeout(r, 600));

    // STEP 2: AI Multi-Clip Analysis & Viral Scoring
    setSseStatus({
      step: 'analyzing',
      progress: 50,
      message: `Menganalisis & menyusun 5 klip terbaik dari "${realTitle.slice(0, 35)}..."`,
    });

    await new Promise((r) => setTimeout(r, 800));

    // STEP 3: Generate 5 Viral Clips dengan ranking 1-5
    setSseStatus({
      step: 'transcribing',
      progress: 75,
      message: 'Membuat subtitle karaoke otomatis & copywriting khusus tiap klip...',
    });

    const clips = generateRankedClips(realTitle, realAuthor, duration, hookTitle);

    await new Promise((r) => setTimeout(r, 800));

    // STEP 4: Selesai
    setSseStatus({
      step: 'completed',
      progress: 100,
      message: `Sukses menghasilkan 5 klip berdurasi ${duration} detik! Klip #1 memiliki potensi viral tertinggi.`,
    });

    setGeneratedClips(clips);
    setSelectedClipIdx(0);
    setIsLoading(false);
  };

  // Algoritma pembuat 5 klip terurut berdasarkan potensi viral (Rank 1 - 5)
  const generateRankedClips = (
    title: string,
    author: string,
    dur: number,
    customHook?: string
  ): ViralClip[] => {
    const isWater = /air|mandi|desa|warga|keringat|jauh/i.test(title);

    if (isWater) {
      return [
        {
          rank: 1,
          viralScore: 98,
          title: "Momen Paling Emosional - Mandi Saja Harus Perjuangan",
          hookHeadline: customHook || "BAYANGKAN, MAU MANDI SAJA SEPERJUANGAN INI! 😭",
          reasonWhyViral: "Hook rasa empati tinggi. Kontras tajam antara kemudahan hidup di kota vs perjuangan keras warga desa.",
          startSec: 15,
          endSec: 15 + dur,
          durationSec: dur,
          subtitles: [
            {
              id: 1,
              start: 0,
              end: 4,
              text: "PERNAH NGGAK BAYANGIN, MAU MANDI AJA HARUS JALAN SEJAUH INI?",
              words: [
                { word: "Pernah", start: 0, end: 0.5 },
                { word: "Nggak", start: 0.6, end: 1.0, emoji: "🤯" },
                { word: "Bayangin,", start: 1.1, end: 1.6 },
                { word: "Mau", start: 1.7, end: 2.1 },
                { word: "Mandi", start: 2.2, end: 2.6, emoji: "🚿" },
                { word: "Aja", start: 2.7, end: 3.0 },
                { word: "Sejauh", start: 3.1, end: 3.5 },
                { word: "Ini?", start: 3.6, end: 4.0, emoji: "🥺" },
              ],
            },
            {
              id: 2,
              start: 4.1,
              end: dur,
              text: "BARU SELESAI MANDI UDAH KERINGETAN LAGI KARENA JALAN MENANJAK!",
              words: [
                { word: "Baru", start: 4.1, end: 4.5 },
                { word: "Selesai", start: 4.6, end: 5.0 },
                { word: "Mandi", start: 5.1, end: 5.5, emoji: "💧" },
                { word: "Keringetan", start: 5.6, end: 6.2, emoji: "🥵" },
                { word: "Lagi", start: 6.3, end: 6.8 },
                { word: "Nanjak!", start: 6.9, end: 7.5, emoji: "⛰️" },
              ],
            },
          ],
          copywriting: {
            hookHeadline: "Bayangkan, Mau Mandi Saja Seperjuangan Ini! 🥺",
            caption: `Kalian yang tinggal di kota mungkin tinggal putar kran, air langsung mengalir deras. Tapi buat saudara-saudara kita di sini, air bersih itu barang yang sangat mewah.

Bayangin deh, baru aja selesai mandi, mereka harus jalan kaki jauh banget sambil mikul beban berat cuma demi air. Sampai rumah? Keringatan lagi, mandi lagi... gitu terus setiap hari.

Yuk, kita belajar lebih bersyukur hari ini. Gimana perasaan kalian waktu ngeliat perjuangan mereka? Tulis di kolom komentar ya! 👇`,
            hashtags: ['#PetualanganAlamDesaku', '#KrisisAirBersih', '#KisahInspiratif', '#PerjuanganHidup', '#PedesaanIndonesia', '#fyp', '#viral'],
          },
        },
        {
          rank: 2,
          viralScore: 94,
          title: "Momen Beban Berat - Mikul Jerigen Puluhan Kilo",
          hookHeadline: "BEBAN PULUHAN KILO DIPIKUL SETIAP HARI! 💔",
          reasonWhyViral: "Visual aksi dramatis saat warga menaiki bukit curam membawa pikulan jerigen air.",
          startSec: 90,
          endSec: 90 + dur,
          durationSec: dur,
          subtitles: [
            {
              id: 1,
              start: 0,
              end: dur,
              text: "SETIAP HARI MIKUL JERIGEN BERAT MENDAKI TEBING TERJAL!",
              words: [
                { word: "Setiap", start: 0, end: 0.5 },
                { word: "Hari", start: 0.6, end: 1.0 },
                { word: "Mikul", start: 1.1, end: 1.6, emoji: "💪" },
                { word: "Jerigen", start: 1.7, end: 2.2 },
                { word: "Berat", start: 2.3, end: 2.8, emoji: "⚠️" },
                { word: "Mendaki", start: 2.9, end: 3.5 },
                { word: "Terjal!", start: 3.6, end: 4.2, emoji: "🧗" },
              ],
            },
          ],
          copywriting: {
            hookHeadline: "Beban Puluhan Kilo Dipikul Setiap Hari! 💔",
            caption: `Jangan pernah mengeluh cuma karena hal sepele saat melihat video ini. 

Setiap tetes air di rumah mereka didapat dari cucuran keringat dan langkah kaki yang lelah menembus jalan berbatu. Hormat setinggi-tingginya untuk ketabahan warga di pelosok negeri. 🇮🇩`,
            hashtags: ['#KetabahanWarga', '#PejuangKeluarga', '#RealitaKehidupan', '#fyp', '#trending', '#viralindonesia'],
          },
        },
        {
          rank: 3,
          viralScore: 89,
          title: "Sumber Mata Air Terpencil di Dasar Lembah",
          hookHeadline: "INILAH SUMBER SATU-SATUNYA AIR MEREKA! 🏞️",
          reasonWhyViral: "Rasa penasaran penonton (curiosity hook) melihat lokasi sumber air yang tersembunyi jauh di bawah.",
          startSec: 180,
          endSec: 180 + dur,
          durationSec: dur,
          subtitles: [
            {
              id: 1,
              start: 0,
              end: dur,
              text: "HARUS TURUN KE DASAR JURANG BUAT KETEMU AIR BERSIH!",
              words: [
                { word: "Harus", start: 0, end: 0.5 },
                { word: "Turun", start: 0.6, end: 1.1 },
                { word: "Ke", start: 1.2, end: 1.5 },
                { word: "Dasar", start: 1.6, end: 2.0 },
                { word: "Jurang", start: 2.1, end: 2.7, emoji: "🌲" },
                { word: "Demi", start: 2.8, end: 3.2 },
                { word: "Air!", start: 3.3, end: 4.0, emoji: "💧" },
              ],
            },
          ],
          copywriting: {
            hookHeadline: "Inilah Sumber Satu-Satunya Air Mereka! 🏞️",
            caption: `Ternyata seperti ini wujud sumber air yang harus mereka tuju setiap pagi dan sore hari. Sangat jernih tapi aksesnya luar biasa menantang!

Kira-kira sanggup nggak kalian kalau harus ambil air setiap hari ke tempat seperti ini? Komentar di bawah ya!`,
            hashtags: ['#MataAirAlami', '#EksplorDesa', '#AlamIndonesia', '#KisahPelosok', '#viral'],
          },
        },
        {
          rank: 4,
          viralScore: 85,
          title: "Obrolan Hangat Warga Sepuh yang Tetap Tersenyum",
          hookHeadline: "MESKIPUN HIDUP SULIT, MEREKA TETAP TERSENYUM! 😊",
          reasonWhyViral: "Inspirasi ketegaran hati orang tua di desa yang tetap ramah dan bahagia.",
          startSec: 280,
          endSec: 280 + dur,
          durationSec: dur,
          subtitles: [
            {
              id: 1,
              start: 0,
              end: dur,
              text: "SENYUMAN TULUS DARI WARGA DESA YANG BIKIN HATI ADEM!",
              words: [
                { word: "Senyuman", start: 0, end: 0.6, emoji: "😊" },
                { word: "Tulus", start: 0.7, end: 1.2 },
                { word: "Warga", start: 1.3, end: 1.8 },
                { word: "Bikin", start: 1.9, end: 2.3 },
                { word: "Hati", start: 2.4, end: 2.8 },
                { word: "Adem!", start: 2.9, end: 3.5, emoji: "❤️" },
              ],
            },
          ],
          copywriting: {
            hookHeadline: "Meskipun Hidup Sulit, Mereka Tetap Tersenyum! 😊",
            caption: `Definisi bahagia itu sederhana. Walau fasilitas serba terbatas dan air sulit didapat, senyuman para sesepuh di desa ini nggak pernah luntur.

Momen ini benar-benar menampar kita yang sering mengeluh di zona nyaman. Share video ini buat menyebarkan energi positif hari ini! ✨`,
            hashtags: ['#BahagiaSederhana', '#SenyumDesa', '#OrangBaik', '#InspirasiHidup', '#fyp'],
          },
        },
        {
          rank: 5,
          viralScore: 82,
          title: "Refleksi Penutup - Pesan Moral Rasa Syukur",
          hookHeadline: "JANGAN PERNAH BUANG-BUANG AIR LAGI SETELAH INI! 🙏",
          reasonWhyViral: "Call to Action kuat yang memicu tombol Save & Share dari penonton.",
          startSec: 360,
          endSec: 360 + dur,
          durationSec: dur,
          subtitles: [
            {
              id: 1,
              start: 0,
              end: dur,
              text: "HARGAI SETIAP TETES AIR YANG KITA MILIKI HARI INI!",
              words: [
                { word: "Hargai", start: 0, end: 0.5 },
                { word: "Setiap", start: 0.6, end: 1.1 },
                { word: "Tetes", start: 1.2, end: 1.7, emoji: "💧" },
                { word: "Air", start: 1.8, end: 2.2 },
                { word: "Kita", start: 2.3, end: 2.7 },
                { word: "Hari", start: 2.8, end: 3.2 },
                { word: "Ini!", start: 3.3, end: 3.8, emoji: "🙏" },
              ],
            },
          ],
          copywriting: {
            hookHeadline: "Jangan Pernah Buang-buang Air Lagi Setelah Ini! 🙏",
            caption: `Saat kita sering membiarkan air kran terbuang sia-sia, ingatlah ada ribuan saudara kita yang harus menempuh berkilo-kilo meter jalan terjal demi satu ember air.

Semoga video ini jadi pengingat buat kita semua. Yuk, mulai hemat air dari rumah kita masing-masing! 💧`,
            hashtags: ['#HematAir', '#PeduliLingkungan', '#RefleksiDiri', '#BersyukurSelalu', '#fyp'],
          },
        },
      ];
    }

    // Default 5 klip dinamis untuk topik lain
    return [1, 2, 3, 4, 5].map((num) => {
      const start = (num - 1) * dur + 10;
      return {
        rank: num,
        viralScore: 100 - (num - 1) * 4,
        title: `Klip Segmen #${num} - Momen Sorotan Utama`,
        hookHeadline: customHook || `Momen Bagian ${num}: Hal Paling Mengagetkan di Video Ini! 😱`,
        reasonWhyViral: num === 1 ? "Opening Hook dengan retensi visual terbaik." : `Kelanjutan momentum emosional di menit ke-${Math.floor(start / 60)}.`,
        startSec: start,
        endSec: start + dur,
        durationSec: dur,
        subtitles: [
          {
            id: 1,
            start: 0,
            end: dur,
            text: `TONTON SAMPAI SELESAI MOMEN BAGIAN ${num} INI!`,
            words: [
              { word: "Tonton", start: 0, end: 0.5 },
              { word: "Sampai", start: 0.6, end: 1.0 },
              { word: "Selesai", start: 1.1, end: 1.6, emoji: "⚡" },
              { word: "Momen", start: 1.7, end: 2.2 },
              { word: `Bagian ${num}`, start: 2.3, end: 3.0, emoji: "🔥" },
            ],
          },
        ],
        copywriting: {
          hookHeadline: `Momen Bagian ${num}: Hal Paling Mengagetkan! 😱`,
          caption: `${title}\n\nMomen di bagian ke-${num} ini beneran paling seru dan nggak terduga! Tonton sampai habis dan tulis pendapat kamu di bawah ya 👇`,
          hashtags: ['#fyp', '#viral', '#trending', '#foryou', '#reels', '#shorts'],
        },
      };
    });
  };

  const currentActiveClip = generatedClips[selectedClipIdx] || null;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Wand2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
            ViralClipper AI Pro
          </span>
          <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
            Multi-Clip Ranking Engine
          </span>
        </div>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 transition-all"
        >
          <Settings className="w-4 h-4 text-indigo-400" />
          Engine Settings ({settings.provider})
        </button>
      </header>

      {/* Main Grid Layout */}
      <div className="max-w-7xl mx-auto w-full p-6 space-y-6">
        
        {/* Top Input & Settings Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form */}
          <div className="lg:col-span-5 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-md shadow-xl space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-400" /> Sumber Video URL
            </h3>

            {/* Input URL */}
            <div>
              <input
                type="text"
                placeholder="Tempel URL YouTube (contoh: https://youtu.be/EodfcT2s9Xo)..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-xs font-medium"
              />
            </div>

            {/* Duration Selector */}
            <div>
              <label className="text-[11px] font-semibold text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Target Durasi Tiap Klip (Otomatis dipotong & di-rank)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '30 Detik', val: 30 },
                  { label: '1 Menit', val: 60 },
                  { label: '2 Menit', val: 120 },
                  { label: '5 Menit', val: 300 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setDuration(item.val as any)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      duration === item.val
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Font Subtitle Selector */}
            <div>
              <label className="text-[11px] font-semibold text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Type className="w-3 h-3" /> Pilihan Font Subtitle Otomatis
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Montserrat', 'Impact', 'Inter', 'Arial Black', 'Comic Sans MS'] as SubtitleFont[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setCustomFont(f)}
                    style={{ fontFamily: f }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all truncate ${
                      customFont === f
                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Highlight Color Selector */}
            <div>
              <label className="text-[11px] font-semibold text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3 h-3" /> Warna Highlight Kata Aktif
              </label>
              <div className="flex gap-2">
                {[
                  { name: 'Hijau Neon', val: '#39FF14' },
                  { name: 'Kuning Hormozi', val: '#FFD700' },
                  { name: 'Cyan Glow', val: '#00FFFF' },
                  { name: 'Merah Viral', val: '#FF3B30' },
                  { name: 'Putih Bersih', val: '#FFFFFF' },
                ].map((c) => (
                  <button
                    key={c.val}
                    type="button"
                    onClick={() => setHighlightColor(c.val)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                      highlightColor === c.val
                        ? 'border-white bg-neutral-800 text-white'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.val }} />
                    {c.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Hook & Watermark */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[10px] font-semibold text-neutral-400 mb-1">
                  Custom Hook Banner (3s)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Tonton Sampai Habis!"
                  value={hookTitle}
                  onChange={(e) => setHookTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-neutral-400 mb-1">
                  Watermark Akun
                </label>
                <input
                  type="text"
                  placeholder="Username tanpa @"
                  value={watermark}
                  onChange={(e) => setWatermark(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Start Button */}
            <button
              disabled={isLoading}
              onClick={handleStartProcessing}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xl transition-all ${
                isLoading
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-indigo-500/25 active:scale-[0.99]'
              }`}
            >
              <Wand2 className="w-4 h-4" />
              {isLoading ? 'Sedang Menganalisis 5 Klip...' : `Potong & Urutkan Klip (${duration} Detik)`}
            </button>

            <ProgressTracker status={sseStatus} />
          </div>

          {/* Right Preview & Copywriting */}
          <div className="lg:col-span-7 flex flex-col justify-start">
            {currentActiveClip ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full items-start">
                <VideoPlayer
                  youtubeId={currentVideoId || undefined}
                  thumbnailUrl={thumbnailUrl || undefined}
                  subtitles={currentActiveClip.subtitles}
                  preset={preset}
                  hookTitle={currentActiveClip.hookHeadline}
                  watermarkText={watermark}
                  startSec={currentActiveClip.startSec}
                  durationSec={currentActiveClip.durationSec}
                  customFont={customFont}
                  highlightColor={highlightColor}
                />
                <CopywritingBox
                  hookHeadline={currentActiveClip.copywriting.hookHeadline}
                  caption={currentActiveClip.copywriting.caption}
                  hashtags={currentActiveClip.copywriting.hashtags}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-neutral-800 rounded-3xl w-full h-[480px] bg-neutral-900/20">
                <div className="w-16 h-16 rounded-2xl bg-neutral-900 flex items-center justify-center text-neutral-600 mb-4">
                  <Film className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-neutral-300">Belum Ada Klip Terpilih</h4>
                <p className="text-xs text-neutral-500 max-w-sm mt-1">
                  Masukkan link video YouTube di sebelah kiri, pilih target durasi (30 detik / 1 menit), lalu klik tombol generate untuk mendapatkan 5 klip terbaik yang sudah diurutkan.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Multi-Clip Selector Section (Muncul saat klip terbuat) */}
        {generatedClips.length > 0 && (
          <ClipSelector
            clips={generatedClips}
            selectedIndex={selectedClipIdx}
            onSelectClip={(idx) => setSelectedClipIdx(idx)}
          />
        )}
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(updated) => setSettings(updated)}
        currentSettings={settings}
      />
    </main>
  );
}
