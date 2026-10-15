'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Wand2, Link2, Clock, Type } from 'lucide-react';
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
    if (!url) return alert('Silakan masukkan URL video (YouTube / TikTok / Instagram)!');
    if (!settings.apiKey) {
      setIsSettingsOpen(true);
      return alert('Harap isi API Key di menu Pengaturan terlebih dahulu!');
    }

    setIsLoading(true);
    setFinalVideoUrl(null);
    setFinalAnalysis(null);
    setSseStatus({ step: 'downloading', progress: 5, message: 'Menghubungkan ke engine...' });

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          targetDuration: duration,
          preset,
          hookTitle,
          watermarkText: watermark,
          settings,
        }),
      });

      if (!response.body) throw new Error('Tidak dapat membaca SSE response stream.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data: SSEMessage = JSON.parse(line.replace('data: ', ''));
            setSseStatus(data);

            if (data.step === 'completed' && data.data) {
              setFinalVideoUrl(data.data.videoUrl || null);
              setFinalAnalysis(data.data.analysis || null);
              setIsLoading(false);
            } else if (data.step === 'error') {
              setIsLoading(false);
            }
          }
        }
      }
    } catch (err: any) {
      setSseStatus({ step: 'error', progress: 0, message: err.message });
      setIsLoading(false);
    }
  };

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

          {/* Real-time SSE Status */}
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
