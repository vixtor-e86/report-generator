"use client";
import React from 'react';
import { Gift, Sparkles } from 'lucide-react';

export default function StudentLeadFab({ onClick }) {
  return (
    <div className="fixed bottom-[4.5rem] left-3 sm:bottom-24 sm:left-6 z-40 flex items-center group">
      <button
        onClick={onClick}
        className="relative flex items-center gap-1.5 sm:gap-2.5 px-2.5 py-1.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/40 sm:border-2 backdrop-blur-sm"
        aria-label="Become a Student Lead and earn 10%"
      >
        {/* Pulsing indicator ring */}
        <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 flex h-2.5 w-2.5 sm:h-3.5 sm:w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 bg-yellow-300 border border-orange-600"></span>
        </span>

        {/* Gift icon with wiggle animation on hover */}
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform duration-300">
          <Gift className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        </div>

        <div className="flex flex-col text-left leading-none sm:leading-tight">
          <span className="text-[7.5px] sm:text-[10px] font-black uppercase text-amber-100 flex items-center gap-0.5 sm:gap-1">
            <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-yellow-200" />
            Earn 10%
          </span>
          <span className="text-[10px] sm:text-xs font-black text-white tracking-tight whitespace-nowrap mt-0.5 sm:mt-0">
            Student Lead
          </span>
        </div>
      </button>
    </div>
  );
}
