'use client';

import React from 'react';
import { LayoutTemplate, Check, Sparkles } from 'lucide-react';
import { SubtitleStyleConfig } from '@/lib/types';

interface TemplatesViewProps {
  onApplyTemplate: (template: Partial<SubtitleStyleConfig>) => void;
  activePreset: string;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  onApplyTemplate,
  activePreset,
}) => {
  const templates = [
    {
      id: 'hormozi',
      name: 'Alex Hormozi Viral Gold',
      font: 'Montserrat',
      highlight: '#FFD700',
      textColor: '#FFFFFF',
      box: 'pill' as const,
      description: 'Font tebal Montserrat kapital dengan penyorotan kata aktif kuning emas & drop shadow kontras tinggi.',
    },
    {
      id: 'neon',
      name: 'CapCut Neon Cyan Glow',
      font: 'Impact',
      highlight: '#00FFFF',
      textColor: '#FFFFFF',
      box: 'glow' as const,
      description: 'Gaya modern TikTok dengan efek pendaran cahaya neon cyan pada kata kunci aktif.',
    },
    {
      id: 'minimalist',
      name: 'Clean Minimalist Card',
      font: 'Inter',
      highlight: '#39FF14',
      textColor: '#FFFFFF',
      box: 'card' as const,
      description: 'Font bersih Inter dengan box hitam solid semi-transparan. Sangat mudah dibaca.',
    },
    {
      id: 'comic',
      name: 'Playful Comic Pop',
      font: 'Comic Sans MS',
      highlight: '#FF3B30',
      textColor: '#FFFFFF',
      box: 'pill' as const,
      description: 'Gaya santai dan ceria untuk konten kasual, storytelling, atau komedi.',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="pb-3 border-b border-neutral-800">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5 text-indigo-400" />
          Galeri Template Subtitle & Karaoke
        </h3>
        <p className="text-xs text-neutral-400 mt-0.5">
          Pilih preset typography yang telah dioptimalkan untuk retensi tinggi di TikTok, Reels, dan Shorts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((tpl) => {
          const isActive = activePreset === tpl.id;
          return (
            <div
              key={tpl.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                isActive
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-lg'
                  : 'border-neutral-800 bg-[#12141a] hover:border-neutral-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-sm text-white">{tpl.name}</h5>
                  {isActive && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> Aktif
                    </span>
                  )}
                </div>

                {/* Subtitle Preview Box */}
                <div className="p-4 rounded-xl bg-black/80 flex items-center justify-center text-center">
                  <div
                    className="px-3.5 py-1.5 rounded-2xl bg-black/75 border border-white/10"
                    style={{ fontFamily: tpl.font }}
                  >
                    <span className="font-black text-sm uppercase text-white drop-shadow">
                      TONTON SAMPAI{' '}
                      <span style={{ color: tpl.highlight }} className="underline">
                        HABIS!
                      </span>
                    </span>
                  </div>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed">{tpl.description}</p>
              </div>

              <button
                onClick={() =>
                  onApplyTemplate({
                    fontFamily: tpl.font as any,
                    highlightColor: tpl.highlight,
                    textColor: tpl.textColor,
                    boxStyle: tpl.box,
                    preset: tpl.id as any,
                  })
                }
                className="mt-4 w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Gunakan Template Ini
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
