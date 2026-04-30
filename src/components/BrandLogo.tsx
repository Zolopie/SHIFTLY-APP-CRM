import type { HTMLAttributes } from 'react';

interface BrandLogoProps extends HTMLAttributes<HTMLDivElement> {
  showText?: boolean;
}

export function BrandLogo({ showText = true, className = '', ...props }: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`} {...props}>
      <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-900 via-blue-600 to-cyan-500 shadow-lg shadow-slate-900/20">
        <svg viewBox="0 0 64 64" className="h-8 w-8 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 48c0 0 8-6 16-6s16 6 16 6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18 16c0 0 8 6 16 6s16-6 16-6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 18l-6 6 6 6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M48 18l6 6-6 6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 40l-6 6 6 6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M48 40l6 6-6 6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Shiftly</span>
          <span className="text-xs uppercase tracking-[0.22em] text-slate-600 dark:text-slate-200">Workforce CRM</span>
        </div>
      )}
    </div>
  );
}
