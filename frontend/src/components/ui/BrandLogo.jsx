import React from 'react';

export default function BrandLogo() {
  return (
    <div className="flex items-center gap-3 select-none group cursor-default">
      {/* Official Café Logo Asset in clean container */}
      <div className="relative flex items-center justify-center shrink-0">
        <img
          src="/logo.png"
          alt="Campus Café Logo"
          className="h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-xs"
        />
      </div>

      {/* Brand Typographic Lockup */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="text-[15px] font-black tracking-tight text-slate-900">
            Campus
          </span>
          <span className="text-[15px] font-black tracking-tight text-amber-700">
            Café
          </span>
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live POS
          </span>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mt-1">
          Specialty Coffee & Inventory
        </span>
      </div>
    </div>
  );
}
