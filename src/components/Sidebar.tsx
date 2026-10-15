'use client';

import React from 'react';
import {
  Film,
  FolderKanban,
  BookmarkCheck,
  LayoutTemplate,
  Settings,
  Sparkles,
  PlusCircle,
  HelpCircle
} from 'lucide-react';

export type ActiveNav = 'studio' | 'projects' | 'clips' | 'templates' | 'settings';

interface SidebarProps {
  activeNav: ActiveNav;
  onNavigate: (nav: ActiveNav) => void;
  savedProjectsCount: number;
  savedClipsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  onNavigate,
  savedProjectsCount,
  savedClipsCount,
}) => {
  const menuItems = [
    {
      id: 'studio',
      label: 'Video Studio',
      icon: Film,
      badge: 'Live',
    },
    {
      id: 'projects',
      label: 'My Projects',
      icon: FolderKanban,
      count: savedProjectsCount,
    },
    {
      id: 'clips',
      label: 'My Clips',
      icon: BookmarkCheck,
      count: savedClipsCount,
    },
    {
      id: 'templates',
      label: 'Caption Presets',
      icon: LayoutTemplate,
      badge: 'Pro',
    },
    {
      id: 'settings',
      label: 'AI & Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-60 bg-[#0f1117] border-r border-neutral-800/80 flex flex-col justify-between p-3 select-none">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-3 py-3 mb-4 border-b border-neutral-800/60">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Film className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-white">ViralClipper</span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-neutral-400">AI Video Studio</p>
          </div>
        </div>

        {/* Quick New Project Button */}
        <button
          onClick={() => onNavigate('studio')}
          className="w-full mb-4 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          New Project
        </button>

        {/* Navigation List */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as ActiveNav)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-neutral-500'}`} />
                  <span>{item.label}</span>
                </div>

                {item.count !== undefined && item.count > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-bold">
                    {item.count}
                  </span>
                )}

                {item.badge && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      item.badge === 'Live'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info / Storage Notice */}
      <div className="p-3 rounded-xl bg-[#141620] border border-neutral-800/80 text-[11px] text-neutral-400 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-neutral-300">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Client Storage Active
        </div>
        <p className="text-[10px] leading-relaxed text-neutral-400">
          Proyek tersimpan lokal di browser ini. Tidak ada data rahasia yang dikirim ke server pihak ketiga tanpa izin.
        </p>
      </div>
    </aside>
  );
};
