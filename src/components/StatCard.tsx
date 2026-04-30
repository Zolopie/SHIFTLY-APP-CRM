import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  accent?: string;
  children?: ReactNode;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  accent = 'text-amber-400',
  className,
  ...props
}: StatCardProps) {
  const Comp = props.onClick ? 'button' : 'div';

  return (
    <Comp
      type={props.onClick ? 'button' : undefined}
      className={cn(
        'group h-full overflow-hidden rounded-xl border border-white/5 bg-[#0B1220] p-5 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(245,158,11,0.15)] focus:outline-none focus:ring-2 focus:ring-amber-500/30',
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{title}</p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{value}</p>
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-white/5', accent)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {description ? <p className="mt-4 text-sm leading-6 text-slate-400">{description}</p> : null}
    </Comp>
  );
}
