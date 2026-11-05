export interface GeoPoint {
  lat: number;
  lng: number;
  timestamp?: number;
}

export type CourseId = 'cc' | 'eng' | 'dir' | 'med' | 'adm' | 'agro' | 'let';

export interface CourseInfo {
  id: CourseId;
  name: string;
  shortName: string;
  color: string;
  glowColor: string;
  icon: string;
  borderClass: string;
  bgClass: string;
}

export interface Territory {
  id: string;
  name: string;
  ownerName: string;
  ownerAvatar?: string;
  courseId: CourseId;
  courseName: string;
  color: string;
  glowColor: string;
  areaM2: number;
  coordinates: [number, number][]; // [lat, lng][]
  capturedAt: string;
  isUserTerritory?: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  category: 'course' | 'user';
  courseId: CourseId;
  color: string;
  glowColor: string;
  avatar?: string;
  totalAreaM2: number;
  territoriesCount: number;
  badge?: string;
}

export interface RecordingState {
  isActive: boolean;
  isPaused: boolean;
  startTime: number | null;
  elapsedSeconds: number;
  points: GeoPoint[];
  distanceMeters: number;
  estimatedAreaM2: number;
  currentSpeedKmH: number;
  isClosed: boolean;
  distanceToStartMeters: number;
  simulationMode: boolean;
}

export type TabType = 'map' | 'record' | 'ranking' | 'profile';
