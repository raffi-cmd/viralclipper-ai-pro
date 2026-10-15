'use client';

import React from 'react';
import { Loader2, Download, Sparkles, Languages, Film, CheckCircle, AlertCircle } from 'lucide-react';
import { SSEMessage } from '@/lib/types';

interface ProgressTrackerProps {
  status: SSEMessage | null;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ status }) => {
  if (!status) return null;

  const isError = status.step === 'error';
  const isDone = status.step === 'completed';

  const steps = [
    { key: 'downloading', label: 'Download', icon: Download },
    { key: 'analyzing', label: 'Hook AI', icon: Sparkles },
    { key: 'transcribing', label: 'Subtitle Indo', icon: Languages },
    { key: 'rendering', label: 'Render 9:16', icon: Film },
  ];

  return (
    <div className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {isDone ? (
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          ) : isError ? (
            <AlertCircle className="w-6 h-6 text-rose-500" />
          ) : (
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          )}
          <div>
            <h4 className="font-semibold text-white text-sm">
              {isDone ? 'Pemrosesan Selesai!' : isError ? 'Terjadi Masalah' : 'Memproses Video...'}
            </h4>
            <p className="text-xs text-neutral-400">{status.message}</p>
          </div>
        </div>
        <span className="font-mono text-sm font-bold text-indigo-400">{status.progress}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden mb-6">
        <div
          className={`h-full transition-all duration-500 ease-out ${
            isError ? 'bg-rose-500' : isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
          }`}
          style={{ width: `${status.progress}%` }}
        />
      </div>

      {/* Steps Pipeline Indicators */}
      <div className="grid grid-cols-4 gap-2">
        {steps.map((st) => {
          const Icon = st.icon;
          const isActive = status.step === st.key;
          return (
            <div
              key={st.key}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border text-center transition-all ${
                isActive
                  ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                  : 'border-neutral-800 bg-neutral-950/40 text-neutral-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[11px] font-medium">{st.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
