import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ActivityItem {
  title: string;
  description: string;
  timestamp: string;
  icon: LucideIcon;
  accent?: string;
}

interface ActivityListProps {
  title: string;
  items: ActivityItem[];
  className?: string;
}

export function ActivityList({ title, items, className }: ActivityListProps) {
  return (
    <div className={cn('rounded-[2rem] border border-white/10 bg-[#0B1220] p-6 shadow-[0_30px_70px_rgba(0,0,0,0.24)]', className)}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.32em] text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-white">Latest activity</p>
        </div>
      </div>
      <div className="space-y-4">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={`${item.title}-${index}`} className="flex items-start gap-4 rounded-3xl border border-white/5 bg-white/5 p-4 transition-colors duration-200 hover:bg-white/10">
              <div className={cn('mt-1 flex h-11 w-11 items-center justify-center rounded-3xl bg-white/5 text-white', item.accent ?? 'bg-amber-500/15 text-amber-300')}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-sm text-slate-400">{item.description}</p>
              </div>
              <p className="whitespace-nowrap text-xs uppercase tracking-[0.28em] text-slate-500">{item.timestamp}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
