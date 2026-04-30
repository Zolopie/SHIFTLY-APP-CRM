import { useEffect, useState } from 'react';
import { BrandLogo } from '@/components/BrandLogo';

interface SplashScreenProps {
  onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTimer = setTimeout(() => setProgress(100), 50);
    const finishTimer = setTimeout(() => onFinish?.(), 1300);
    return () => {
      clearTimeout(startTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#020617] text-white">
      <div className="mx-4 w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#0B1220]/95 p-8 shadow-[0_30px_90px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/10">
            <BrandLogo showText={false} className="h-8 w-auto text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Shiftly</h1>
            <p className="mt-2 text-sm text-slate-400">Loading your workforce command center…</p>
          </div>
          <div className="w-full overflow-hidden rounded-full border border-white/10 bg-white/5">
            <div
              className="h-2 rounded-full bg-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-[width] duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
