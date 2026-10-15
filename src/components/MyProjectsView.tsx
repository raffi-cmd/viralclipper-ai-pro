'use client';

import React from 'react';
import { FolderKanban, Play, Trash2, Clock, Calendar, ExternalLink } from 'lucide-react';
import { VideoProject } from '@/lib/types';

interface MyProjectsViewProps {
  projects: VideoProject[];
  onLoadProject: (project: VideoProject) => void;
  onDeleteProject: (projectId: string) => void;
  onNewProject: () => void;
}

export const MyProjectsView: React.FC<MyProjectsViewProps> = ({
  projects,
  onLoadProject,
  onDeleteProject,
  onNewProject,
}) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[500px] border-2 border-dashed border-neutral-800 rounded-3xl bg-[#12141a]/40">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 flex items-center justify-center text-neutral-600 mb-4">
          <FolderKanban className="w-8 h-8" />
        </div>
        <h4 className="text-base font-bold text-neutral-200">Belum Ada Proyek Tersimpan</h4>
        <p className="text-xs text-neutral-400 max-w-sm mt-1 mb-4">
          Semua proyek yang Anda generate di studio otomatis tersimpan di browser ini agar mudah dibuka kembali kapan saja.
        </p>
        <button
          onClick={onNewProject}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md"
        >
          Mulai Proyek Baru
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-400" />
            Riwayat Proyek Saya ({projects.length})
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Daftar proyek video yang tersimpan di memori browser Anda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="p-4 rounded-2xl border border-neutral-800 bg-[#12141a] hover:border-neutral-700 transition-all flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                <img
                  src={proj.thumbnailUrl}
                  alt={proj.name}
                  className="w-full h-full object-cover opacity-80"
                />
                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-mono text-white">
                  {proj.clips.length} Klip
                </span>
              </div>

              <div>
                <h5 className="font-bold text-xs text-white line-clamp-1">{proj.name}</h5>
                <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-neutral-500" />
                    {formatDate(proj.createdAt)}
                  </span>
                  <span>•</span>
                  <span>{proj.clipLength}s per klip</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-800/80">
              <button
                onClick={() => onLoadProject(proj)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all"
              >
                <Play className="w-3 h-3 fill-current" /> Buka Studio
              </button>

              <button
                onClick={() => onDeleteProject(proj.id)}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-all"
                title="Hapus proyek"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
