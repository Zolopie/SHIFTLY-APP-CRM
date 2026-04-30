import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ChartCard({ title, description, actions, footer, children, className }: ChartCardProps) {
  return (
    <div className={cn('rounded-xl border border-white/5 bg-[#0B1220] p-5 shadow-[0_0_25px_rgba(0,0,0,0.18)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{title}</p>
          {description ? <p className="mt-2 text-sm text-slate-400 max-w-xl">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center justify-end gap-3">{actions}</div> : null}
      </div>
      <div className="mt-5 min-h-[260px] rounded-xl bg-[#020617] p-4 shadow-inner shadow-black/10">{children}</div>
      {footer ? <div className="mt-5 border-t border-white/5 pt-4 text-sm text-slate-400">{footer}</div> : null}
    </div>
  );
}
