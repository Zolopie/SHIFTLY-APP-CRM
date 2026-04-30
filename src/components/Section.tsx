import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Section({ title, description, children, className }: SectionProps) {
  return (
    <section className={cn('rounded-xl border border-white/5 bg-[#0B1220] p-5 shadow-[0_0_25px_rgba(0,0,0,0.18)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]', className)}>
      {(title || description) && (
        <div className="mb-5 space-y-2">
          {title ? <h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2> : null}
          {description ? <p className="text-sm text-slate-400">{description}</p> : null}
        </div>
      )}
      {children}
    </section>
  );
}
