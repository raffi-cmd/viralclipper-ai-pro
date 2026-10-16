'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Key, Cpu, Globe, Check, X, Server, Sparkles } from 'lucide-react';
import { AISettings, AIProvider } from '@/lib/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AISettings) => void;
  currentSettings: AISettings;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentSettings,
}) => {
  const [provider, setProvider] = useState<AIProvider>(currentSettings.provider || 'google');
  const [apiKey, setApiKey] = useState(currentSettings.apiKey || '');
  const [baseUrl, setBaseUrl] = useState(currentSettings.baseUrl || '');
  const [modelName, setModelName] = useState(currentSettings.modelName || '');
  const [backendServerUrl, setBackendServerUrl] = useState(currentSettings.backendServerUrl || '');

  useEffect(() => {
    setProvider(currentSettings.provider);
    setApiKey(currentSettings.apiKey);
    setBaseUrl(currentSettings.baseUrl || '');
    setModelName(currentSettings.modelName || '');
    setBackendServerUrl(currentSettings.backendServerUrl || '');
  }, [currentSettings, isOpen]);

  if (!isOpen) return null;

  const handleProviderChange = (p: AIProvider) => {
    setProvider(p);
    if (p === 'google') {
      setBaseUrl('');
      setModelName('gemini-1.5-flash');
    } else if (p === 'deepseek') {
      setBaseUrl('https://api.deepseek.com/v1');
      setModelName('deepseek-chat');
    } else if (p === 'openrouter') {
      setBaseUrl('https://openrouter.ai/api/v1');
      setModelName('anthropic/claude-3.5-sonnet');
    } else if (p === 'openai') {
      setBaseUrl('https://api.openai.com/v1');
      setModelName('gpt-4o-mini');
    }
  };

  const handleSave = () => {
    const updated: AISettings = {
      provider,
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim() || undefined,
      modelName: modelName.trim() || undefined,
      backendServerUrl: backendServerUrl.trim() || undefined,
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl text-white my-auto">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold">Pengaturan AI & Backend Engine</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 py-4 text-sm">
          {/* Provider Selector */}
          <div>
            <label className="block text-neutral-400 mb-2 font-medium">Pilih Provider AI</label>
            <div className="grid grid-cols-3 gap-2">
              {(['google', 'openai', 'openrouter', 'deepseek', 'anthropic', 'custom'] as AIProvider[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleProviderChange(p)}
                  className={`px-3 py-2 rounded-lg capitalize border font-medium text-xs transition-all ${
                    provider === p
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="text-neutral-400 mb-1 font-medium flex items-center gap-1.5">
              <Key className="w-4 h-4 text-neutral-500" /> API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-... atau AIzaSy..."
              className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-white font-mono text-xs"
            />
            <span className="text-[10px] text-neutral-500 mt-1 block">
              Disimpan aman secara lokal di browser Anda. Tidak dikirimkan ke server tanpa izin.
            </span>
          </div>

          {/* Custom Base URL */}
          <div>
            <label className="text-neutral-400 mb-1 font-medium flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-neutral-500" /> Custom Base URL (Opsional)
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-white font-mono text-xs"
            />
          </div>

          {/* Custom Model Name */}
          <div>
            <label className="text-neutral-400 mb-1 font-medium flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-neutral-500" /> Model Name
            </label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="gemini-1.5-flash, gpt-4o-mini"
              className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-white text-xs font-mono"
            />
          </div>

          {/* Backend FFmpeg Server Endpoint */}
          <div className="pt-2 border-t border-neutral-800/80">
            <label className="text-neutral-400 mb-1 font-medium flex items-center gap-1.5">
              <Server className="w-4 h-4 text-emerald-400" /> Backend FFmpeg Server URL (Opsional)
            </label>
            <input
              type="text"
              value={backendServerUrl}
              onChange={(e) => setBackendServerUrl(e.target.value)}
              placeholder="http://localhost:3001 atau https://your-ffmpeg-backend.railway.app"
              className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-white text-xs font-mono"
            />
            <span className="text-[10px] text-neutral-500 mt-1 block">
              Kosongkan untuk menggunakan Client-Side Video Rendering Engine bawaan (berjalan 100% di browser).
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 font-medium text-xs"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Simpan Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
};
