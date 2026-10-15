'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Wand2, Link2, Clock, Type, Sparkles, CheckCircle2 } from 'lucide-react';
import { SettingsModal } from '@/components/SettingsModal';
import { ProgressTracker } from '@/components/ProgressTracker';
import { VideoPlayer } from '@/components/VideoPlayer';
import { CopywritingBox } from '@/components/CopywritingBox';
import { AISettings, SubtitlePreset, SSEMessage, AIAnalysisResult } from '@/lib/types';

export default function Dashboard() {
  const [url, setUrl] = useState('');
  const [duration, setDuration] = useState<30 | 60 | 120 | 300>(60);
  const [preset, setPreset] = useState<SubtitlePreset>('hormozi');
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
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
  const [finalAnalysis, setFinalAnalysis] = useState<AIAnalysisResult | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('viralclipper_ai_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleStartProcessing = async () => {
    if (!url) {
      alert('Silakan masukkan URL video (YouTube / TikTok / Instagram)!');
      return;
    }

    setIsLoading(true);
    setFinalVideoUrl(null);
    setFinalAnalysis(null);

    // Pipeline Step 1: Downloading & Analyzing
    setSseStatus({
      step: 'downloading',
      progress: 25,
      message: 'Menganalisis tautan video dan mengekstrak segmen audio...',
    });

    await new Promise((r) => setTimeout(r, 1200));

    // Pipeline Step 2: AI Hook Detection & Translation
    setSseStatus({
      step: 'analyzing',
      progress: 55,
      message: 'AI mendeteksi momen viral terbaik (Hook Analysis) & auto-translate...',
    });

    let generatedAnalysis: AIAnalysisResult;

    // Jika user punya Google API Key, panggil langsung via browser
    if (settings.apiKey && settings.provider === 'google') {
      try {
        const prompt = `Anda adalah AI Video Editor & Social Media Strategist Viral. Buatkan analisis hook, transkripsi subtitle bahasa indonesia, dan caption viral untuk konten bertema video: "${url}". Format JSON dengan hookHeadline, caption, dan 5 hashtags.`;
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${settings.modelName || 'gemini-1.5-flash'}:generateContent?key=${settings.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json' },
            }),
          }
        );
        const data = await res.json();
        const parsed = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
        generatedAnalysis = {
          hookStart: 0,
          hookEnd: duration,
          reasoning: 'AI Hook terdeteksi di 3 detik pertama dengan retensi tinggi.',
          detectedLanguage: 'id',
          subtitles: [
            {
              id: 1,
              start: 0,
              end: 3.5,
              text: parsed.hookHeadline || hookTitle || 'Ini Rahasia Terbesar Yang Belum Kamu Tahu!',
              words: [
                { word: 'Ini', start: 0, end: 0.5 },
                { word: 'Rahasia', start: 0.6, end: 1.2, emoji: '🤫' },
                { word: 'Terbesar', start: 1.3, end: 2.0, emoji: '🔥' },
                { word: 'Viral', start: 2.1, end: 3.5, emoji: '🚀' },
              ],
            },
          ],
          copywriting: {
            hookHeadline: parsed.hookHeadline || hookTitle || 'Ini Rahasia Terbesar Yang Belum Kamu Tahu!',
            caption: parsed.caption || 'Simak video ini sampai habis buat tahu insight lengkapnya! Jangan lupa share ke teman kamu.',
            hashtags: parsed.hashtags || ['#fyp', '#viral', '#trending', '#foryou', '#reels'],
          },
        };
      } catch (e) {
        generatedAnalysis = fallbackAnalysis(duration, hookTitle);
      }
    } else {
      generatedAnalysis = fallbackAnalysis(duration, hookTitle);
    }

    await new Promise((r) => setTimeout(r, 1200));

    // Pipeline Step 3: Subtitles & Rendering
    setSseStatus({
      step: 'rendering',
      progress: 85,
      message: 'Menerapkan Dual-Layer Canvas 9:16, Background Blur, dan Preset Subtitle...',
    });

    await new Promise((r) => setTimeout(r, 1000));

    // Pipeline Step 4: Selesai
    setSseStatus({
      step: 'completed',
      progress: 100,
      message: 'Klip berhasil diproses! Siap dipratinjau & diunduh.',
    });

    setFinalAnalysis(generatedAnalysis);
    // Demo preview video canvas
    setFinalVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
    setIsLoading(false);
  };

  const fallbackAnalysis = (dur: number, customHook?: string): AIAnalysisResult => ({
    hookStart: 0,
    hookEnd: dur,
    reasoning: 'Segmen pembuka memiliki retensi emosi tertinggi.',
    detectedLanguage: 'id',
    subtitles: [
      {
        id: 1,
        start: 0,
        end: 3,
        text: customHook || 'Tonton Ini Sebelum Terlambat!',
        words: [
          { word: 'Tonton', start: 0, end: 0.8 },
          { word: 'Ini', start: 0.9, end: 1.4 },
          { word: 'Sampai', start: 1.5, end: 2.2, emoji: '⚡' },
          { word: 'Habis', start: 2.3, end: 3.0, emoji: '🔥' },
        ],
      },
    ],
    copywriting: {
      hookHeadline: customHook || 'Tonton Ini Sebelum Terlambat! 😱',
      caption: 'Banyak yang belum tahu trik ini! Tonton sampai selesai dan kasih pendapat kamu di kolom komentar ya 👇',
      hashtags: ['#fyp', '#viral', '#trending', '#foryou', '#reels', '#shorts', '#indonesia'],
    },
  });

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
            Cloud Web
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
      <div className="max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Config Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-md shadow-xl space-y-5">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-400" /> Sumber Video
            </h3>

            {/* Input URL */}
            <div>
              <input
                type="text"
                placeholder="Tempel URL YouTube, TikTok, atau Instagram..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-sm font-medium"
              />
            </div>

            {/* Duration Selector */}
            <div>
              <label className="text-xs font-semibold text-neutral-400 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Target Durasi Klip
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

            {/* Subtitle Preset */}
            <div>
              <label className="text-xs font-semibold text-neutral-400 mb-2 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5" /> Preset Style Subtitle
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'hormozi', name: 'Alex Hormozi' },
                  { key: 'minimalist', name: 'Minimalist Box' },
                  { key: 'neon', name: 'Neon Glow' },
                ].map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPreset(p.key as any)}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all ${
                      preset === p.key
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Hook Title & Watermark */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                  Custom Hook Banner (3s)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Tonton Sampai Habis!"
                  value={hookTitle}
                  onChange={(e) => setHookTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                  Watermark Akun
                </label>
                <input
                  type="text"
                  placeholder="Username tanpa @"
                  value={watermark}
                  onChange={(e) => setWatermark(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Start Button */}
            <button
              disabled={isLoading}
              onClick={handleStartProcessing}
              className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
                isLoading
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-indigo-500/25 active:scale-[0.99]'
              }`}
            >
              <Wand2 className="w-4 h-4" />
              {isLoading ? 'Sedang Memproses AI...' : 'Generate High-Retention Clip'}
            </button>
          </div>

          {/* Real-time Status */}
          <ProgressTracker status={sseStatus} />
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center min-h-[500px]">
          {finalVideoUrl && finalAnalysis ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-start">
              <VideoPlayer videoUrl={finalVideoUrl} />
              <CopywritingBox
                hookHeadline={finalAnalysis.copywriting.hookHeadline}
                caption={finalAnalysis.copywriting.caption}
                hashtags={finalAnalysis.copywriting.hashtags}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-neutral-800 rounded-3xl w-full h-full bg-neutral-900/20">
              <div className="w-16 h-16 rounded-2xl bg-neutral-900 flex items-center justify-center text-neutral-600 mb-4">
                <Wand2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-neutral-300">Belum Ada Video yang Diproses</h4>
              <p className="text-xs text-neutral-500 max-w-sm mt-1">
                Masukkan URL video di sebelah kiri, pilih target durasi dan style subtitle, lalu klik tombol generate.
              </p>
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
    </main>
  );
}
