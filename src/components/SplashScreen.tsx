import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onFinish, 400);
    }, 1200);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#020617] transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="text-center space-y-6">

        {/* 👇 THIS IS STEP 4 */}
        <img
          src={logo}
          alt="Shiftly"
          className="h-32 mx-auto animate-fade-in drop-shadow-[0_0_25px_rgba(245,158,11,0.35)]"
        />

        <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-amber-400 animate-loading-bar" />
        </div>

        <p className="text-slate-400 text-sm">
          Loading Shiftly...
        </p>

      </div>
    </div>
  );
}