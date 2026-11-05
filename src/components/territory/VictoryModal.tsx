import { useState } from 'react';
import { Trophy, Share2, Map, CheckCircle2, Sparkles, X } from 'lucide-react';
import type { Territory } from './types';
import { formatArea, formatDistance, formatTime, generateSvgPolygonPath } from './geoUtils';
import { ConfettiCanvas } from './ConfettiCanvas';

interface VictoryModalProps {
  territory: Territory;
  elapsedSeconds: number;
  totalDistanceMeters: number;
  onClose: () => void;
  onViewOnMap: () => void;
}

export function VictoryModal({
  territory,
  elapsedSeconds,
  totalDistanceMeters,
  onClose,
  onViewOnMap,
}: VictoryModalProps) {
  const [copied, setCopied] = useState(false);

  const svgPath = generateSvgPolygonPath(territory.coordinates, 180, 140, 16);

  const handleShare = async () => {
    const text = `🏆 Acabei de conquistar ${formatArea(territory.areaM2)} para o curso de ${territory.courseName} no Mapa do Calouro UFC Russas! 📍 Domine seu território também!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Território Conquistado - UFC Russas',
          text,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback para clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
      {/* Backdrop com Blur e Escurecimento */}
      <div
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-xl animate-fade-in"
        onClick={onClose}
      />

      {/* Confetes animados */}
      <ConfettiCanvas active={true} />

      {/* Card Principal da Celebração */}
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-purple-500/50 bg-gradient-to-b from-[#18112d] via-[#100f24] to-[#0a0f1d] p-6 text-center text-white shadow-2xl ring-1 ring-purple-500/30">
        {/* Glow de fundo */}
        <div className="pointer-events-none absolute -top-10 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-purple-600/30 blur-2xl" />

        {/* Botão fechar discreto */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Ícone de Troféu + Título */}
        <div className="mt-1 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-500/20 text-3xl shadow-[0_0_20px_rgba(251,191,36,0.3)]">
            🏆
          </div>

          <h2 className="mt-3 text-xl font-black tracking-tight text-white flex items-center gap-1.5 justify-center">
            <span>TERRITÓRIO CONQUISTADO!</span>
          </h2>
          <p className="text-xs text-purple-300 font-medium">
            Você fechou o circuito com sucesso
          </p>
        </div>

        {/* Silhueta Geométrica Neon do Polígono */}
        <div className="my-4 flex items-center justify-center">
          <div className="relative flex h-36 w-48 items-center justify-center rounded-2xl border border-purple-500/30 bg-slate-950/60 p-2 shadow-inner">
            <svg
              viewBox="0 0 180 140"
              className="h-full w-full filter drop-shadow-[0_0_12px_rgba(168,85,247,0.9)]"
            >
              <defs>
                <linearGradient id="polyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c084fc" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#9333ea" stopOpacity="0.7" />
                </linearGradient>
              </defs>
              <path
                d={svgPath}
                fill="url(#polyGrad)"
                stroke="#c084fc"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
            </svg>
            <span className="absolute bottom-2 text-[10px] font-bold text-purple-200">
              {territory.name}
            </span>
          </div>
        </div>

        {/* Grade de Estatísticas */}
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-slate-900/60 p-3 backdrop-blur-md">
          <div className="text-center">
            <span className="text-[10px] font-medium text-gray-400">Área</span>
            <p className="mt-0.5 text-xs font-black text-purple-300">
              {formatArea(territory.areaM2)}
            </p>
          </div>
          <div className="border-x border-white/10 text-center">
            <span className="text-[10px] font-medium text-gray-400">Tempo</span>
            <p className="mt-0.5 text-xs font-black text-cyan-300">
              {formatTime(elapsedSeconds)}
            </p>
          </div>
          <div className="text-center">
            <span className="text-[10px] font-medium text-gray-400">Distância</span>
            <p className="mt-0.5 text-xs font-black text-emerald-300">
              {formatDistance(totalDistanceMeters)}
            </p>
          </div>
        </div>

        {/* Badges de Conquista */}
        <div className="mt-3 space-y-1.5 text-left text-xs">
          <div className="flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-950/40 p-2.5">
            <span className="text-base">👑</span>
            <span className="font-semibold text-purple-200">
              Curso de {territory.courseName} dominou este setor!
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-950/40 p-2.5">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span className="font-semibold text-amber-200">
              Você acumulou +{formatArea(territory.areaM2)} no Ranking!
            </span>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            onClick={onViewOnMap}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 py-3 text-xs font-bold text-white transition hover:bg-white/20"
          >
            <Map className="h-4 w-4 text-purple-400" />
            <span>Ver no Mapa</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 py-3 text-xs font-bold text-white shadow-lg shadow-purple-600/40 transition hover:bg-purple-500"
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                <span>Compartilhar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
