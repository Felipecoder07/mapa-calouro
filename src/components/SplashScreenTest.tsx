import { useState, useEffect } from 'react';
import { RefreshCw, Play, MapPin, Sparkles } from 'lucide-react';

interface SplashScreenTestProps {
  onComplete?: () => void;
  standalone?: boolean;
}

export function SplashScreenTest({ onComplete, standalone = true }: SplashScreenTestProps) {
  const [animState, setAnimState] = useState<'animating' | 'sliding' | 'finished'>('animating');
  const [key, setKey] = useState(0);

  useEffect(() => {
    // Stage 1: Run core logo animation for 3.6 seconds (slightly slower & cinematic)
    const timer1 = setTimeout(() => {
      setAnimState('sliding');
    }, 3600);

    // Stage 2: Slide curtain up over 0.8 seconds
    const timer2 = setTimeout(() => {
      setAnimState('finished');
      if (onComplete) onComplete();
    }, 4400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [key, onComplete]);

  const handleReplay = () => {
    setAnimState('animating');
    setKey((prev) => prev + 1);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 font-sans select-none">
      {/* Background Simulated Map (for testing what the reveal looks like) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="z-10 text-center space-y-4 max-w-md px-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400">
            <MapPin className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Mapa do Calouro UFC</h2>
          <p className="text-sm text-slate-400">
            O mapa do campus foi carregado com sucesso em segundo plano!
          </p>
          {standalone && (
            <button
              onClick={handleReplay}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 active:scale-95 shadow-lg shadow-purple-900/40"
            >
              <RefreshCw className="h-4 w-4 animate-spin-once" />
              <span>Testar Animação Novamente</span>
            </button>
          )}
        </div>
      </div>

      {/* Splash Screen Curtain Overlay */}
      {animState !== 'finished' && (
        <div
          key={key}
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#090514] text-white transition-transform duration-800 ease-in-out ${
            animState === 'sliding' ? '-translate-y-full' : 'translate-y-0'
          }`}
        >
          {/* Ambient Glow */}
          <div className="absolute h-96 w-96 rounded-full bg-purple-600/15 blur-3xl" />

          {/* Custom CSS Keyframes Animation Container */}
          <div className="relative flex items-center justify-center mb-8">
            {/* Pulsing Outer Rings */}
            <div className="splash-ring ring-1" />
            <div className="splash-ring ring-2" />
            
            {/* Central Favicon Container */}
            <div className="splash-favicon-box relative z-10 h-28 w-28 rounded-3xl overflow-hidden shadow-2xl shadow-purple-600/50 border border-purple-400/40">
              <img src="/favicon.svg" alt="Favicon Mapa do Calouro UFC" className="h-full w-full object-cover" />
            </div>
          </div>

          {/* Title & Tagline */}
          <div className="z-10 text-center space-y-1.5 splash-text-fade">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300 border border-purple-500/20">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              UFC Campus Russas
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Mapa do Calouro
            </h1>
            <p className="text-xs text-purple-300/60 tracking-widest uppercase font-medium">
              Navegação Universitária Interativa
            </p>
          </div>

          {/* Inline Animation Styles */}
          <style>{`
            .splash-ring {
              position: absolute;
              border-radius: 9999px;
              opacity: 0;
              animation: ringPulse 3.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            }
            .ring-1 {
              width: 140px;
              height: 140px;
              border: 2px solid rgba(139, 92, 246, 0.5);
              animation-delay: 0.2s;
            }
            .ring-2 {
              width: 180px;
              height: 180px;
              border: 2px solid rgba(251, 191, 36, 0.3);
              animation-delay: 0.6s;
            }

            @keyframes ringPulse {
              0% {
                transform: scale(0.6);
                opacity: 0;
              }
              50% {
                opacity: 0.8;
              }
              100% {
                transform: scale(1.45);
                opacity: 0;
              }
            }

            .splash-favicon-box {
              animation: logoBounce 3.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
            }

            @keyframes logoBounce {
              0% {
                transform: scale(0.2) rotate(-12deg);
                opacity: 0;
              }
              35% {
                transform: scale(1.08) rotate(2deg);
                opacity: 1;
              }
              65% {
                transform: scale(0.96) rotate(0deg);
              }
              100% {
                transform: scale(1) rotate(0deg);
                opacity: 1;
              }
            }

            .splash-pin {
              animation: pinPulse 2.4s ease-in-out infinite alternate;
            }
            @keyframes pinPulse {
              0% { transform: translateY(0); }
              100% { transform: translateY(-5px); }
            }

            .splash-dot {
              animation: dotGlow 1.6s ease-in-out infinite alternate;
            }
            @keyframes dotGlow {
              0% { fill: #fbbf24; filter: drop-shadow(0 0 2px #fbbf24); }
              100% { fill: #f59e0b; filter: drop-shadow(0 0 12px #fbbf24); }
            }

            .splash-text-fade {
              animation: textAppear 1.4s ease-out forwards;
              animation-delay: 0.6s;
              opacity: 0;
            }
            @keyframes textAppear {
              from {
                opacity: 0;
                transform: translateY(14px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
