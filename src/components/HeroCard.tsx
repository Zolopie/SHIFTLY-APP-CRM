import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface HeroCardProps {
  title: string;
  subtitle: string;
  value: string;
  metricLabel: string;
  metricValue: string;
  chart: ReactNode;
  trendLabel: string;
  trendValue: string;
  trendPositive?: boolean;
  description?: string;
  className?: string;
}

export function HeroCard({
  title,
  subtitle,
  value,
  metricLabel,
  metricValue,
  chart,
  trendLabel,
  trendValue,
  trendPositive = true,
  description,
  className,
}: HeroCardProps) {
  return (
    <div
      className={cn(
        'group overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#0a172b] via-[#0b1220] to-[#020617] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_45px_140px_rgba(245,158,11,0.22)]',
        className,
      )}
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-3xl bg-white/10 ring-1 ring-white/10" />
            <p className="text-sm uppercase tracking-[0.32em] text-slate-400">{title}</p>
          </div>
          <div className="space-y-3">
            <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl">{value}</h1>
            <p className="max-w-md text-sm text-slate-300">{subtitle}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">{metricLabel}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{metricValue}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">{trendLabel}</p>
              <p className={cn('mt-2 text-2xl font-semibold', trendPositive ? 'text-emerald-400' : 'text-rose-400')}>{trendValue}</p>
            </div>
          </div>
          {description ? <p className="text-sm leading-6 text-slate-400">{description}</p> : null}
        </div>

        <div className="min-h-[240px] w-full rounded-[2rem] bg-[#020617]/80 p-4 shadow-inner shadow-black/20 lg:w-[420px]">
          {chart}
        </div>
      </div>
    </div>
  );
}
