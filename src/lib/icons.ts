import {
  Dumbbell,
  UtensilsCrossed,
  Utensils,
  BookOpen,
  Building2,
  Coffee,
  HelpCircle,
  ShoppingCart,
  Pill,
  Hospital,
  Pencil,
  Landmark,
  Bus,
  Home,
  Store,
  Printer,
  GraduationCap,
  Trophy,
  HeartPulse,
  Church,
  Cross,
  Sparkles,
  Shield,
  Heart,
  MapPin,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Dumbbell,
  UtensilsCrossed,
  Utensils,
  BookOpen,
  Building2,
  Coffee,
  HelpCircle,
  ShoppingCart,
  Pill,
  Hospital,
  Pencil,
  Landmark,
  Bus,
  Home,
  Store,
  Printer,
  GraduationCap,
  Trophy,
  HeartPulse,
  Church,
  Cross,
  Sparkles,
  Shield,
  Heart,
  MapPin,
};

export const ICON_EMOJIS: Record<string, string> = {
  Utensils: '🍽️',
  UtensilsCrossed: '🍽️',
  BookOpen: '📚',
  Building2: '🏢',
  Coffee: '☕',
  Dumbbell: '💪',
  Trophy: '⚽',
  ShoppingCart: '🛒',
  Pill: '💊',
  Hospital: '🏥',
  Home: '🏠',
  Printer: '🖨️',
  Bus: '🚌',
  Church: '⛪',
  Cross: '✝️',
  GraduationCap: '🎓',
  Landmark: '🏛️',
  Pencil: '✏️',
  Store: '🏪',
  Sparkles: '✨',
  HelpCircle: '❓',
  MapPin: '📍',
};

export const SLUG_EMOJIS: Record<string, string> = {
  alimentacao: '🍽️',
  bibliotecas: '📚',
  'salas-predios': '🏢',
  convivencia: '☕',
  academias: '💪',
  esportes: '⚽',
  mercados: '🛒',
  'saude-farmacias': '💊',
  moradias: '🏠',
  servicos: '🖨️',
  transporte: '🚌',
  'igrejas-templos': '⛪',
};

export function getCategoryIcon(iconName: string): LucideIcon {
  return iconMap[iconName] ?? MapPin;
}

export function getCategoryEmoji(category?: { slug?: string; icon?: string }): string {
  if (!category) return '📍';

  const icon = category.icon;

  // 1. If category.icon is a recognized Lucide icon name (e.g. 'Bus', 'Home', 'Pill', 'Church'), use its emoji
  if (icon && ICON_EMOJIS[icon]) {
    return ICON_EMOJIS[icon];
  }

  // 2. If category.slug is a recognized category slug (e.g. 'transporte', 'moradias'), use its emoji
  if (category.slug && SLUG_EMOJIS[category.slug]) {
    return SLUG_EMOJIS[category.slug];
  }

  // 3. If category.icon is a custom emoji (e.g. 🎯, 🚀, 🎭)
  if (icon && /\p{Extended_Pictographic}/u.test(icon)) {
    return icon;
  }

  // 4. Fallback for non-alphanumeric custom emoji strings
  if (icon && !/^[a-zA-Z0-9_-]+$/.test(icon)) {
    return icon;
  }

  return '📍';
}
