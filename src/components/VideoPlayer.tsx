'use client';

import React from 'react';
import { Download } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl }) => {
  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      <div className="relative aspect-[9/16] w-full rounded-3xl overflow-hidden border-2 border-neutral-800 shadow-2xl bg-black">
        <video
          src={videoUrl}
          controls
          autoPlay
          loop
          className="w-full h-full object-cover"
        />
      </div>

      <a
        href={videoUrl}
        download="viral_clip_9x16.mp4"
        className="mt-4 flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-bold text-white text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]"
      >
        <Download className="w-4 h-4" /> Unduh Video (9:16 HD)
      </a>
    </div>
  );
};
