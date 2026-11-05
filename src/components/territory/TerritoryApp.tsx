import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Play,
  RotateCcw,
  Sparkles,
  MapPin,
  Compass,
  Layers,
  ArrowLeft,
  Info,
  Flame,
  CheckCircle2,
  Zap,
  Users,
  Shield,
  Clock,
  Navigation,
  ChevronRight,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { TerritoryMap } from './TerritoryMap';
import { LeaderboardView } from './LeaderboardView';
import { VictoryModal } from './VictoryModal';
import {
  COURSES,
  INITIAL_TERRITORIES,
  INITIAL_COURSE_LEADERBOARD,
  INITIAL_USER_LEADERBOARD,
  DEMO_CIRCUIT_WAYPOINTS,
} from './mockTerritories';
import {
  calculateGeodesicArea,
  calculateTotalDistance,
  isCircuitClosed,
  formatArea,
  formatDistance,
  formatTime,
} from './geoUtils';
import type {
  Territory,
  RecordingState,
  CourseId,
  GeoPoint,
  LeaderboardEntry,
  TabType,
} from './types';

const STORAGE_KEY_TERRITORIES = 'mapa_calouros_conquest_territories';
const STORAGE_KEY_USER_COURSE = 'mapa_calouros_user_course';

export function TerritoryApp() {
  const navigate = useNavigate();

  // Preferências do Usuário
  const [selectedCourse, setSelectedCourse] = useState<CourseId>(() => {
    return (localStorage.getItem(STORAGE_KEY_USER_COURSE) as CourseId) || 'cc';
  });
  const [userName] = useState('Calouro_UFC');

  // Abas de Navegação (Mobile)
  const [activeTab, setActiveTab] = useState<TabType>('map');

  // Aba do Leaderboard no painel Desktop (Por Curso vs Por Usuário)
  const [desktopRankingTab, setDesktopRankingTab] = useState<'course' | 'user'>('course');

  // Lista de Territórios
  const [territories, setTerritories] = useState<Territory[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TERRITORIES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_TERRITORIES;
  });

  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);

  // Leaderboards
  const [courseLeaderboard, setCourseLeaderboard] = useState<LeaderboardEntry[]>(
    INITIAL_COURSE_LEADERBOARD
  );
  const [userLeaderboard, setUserLeaderboard] = useState<LeaderboardEntry[]>(
    INITIAL_USER_LEADERBOARD
  );

  // Modal de Vitória
  const [victoryModalTerritory, setVictoryModalTerritory] = useState<Territory | null>(null);
  const [lastConquestDistance, setLastConquestDistance] = useState(0);
  const [lastConquestTime, setLastConquestTime] = useState(0);

  // Estado da Gravação de Território
  const [recording, setRecording] = useState<RecordingState>({
    isActive: false,
    isPaused: false,
    startTime: null,
    elapsedSeconds: 0,
    points: [],
    distanceMeters: 0,
    estimatedAreaM2: 0,
    currentSpeedKmH: 4.8,
    isClosed: false,
    distanceToStartMeters: 0,
    simulationMode: true,
  });

  // Localização atual do GPS (ou simulação)
  const [currentLocation, setCurrentLocation] = useState<GeoPoint>({
    lat: -4.9460,
    lng: -37.9748,
  });

  // Refs de controle
  const timerRef = useRef<number | null>(null);
  const simStepRef = useRef<number>(0);
  const simIntervalRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);

  // Salvar preferências
  const handleSelectCourse = (courseId: CourseId) => {
    setSelectedCourse(courseId);
    localStorage.setItem(STORAGE_KEY_USER_COURSE, courseId);
  };

  // Solicitar Wake Lock para manter a tela ligada
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      } catch (err) {
        console.warn('Wake Lock não suportado ou negado:', err);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      try {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch {}
    }
  };

  // Iniciar Gravação
  const startRecording = useCallback((isSimulation = true) => {
    requestWakeLock();
    simStepRef.current = 0;

    const initialPoint: GeoPoint = isSimulation
      ? { lat: DEMO_CIRCUIT_WAYPOINTS[0][0], lng: DEMO_CIRCUIT_WAYPOINTS[0][1] }
      : { lat: currentLocation.lat, lng: currentLocation.lng };

    setCurrentLocation(initialPoint);

    setRecording({
      isActive: true,
      isPaused: false,
      startTime: Date.now(),
      elapsedSeconds: 0,
      points: [initialPoint],
      distanceMeters: 0,
      estimatedAreaM2: 0,
      currentSpeedKmH: 4.8,
      isClosed: false,
      distanceToStartMeters: 0,
      simulationMode: isSimulation,
    });

    // Iniciar cronômetro
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setRecording((prev) => {
        if (!prev.isActive || prev.isPaused) return prev;
        return { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 };
      });
    }, 1000);

    // Se for GPS real no celular
    if (!isSimulation && 'geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newPt: GeoPoint = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            timestamp: pos.timestamp,
          };
          const speedKmH = pos.coords.speed ? pos.coords.speed * 3.6 : 5.0;
          addPointToRecording(newPt, speedKmH);
        },
        (err) => console.warn('Erro no watchPosition:', err),
        { enableHighAccuracy: true, maximumAge: 1000 }
      );
    }
  }, [currentLocation]);

  // Adicionar ponto ao trajeto
  const addPointToRecording = useCallback((newPt: GeoPoint, speedKmH = 5.2) => {
    setCurrentLocation(newPt);

    setRecording((prev) => {
      if (!prev.isActive) return prev;

      const newPoints = [...prev.points, newPt];
      const dist = calculateTotalDistance(newPoints);
      const area = newPoints.length >= 3 ? calculateGeodesicArea(newPoints) : 0;
      const { isClosed, distanceToStart } = isCircuitClosed(newPoints, 35);

      return {
        ...prev,
        points: newPoints,
        distanceMeters: dist,
        estimatedAreaM2: area,
        currentSpeedKmH: speedKmH,
        isClosed,
        distanceToStartMeters: distanceToStart,
      };
    });
  }, []);

  // Simular Próximo Passo na rota demo da UFC
  const stepSimulation = useCallback(() => {
    if (simStepRef.current < DEMO_CIRCUIT_WAYPOINTS.length - 1) {
      simStepRef.current += 1;
      const nextCoord = DEMO_CIRCUIT_WAYPOINTS[simStepRef.current];
      addPointToRecording({ lat: nextCoord[0], lng: nextCoord[1] });
    }
  }, [addPointToRecording]);

  // Simular toda a rota de forma automática (Auto-Walk)
  const runAutoSimulation = useCallback(() => {
    if (!recording.isActive) {
      startRecording(true);
    }

    if (simIntervalRef.current) clearInterval(simIntervalRef.current);

    let step = simStepRef.current;
    simIntervalRef.current = window.setInterval(() => {
      if (step < DEMO_CIRCUIT_WAYPOINTS.length - 1) {
        step += 1;
        simStepRef.current = step;
        const nextCoord = DEMO_CIRCUIT_WAYPOINTS[step];
        addPointToRecording({ lat: nextCoord[0], lng: nextCoord[1] }, 5.4);
      } else {
        if (simIntervalRef.current) {
          clearInterval(simIntervalRef.current);
          simIntervalRef.current = null;
        }
      }
    }, 1100);
  }, [recording.isActive, startRecording, addPointToRecording]);

  // Cancelar Gravação
  const cancelRecording = useCallback(() => {
    releaseWakeLock();
    if (timerRef.current) clearInterval(timerRef.current);
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);

    setRecording({
      isActive: false,
      isPaused: false,
      startTime: null,
      elapsedSeconds: 0,
      points: [],
      distanceMeters: 0,
      estimatedAreaM2: 0,
      currentSpeedKmH: 0,
      isClosed: false,
      distanceToStartMeters: 0,
      simulationMode: true,
    });
  }, []);

  // Concluir e Conquistar Território!
  const claimTerritory = useCallback(() => {
    const points = recording.points;
    if (points.length < 3) return;

    const finalArea = calculateGeodesicArea(points);
    const course = COURSES[selectedCourse];

    // Montar coordenadas fechadas
    const coords: [number, number][] = points.map((p) => [p.lat, p.lng]);
    if (
      coords.length > 0 &&
      (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])
    ) {
      coords.push(coords[0]); // fechar polígono
    }

    const newTerritory: Territory = {
      id: `terr-${Date.now()}`,
      name: `Setor Conquistado (${course.shortName})`,
      ownerName: `${userName} (${course.shortName} 2026)`,
      ownerAvatar: course.icon,
      courseId: course.id,
      courseName: course.shortName,
      color: course.color,
      glowColor: course.glowColor,
      areaM2: Math.max(finalArea, 1450), // fallback caso demo seja pequeno
      capturedAt: 'Agora mesmo',
      coordinates: coords,
      isUserTerritory: true,
    };

    const updatedTerritories = [newTerritory, ...territories];
    setTerritories(updatedTerritories);
    localStorage.setItem(STORAGE_KEY_TERRITORIES, JSON.stringify(updatedTerritories));

    // Atualizar ranking
    setCourseLeaderboard((prev) => {
      return prev.map((entry) => {
        if (entry.courseId === selectedCourse) {
          return {
            ...entry,
            totalAreaM2: entry.totalAreaM2 + newTerritory.areaM2,
            territoriesCount: entry.territoriesCount + 1,
          };
        }
        return entry;
      }).sort((a, b) => b.totalAreaM2 - a.totalAreaM2).map((entry, idx) => ({ ...entry, rank: idx + 1 }));
    });

    setLastConquestDistance(recording.distanceMeters);
    setLastConquestTime(recording.elapsedSeconds);
    setVictoryModalTerritory(newTerritory);
    setSelectedTerritory(newTerritory);

    cancelRecording();
  }, [recording, selectedCourse, userName, territories, cancelRecording]);

  // Limpeza de timers ao desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      releaseWakeLock();
    };
  }, []);

  const course = COURSES[selectedCourse];
  const activeDesktopLeaderboard = desktopRankingTab === 'course' ? courseLeaderboard : userLeaderboard;

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#070b14] text-white">
      {/* ========================================================================= */}
      {/* 🖥️ DESKTOP SIDEBAR (Visível apenas em md: e telas maiores)                */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex md:w-[380px] lg:w-[420px] flex-col border-r border-white/10 bg-[#0c1020]/95 backdrop-blur-2xl z-30 shadow-2xl flex-shrink-0">
        {/* Header do Painel */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-gray-300 transition hover:bg-white/20 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Mapa do Calouro</span>
            </button>
            <span className="rounded-full bg-purple-600/30 px-2.5 py-0.5 text-[10px] font-black uppercase text-purple-300 border border-purple-500/40">
              Turf Wars BETA
            </span>
          </div>

          <div className="mt-4">
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>🏆</span>
              <span>Conquista de Territórios</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Feche um circuito ao redor do quarteirão para dominar a área para seu curso.
            </p>
          </div>

          {/* Seletor de Curso do Usuário */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/80 p-3">
            <label className="text-[11px] font-bold text-gray-400 block mb-1.5">Seu Curso na UFC Russas:</label>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.values(COURSES).map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCourse(c.id)}
                  className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold transition-all ${
                    selectedCourse === c.id
                      ? 'border bg-slate-800 shadow-md scale-[1.02]'
                      : 'border border-transparent hover:bg-white/5 opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    borderColor: selectedCourse === c.id ? c.color : 'transparent',
                    color: selectedCourse === c.id ? c.color : '#e2e8f0',
                  }}
                >
                  <span className="text-base">{c.icon}</span>
                  <span className="truncate">{c.shortName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Abas e Lista de Ranking Desktop */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-purple-400" />
              <span>Placar de Dominação</span>
            </h2>
            {/* Toggle Por Curso / Por Usuário */}
            <div className="flex rounded-lg bg-slate-900 p-0.5 border border-white/10 text-[11px]">
              <button
                onClick={() => setDesktopRankingTab('course')}
                className={`px-2.5 py-1 rounded-md font-bold transition ${
                  desktopRankingTab === 'course' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Cursos
              </button>
              <button
                onClick={() => setDesktopRankingTab('user')}
                className={`px-2.5 py-1 rounded-md font-bold transition ${
                  desktopRankingTab === 'user' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Usuários
              </button>
            </div>
          </div>

          {/* Lista de Ranking */}
          <div className="space-y-2">
            {activeDesktopLeaderboard.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-center justify-between rounded-2xl border p-3 transition-all ${
                  idx === 0
                    ? 'bg-gradient-to-r from-purple-950/60 to-slate-900/90 shadow-lg'
                    : 'bg-slate-900/60 hover:bg-slate-900/90'
                }`}
                style={{ borderColor: `${item.color}40` }}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-5 text-center font-black text-xs ${idx === 0 ? 'text-amber-400 text-sm' : 'text-gray-400'}`}>
                    {idx === 0 ? '👑' : `#${item.rank}`}
                  </span>
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl border bg-slate-950 text-base"
                    style={{ borderColor: item.color }}
                  >
                    {item.avatar || '📍'}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white leading-snug">{item.name}</h3>
                    <span className="text-[10px] text-gray-400">
                      {item.territoriesCount} {item.territoriesCount === 1 ? 'área' : 'áreas'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black" style={{ color: item.color }}>
                    {formatArea(item.totalAreaM2)}
                  </span>
                  <div className="text-[9px] text-gray-400 font-medium">conquistados</div>
                </div>
              </div>
            ))}
          </div>

          {/* Dica de Gamificação */}
          <div className="rounded-2xl border border-purple-500/20 bg-purple-950/30 p-3.5 text-xs text-purple-200">
            <div className="flex items-center gap-2 font-bold mb-1">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Como Jogar:</span>
            </div>
            <p className="text-[11px] text-purple-300/80 leading-relaxed">
              Caminhe ao redor de qualquer quarteirão ou prédio da UFC Russas até voltar ao ponto inicial. O sistema calcula a área interna e pinta com a cor do seu curso!
            </p>
          </div>
        </div>

        {/* Rodapé Desktop */}
        <div className="p-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-between text-xs text-gray-400">
          <span>UFC Campus Russas</span>
          <button
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY_TERRITORIES);
              setTerritories(INITIAL_TERRITORIES);
            }}
            className="text-[10px] hover:text-white underline"
          >
            Resetar Áreas Demo
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 🗺️ ÁREA CENTRAL: MAPA RESPONSIVO (DESKTOP & MOBILE)                      */}
      {/* ========================================================================= */}
      <div className="relative flex-1 flex flex-col h-full overflow-hidden">
        {/* MOBILE TOP BAR (Visível apenas em mobile md:hidden) */}
        <header className="md:hidden relative z-20 flex items-center justify-between border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-gray-300 transition hover:bg-white/20 hover:text-white"
              title="Voltar ao Mapa do Calouro"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-white">Mapa do Calouro</span>
                <span className="rounded-md bg-purple-600/30 px-1.5 py-0.5 text-[9px] font-black uppercase text-purple-300 border border-purple-500/30">
                  Turf BETA
                </span>
              </div>
              <p className="text-[10px] text-gray-400">Campus Russas · Ceará</p>
            </div>
          </div>

          <select
            value={selectedCourse}
            onChange={(e) => handleSelectCourse(e.target.value as CourseId)}
            className="rounded-xl border border-white/10 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white shadow-inner focus:outline-none"
            style={{ color: course.color }}
          >
            {Object.values(COURSES).map((c) => (
              <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                {c.icon} {c.shortName}
              </option>
            ))}
          </select>
        </header>

        {/* GRAVAÇÃO ATIVA: BANNER TOPO RESPONSIVO */}
        {recording.isActive && (
          <div className="relative z-20 flex items-center justify-between border-b border-red-500/30 bg-gradient-to-r from-red-950/95 via-slate-950/95 to-red-950/95 px-5 py-2.5 text-xs font-bold backdrop-blur-md shadow-lg">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
              </span>
              <span className="tracking-wider text-red-300 font-extrabold uppercase">GRAVANDO TERRITÓRIO EM TEMPO REAL</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 hidden sm:inline text-[11px]">Tempo decorrido:</span>
              <div className="font-mono text-sm font-black text-white bg-slate-900/80 px-2.5 py-0.5 rounded-lg border border-red-500/30">
                {formatTime(recording.elapsedSeconds)}
              </div>
            </div>
          </div>
        )}

        {/* CONTEÚDO PRINCIPAL: MAPA OU RANKING MOBILE */}
        <main className="relative flex-1 overflow-hidden">
          {/* MAPA FULLSCREEN */}
          {(activeTab === 'map' || window.innerWidth >= 768) && (
            <TerritoryMap
              territories={territories}
              recording={recording}
              selectedTerritory={selectedTerritory}
              onSelectTerritory={setSelectedTerritory}
              currentUserLocation={currentLocation}
              userColor={course.color}
            />
          )}

          {/* TELA DE RANKING MOBILE (Visível apenas em telas pequenas quando tab === 'ranking') */}
          <div className="md:hidden h-full">
            {activeTab === 'ranking' && (
              <LeaderboardView
                courseLeaderboard={courseLeaderboard}
                userLeaderboard={userLeaderboard}
                userCourseId={selectedCourse}
                userTotalArea={7891}
                userRank={3}
              />
            )}

            {activeTab === 'profile' && (
              <div className="flex h-full flex-col overflow-y-auto p-5 pb-24 text-sm text-gray-300 bg-[#0a0f1d]">
                <h3 className="text-base font-extrabold text-white">🎮 Modo Conquista de Território</h3>
                <p className="mt-2 text-xs text-gray-400 leading-relaxed">
                  Inspirado em Turf Wars: dê a volta em um quarteirão da UFC Russas para fechar um circuito. O polígono demarcado é colorido com as cores do seu curso!
                </p>

                <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <h4 className="font-bold text-white text-xs">🎓 Seu Curso</h4>
                  <div className="mt-3 flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border text-2xl"
                      style={{ borderColor: course.color, backgroundColor: `${course.color}15` }}
                    >
                      {course.icon}
                    </div>
                    <div>
                      <h5 className="font-black text-white">{course.name}</h5>
                      <span className="text-xs" style={{ color: course.color }}>
                        Cor de Território Ativa
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <h4 className="font-bold text-white text-xs">🧪 Simulação e Testes</h4>
                  <div className="mt-3 flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setActiveTab('map');
                        runAutoSimulation();
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white transition hover:bg-purple-500"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>Iniciar Simulação Automática de Circuito</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 🎛️ HUD FLUTUANTE DE TELEMETRIA & CONTROLES (DESKTOP & MOBILE)             */}
          {/* ========================================================================= */}
          {recording.isActive && (
            <div className="pointer-events-none absolute inset-x-0 bottom-20 md:bottom-8 z-30 flex justify-center px-4">
              <div className="pointer-events-auto w-full max-w-xl overflow-hidden rounded-3xl border border-white/15 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-2xl ring-1 ring-purple-500/20">
                {/* Telemetria */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-slate-900/60 p-2 border border-white/5">
                    <span className="text-[10px] text-gray-400 font-medium block">Distância</span>
                    <p className="text-sm font-black text-white mt-0.5">
                      {formatDistance(recording.distanceMeters)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-900/60 p-2 border border-white/5">
                    <span className="text-[10px] text-gray-400 font-medium block">Área Estimada</span>
                    <p className="text-sm font-black text-purple-300 mt-0.5">
                      {formatArea(recording.estimatedAreaM2)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-900/60 p-2 border border-white/5">
                    <span className="text-[10px] text-gray-400 font-medium block">Velocidade</span>
                    <p className="text-sm font-black text-emerald-300 mt-0.5">
                      {recording.currentSpeedKmH.toFixed(1)} km/h
                    </p>
                  </div>
                </div>

                {/* Status de Fechamento de Circuito */}
                <div className="mt-3 pt-2.5 border-t border-white/10">
                  {recording.isClosed ? (
                    <div className="flex items-center justify-between rounded-2xl bg-emerald-950/90 border border-emerald-400/60 p-3 text-xs font-bold text-emerald-300 animate-pulse">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        <span>Circuito Fechado! Pronto para dominar a área.</span>
                      </div>
                      <button
                        onClick={claimTerritory}
                        className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/40 hover:bg-emerald-400 transition"
                      >
                        CONQUISTAR 🏆
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-amber-300 px-1">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-amber-400 flex-shrink-0" />
                        <span>
                          {recording.points.length < 3
                            ? 'Caminhe contornando o quarteirão para traçar a área'
                            : `Feche o circuito! Você está a ${Math.round(recording.distanceToStartMeters)}m do início`}
                        </span>
                      </div>
                      {recording.points.length >= 3 && (
                        <button
                          onClick={claimTerritory}
                          className="text-xs font-bold text-purple-300 underline hover:text-purple-200 ml-2 whitespace-nowrap"
                        >
                          Fechar Agora
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Botões de Simulação Rápida */}
                {recording.simulationMode && (
                  <div className="mt-3 flex items-center justify-between gap-2 pt-2.5 border-t border-white/10">
                    <button
                      onClick={stepSimulation}
                      className="flex-1 rounded-xl border border-purple-500/40 bg-purple-950/60 py-2 text-xs font-bold text-purple-200 hover:bg-purple-900 transition"
                    >
                      👣 Próximo Passo
                    </button>
                    <button
                      onClick={runAutoSimulation}
                      className="flex-1 rounded-xl border border-cyan-500/40 bg-cyan-950/60 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-900 transition"
                    >
                      ⚡ Auto-Walk (Automático)
                    </button>
                    <button
                      onClick={cancelRecording}
                      className="rounded-xl border border-red-500/40 bg-red-950/60 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-900 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BOTÃO PRINCIPAL "INICIAR CONQUISTA" (QUANDO PARADO) */}
          {!recording.isActive && (
            <div className="pointer-events-none absolute inset-x-0 bottom-20 md:bottom-10 z-20 flex flex-col items-center gap-2.5 px-4">
              <button
                onClick={() => startRecording(true)}
                className="pointer-events-auto flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 px-8 py-4 text-sm font-black text-white shadow-2xl shadow-purple-600/50 ring-2 ring-purple-400/40 transition-all hover:scale-105 active:scale-95"
              >
                <Play className="h-5 w-5 fill-white" />
                <span>INICIAR CONQUISTA DE TERRITÓRIO</span>
              </button>

              <div className="pointer-events-auto flex items-center gap-2">
                <button
                  onClick={() => startRecording(false)}
                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/80 px-3.5 py-1 text-xs font-semibold text-gray-300 backdrop-blur-md hover:bg-slate-900 transition"
                >
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Usar GPS Real</span>
                </button>
                <button
                  onClick={() => {
                    startRecording(true);
                    runAutoSimulation();
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/60 px-3.5 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-md hover:bg-cyan-900 transition"
                >
                  <Zap className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Demonstração Auto-Walk</span>
                </button>
              </div>
            </div>
          )}

          {/* CARD DE DETALHES DO TERRITÓRIO SELECIONADO */}
          {selectedTerritory && !recording.isActive && (
            <div className="pointer-events-none absolute inset-x-0 bottom-20 md:bottom-10 z-30 flex justify-center px-4">
              <div className="pointer-events-auto w-full max-w-md rounded-3xl border border-white/15 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl ring-1 ring-purple-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl border text-2xl"
                      style={{
                        borderColor: selectedTerritory.color,
                        backgroundColor: `${selectedTerritory.color}20`,
                      }}
                    >
                      {selectedTerritory.ownerAvatar || '👑'}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">
                        {selectedTerritory.name}
                      </h4>
                      <p className="text-xs font-semibold" style={{ color: selectedTerritory.color }}>
                        {selectedTerritory.ownerName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTerritory(null)}
                    className="h-7 w-7 rounded-full bg-white/10 text-xs text-gray-400 hover:text-white flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5 text-xs text-gray-300">
                  <span>Área Dominada: <strong>{formatArea(selectedTerritory.areaM2)}</strong></span>
                  <span className="text-[11px] text-gray-400">{selectedTerritory.capturedAt}</span>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* MOBILE BOTTOM NAVIGATION (Visível apenas em md:hidden) */}
        <nav className="md:hidden relative z-20 flex items-center justify-around border-t border-white/10 bg-slate-950/95 py-2 backdrop-blur-xl">
          <button
            onClick={() => {
              setActiveTab('map');
              setSelectedTerritory(null);
            }}
            className={`flex flex-col items-center gap-1 py-1 text-xs font-bold transition-all ${
              activeTab === 'map' ? 'text-purple-400 scale-105' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Compass className="h-5 w-5" />
            <span className="text-[10px]">Territórios</span>
          </button>

          <button
            onClick={() => setActiveTab('ranking')}
            className={`flex flex-col items-center gap-1 py-1 text-xs font-bold transition-all ${
              activeTab === 'ranking' ? 'text-purple-400 scale-105' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Trophy className="h-5 w-5" />
            <span className="text-[10px]">Ranking</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 py-1 text-xs font-bold transition-all ${
              activeTab === 'profile' ? 'text-purple-400 scale-105' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Layers className="h-5 w-5" />
            <span className="text-[10px]">Cursos & Testes</span>
          </button>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* 🏆 MODAL DE CELEBRAÇÃO / VITÓRIA                                         */}
      {/* ========================================================================= */}
      {victoryModalTerritory && (
        <VictoryModal
          territory={victoryModalTerritory}
          elapsedSeconds={lastConquestTime}
          totalDistanceMeters={lastConquestDistance}
          onClose={() => setVictoryModalTerritory(null)}
          onViewOnMap={() => {
            setVictoryModalTerritory(null);
            setActiveTab('map');
          }}
        />
      )}
    </div>
  );
}
