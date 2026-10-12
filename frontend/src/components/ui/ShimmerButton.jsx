import React from 'react';
import { cn } from '../../utils/cn';

export default function ShimmerButton({
  children,
  onClick,
  disabled,
  className,
  type = 'button',
  variant = 'primary'
}) {
  const styles = {
    primary: 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-900',
    amber: 'bg-amber-600 hover:bg-amber-700 text-white border border-amber-600',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600',
    zinc: 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer active:scale-[0.99]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        styles[variant] || styles.primary,
        className
      )}
    >
      {children}
    </button>
  );
}
