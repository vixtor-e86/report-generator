"use client";
import React from 'react';
import { Gift, Sparkles } from 'lucide-react';

export default function StudentLeadFab({ onClick }) {
  return (
    <div className="fixed bottom-24 left-6 z-40 flex items-center group">
      <button
        onClick={onClick}
        className="relative flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white/30 backdrop-blur-sm"
        aria-label="Become a Student Lead and earn 10%"
      >
        {/* Pulsing indicator ring */}
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-yellow-300 border border-orange-600"></span>
        </span>

        {/* Gift icon with wiggle animation on hover */}
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform duration-300">
          <Gift className="w-4 h-4 text-white" />
        </div>

        <div className="flex flex-col text-left leading-tight">
          <span className="text-[10px] font-black uppercase text-amber-100 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-yellow-200" />
            Earn 10%
          </span>
          <span className="text-xs font-black text-white tracking-tight whitespace-nowrap">
            Student Lead
          </span>
        </div>
      </button>
    </div>
  );
}
