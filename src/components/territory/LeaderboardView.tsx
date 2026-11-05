import { useState } from 'react';
import { Crown, Sparkles, Trophy, Users, Shield, ArrowUpRight, Flame } from 'lucide-react';
import type { LeaderboardEntry, CourseId } from './types';
import { formatArea } from './geoUtils';

interface LeaderboardViewProps {
  courseLeaderboard: LeaderboardEntry[];
  userLeaderboard: LeaderboardEntry[];
  userCourseId: CourseId;
  userTotalArea: number;
  userRank: number;
}

export function LeaderboardView({
  courseLeaderboard,
  userLeaderboard,
  userCourseId,
  userTotalArea,
  userRank,
}: LeaderboardViewProps) {
  const [tab, setTab] = useState<'course' | 'user'>('course');

  const activeList = tab === 'course' ? courseLeaderboard : userLeaderboard;

  const top1 = activeList[0];
  const top2 = activeList[1];
  const top3 = activeList[2];
  const rest = activeList.slice(3);

  return (
    <div className="relative flex h-full w-full flex-col overflow-y-auto bg-gradient-to-b from-[#0a0f1d] via-[#101426] to-[#0d1021] pb-28 text-white">
      {/* Background Glow / Partículas */}
      <div className="pointer-events-none absolute -top-12 left-1/2 h-64 w-80 -translate-x-1/2 rounded-full bg-purple-600/15 blur-3xl" />
      <div className="pointer-events-none absolute top-48 -right-16 h-52 w-52 rounded-full bg-cyan-500/10 blur-3xl" />

      {/* Header */}
      <div className="relative z-10 px-5 pt-6 pb-4 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-950/60 px-3 py-1 text-xs font-semibold text-purple-300 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          <span>Temporada Ativa Calouros 2026</span>
        </div>

        <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
          <span>🏆</span>
          <span>RANKING DE TERRITÓRIOS</span>
        </h1>
        <p className="mt-0.5 text-xs text-gray-400">
          Semana atual • Campus UFC Russas
        </p>

        {/* Toggle Por Usuário / Por Curso */}
        <div className="mt-4 flex rounded-xl border border-white/10 bg-slate-900/80 p-1 backdrop-blur-md">
          <button
            onClick={() => setTab('user')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
              tab === 'user'
                ? 'bg-purple-600/90 text-white shadow-lg shadow-purple-600/30 ring-1 ring-purple-400/50'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Por Usuário</span>
          </button>
          <button
            onClick={() => setTab('course')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
              tab === 'course'
                ? 'bg-cyan-600/90 text-white shadow-lg shadow-cyan-600/30 ring-1 ring-cyan-400/50'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Por Curso</span>
          </button>
        </div>
      </div>

      {/* Pódio 3D dos Campeões (#2, #1, #3) */}
      <div className="relative z-10 mx-4 mt-2 mb-4">
        <div className="flex items-end justify-center gap-2.5 pt-6">
          {/* #2 Lugar (Esquerda) */}
          {top2 && (
            <div className="flex flex-1 flex-col items-center">
              <div className="relative mb-2 flex flex-col items-center">
                <span className="text-sm font-extrabold text-cyan-400">#2</span>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 bg-slate-900/90 text-xl shadow-lg"
                  style={{ borderColor: top2.color, boxShadow: `0 0 16px ${top2.glowColor}` }}
                >
                  {top2.avatar || '🥈'}
                </div>
              </div>
              {/* Pedestal #2 */}
              <div
                className="flex w-full flex-col items-center justify-center rounded-t-2xl border-t border-x p-2.5 backdrop-blur-md transition-all"
                style={{
                  height: '100px',
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  borderColor: `${top2.color}40`,
                }}
              >
                <span className="text-[11px] font-bold text-gray-200 text-center leading-tight truncate w-full">
                  {top2.name}
                </span>
                <span className="mt-1 text-[11px] font-extrabold" style={{ color: top2.color }}>
                  {formatArea(top2.totalAreaM2)}
                </span>
                <span className="mt-1 text-xs font-black text-slate-500">#2</span>
              </div>
            </div>
          )}

          {/* #1 Lugar (Centro - Mais Alto) */}
          {top1 && (
            <div className="relative flex flex-[1.2] flex-col items-center">
              {/* Coroa Dourada Flutuante */}
              <div className="absolute -top-6 animate-bounce">
                <Crown className="h-6 w-6 text-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              </div>

              <div className="relative mb-2 flex flex-col items-center">
                <div
                  className="mt-1 flex h-14 w-14 items-center justify-center rounded-2xl border-2 bg-slate-900/90 text-2xl shadow-xl"
                  style={{ borderColor: top1.color, boxShadow: `0 0 24px ${top1.glowColor}` }}
                >
                  {top1.avatar || '👑'}
                </div>
              </div>

              {/* Pedestal #1 */}
              <div
                className="flex w-full flex-col items-center justify-center rounded-t-2xl border-t-2 border-x p-3 backdrop-blur-md shadow-2xl transition-all"
                style={{
                  height: '128px',
                  backgroundColor: 'rgba(24, 18, 48, 0.85)',
                  borderColor: top1.color,
                  boxShadow: `0 -10px 25px ${top1.glowColor}`,
                }}
              >
                <span className="text-xs font-extrabold text-white text-center leading-tight truncate w-full">
                  {top1.name}
                </span>
                <span className="mt-1 text-xs font-black" style={{ color: top1.color }}>
                  {formatArea(top1.totalAreaM2)}
                </span>
                <span className="mt-2 text-base font-black text-purple-400/80">#1</span>
              </div>
            </div>
          )}

          {/* #3 Lugar (Direita) */}
          {top3 && (
            <div className="flex flex-1 flex-col items-center">
              <div className="relative mb-2 flex flex-col items-center">
                <span className="text-sm font-extrabold text-orange-400">#3</span>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 bg-slate-900/90 text-xl shadow-lg"
                  style={{ borderColor: top3.color, boxShadow: `0 0 16px ${top3.glowColor}` }}
                >
                  {top3.avatar || '🥉'}
                </div>
              </div>
              {/* Pedestal #3 */}
              <div
                className="flex w-full flex-col items-center justify-center rounded-t-2xl border-t border-x p-2.5 backdrop-blur-md transition-all"
                style={{
                  height: '84px',
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  borderColor: `${top3.color}40`,
                }}
              >
                <span className="text-[11px] font-bold text-gray-200 text-center leading-tight truncate w-full">
                  {top3.name}
                </span>
                <span className="mt-1 text-[11px] font-extrabold" style={{ color: top3.color }}>
                  {formatArea(top3.totalAreaM2)}
                </span>
                <span className="mt-1 text-xs font-black text-slate-500">#3</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lista do 4º Lugar em diante */}
      <div className="relative z-10 space-y-2 px-4">
        {rest.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-2xl border bg-slate-900/70 p-3.5 shadow-md backdrop-blur-md transition-all hover:bg-slate-900/90"
            style={{ borderColor: `${item.color}30` }}
          >
            <div className="flex items-center gap-3">
              <span className="w-6 text-center font-black text-sm text-gray-400">
                #{item.rank}
              </span>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl border bg-slate-950 text-base"
                style={{ borderColor: item.color }}
              >
                {item.avatar || '📍'}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white leading-snug">{item.name}</h4>
                <span className="text-[10px] text-gray-400">
                  {item.territoriesCount} {item.territoriesCount === 1 ? 'área' : 'áreas'} dominadas
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-extrabold" style={{ color: item.color }}>
                {formatArea(item.totalAreaM2)}
              </span>
              <div className="flex items-center justify-end gap-1 text-[10px] text-gray-400">
                <Flame className="h-2.5 w-2.5 text-amber-500" />
                <span>Ativo</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Card Fixo Inferior: "Seu Território / Seu Status" */}
      <div className="fixed bottom-14 left-0 right-0 z-30 mx-auto max-w-md px-4 pointer-events-auto">
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/40 bg-slate-950/90 p-3.5 shadow-2xl backdrop-blur-xl ring-1 ring-purple-500/20">
          <div className="flex items-center gap-3">
            {/* Ícone de Mapa/Território */}
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-purple-500/50 bg-gradient-to-br from-purple-900/50 to-pink-900/40 text-xl shadow-inner">
              🗺️
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-white">Seu Território</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-900/60 px-2 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/40">
                  #{userRank} no Geral
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-gray-300 font-medium">
                Você conquistou <strong className="text-purple-300">{formatArea(userTotalArea)}</strong>
              </p>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-400">
                <span>Próximo território (+890 m² para subir)</span>
                <ArrowUpRight className="h-3 w-3 text-purple-400" />
              </div>
              {/* Barra de Progresso com Glow */}
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                  style={{ width: '68%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
