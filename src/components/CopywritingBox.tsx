'use client';

import React, { useState } from 'react';
import { Copy, Check, Hash, Sparkles } from 'lucide-react';

interface CopywritingBoxProps {
  hookHeadline: string;
  caption: string;
  hashtags: string[];
}

export const CopywritingBox: React.FC<CopywritingBoxProps> = ({
  hookHeadline,
  caption,
  hashtags,
}) => {
  const [copied, setCopied] = useState(false);

  const fullText = `${hookHeadline}\n\n${caption}\n\n${hashtags.join(' ')}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-md text-white flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <h4 className="font-bold text-sm">Social Copywriting Ready-to-Post</h4>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Tersalin!' : 'Salin Semua'}
          </button>
        </div>

        {/* Hook Headline */}
        <div className="mb-3">
          <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">Hook Headline</span>
          <p className="font-bold text-sm mt-0.5 text-white">{hookHeadline}</p>
        </div>

        {/* Caption */}
        <div className="mb-3">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Caption</span>
          <p className="text-xs text-neutral-300 mt-0.5 whitespace-pre-line leading-relaxed">{caption}</p>
        </div>

        {/* Hashtags */}
        <div>
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
            <Hash className="w-3 h-3" /> Hashtags
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {hashtags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-xs"
              >
                {tag.startsWith('#') ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
