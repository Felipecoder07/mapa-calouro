import { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Loader2,
  Save,
  MapPin,
  ArrowLeft,
  LocateFixed,
  Compass,
  Utensils,
  BookOpen,
  Building2,
  Coffee,
  HelpCircle,
  Sparkles,
  Zap,
  Dumbbell,
  Tag,
  Church,
  Trophy,
  ShoppingCart,
  Pill,
  Home,
  Printer,
  Bus,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ADMIN_PASSWORD_KEY, UNIVERSITY } from '@/lib/constants';
import { fetchCategories, fetchPlaces, createPlace, updatePlace, deletePlace, createCategory, deleteCategory } from '@/lib/api';
import { getCategoryIcon } from '@/lib/icons';
import { haversineDistance } from '@/lib/distance';
import type { Place, Category } from '@/types';

const ADMIN_PASSWORD = 'admin123';

interface AdminProps {
  onExit: () => void;
}

interface PlaceFormData {
  name: string;
  description: string;
  address: string;
  lat: string;
  lng: string;
  category_id: string;
  hours: string;
  contact: string;
  photos: string;
}

const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CATEGORY_PHOTOS: Record<string, string[]> = {
  alimentacao: [
    'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  ],
  bibliotecas: [
    'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',
  ],
  'salas-predios': [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
  ],
  convivencia: [
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
  ],
  academias: [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
  ],
  esportes: [
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
  ],
  mercados: [
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80',
  ],
  'saude-farmacias': [
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
  ],
  moradias: [
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
  ],
  servicos: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
  ],
  transporte: [
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
  ],
  'igrejas-templos': [
    'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?auto=format&fit=crop&w=800&q=80',
  ],
};

const AVAILABLE_ICONS = [
  { id: 'Church', label: 'Igrejas / Templos', emoji: '⛪' },
  { id: 'Utensils', label: 'Alimentação / RU', emoji: '🍽️' },
  { id: 'BookOpen', label: 'Bibliotecas / Estudos', emoji: '📚' },
  { id: 'Building2', label: 'Salas / Blocos', emoji: '🏢' },
  { id: 'Coffee', label: 'Convivência / Cantinas', emoji: '☕' },
  { id: 'Dumbbell', label: 'Academias / Fitness', emoji: '💪' },
  { id: 'Trophy', label: 'Esportes / Quadras', emoji: '⚽' },
  { id: 'ShoppingCart', label: 'Mercados / Lojas', emoji: '🛒' },
  { id: 'Pill', label: 'Saúde / Farmácias', emoji: '💊' },
  { id: 'Home', label: 'Moradias / Repúblicas', emoji: '🏠' },
  { id: 'Printer', label: 'Serviços / Xerox', emoji: '🖨️' },
  { id: 'Bus', label: 'Transporte / Rodoviária', emoji: '🚌' },
  { id: 'Sparkles', label: 'Destaques / Outros', emoji: '✨' },
];

const AVAILABLE_COLORS = [
  '#a855f7', // Roxo / Igrejas
  '#ef4444', // Vermelho / Alimentação
  '#3b82f6', // Azul / Biblioteca
  '#8b5cf6', // Roxo escuro / Prédios
  '#f59e0b', // Amarelo / Convivência
  '#ec4899', // Rosa / Academias
  '#10b981', // Verde / Esportes
  '#06b6d4', // Ciano / Mercados
  '#14b8a6', // Verde Água / Saúde
  '#f97316', // Laranja / Moradias
  '#6b7280', // Cinza / Serviços
  '#6366f1', // Índigo / Transporte
];

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

function LocationPickerMap({
  lat,
  lng,
  onChange,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}) {
  function LocationMarker() {
    useMapEvents({
      click(e) {
        onChange(e.latlng.lat, e.latlng.lng);
      },
    });
    return <Marker position={[lat, lng]} icon={customMarkerIcon} />;
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 shadow-inner">
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        className="h-48 w-full"
        zoomControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapRecenter lat={lat} lng={lng} />
        <LocationMarker />
      </MapContainer>
      <div className="pointer-events-none absolute bottom-2 left-2 z-[400] rounded-md bg-white/90 px-2 py-1 text-[11px] font-medium text-gray-700 shadow-sm backdrop-blur-sm">
        💡 Clique no mapa para posicionar o pino
      </div>
    </div>
  );
}

const emptyForm: PlaceFormData = {
  name: '',
  description: '',
  address: '',
  lat: String(UNIVERSITY.lat),
  lng: String(UNIVERSITY.lng),
  category_id: '',
  hours: '',
  contact: '',
  photos: '',
};

export default function Admin({ onExit }: AdminProps) {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlaceFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Church');
  const [newCatColor, setNewCatColor] = useState('#a855f7');
  const [savingCat, setSavingCat] = useState(false);

  const [searchingLocation, setSearchingLocation] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [locatingGPS, setLocatingGPS] = useState(false);
  const [geoSearchQuery, setGeoSearchQuery] = useState('');
  const [autoFillInput, setAutoFillInput] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_PASSWORD_KEY);
    if (stored === 'true') setAuthed(true);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, pls] = await Promise.all([fetchCategories(), fetchPlaces()]);
      setCategories(cats);
      setPlaces(pls);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) loadData();
  }, [authed, loadData]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_PASSWORD_KEY, 'true');
      setAuthed(true);
      setError('');
    } else {
      setError('Senha incorreta');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_PASSWORD_KEY);
    setAuthed(false);
    setPassword('');
  };

  const fetchAddressFromCoords = async (lat: number, lng: number) => {
    const distToCampus = haversineDistance(UNIVERSITY.lat, UNIVERSITY.lng, lat, lng);
    if (distToCampus <= 0.35) {
      return 'Campus da UFC em Russas, CE';
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(',').map((s: string) => s.trim());
        return parts.slice(0, 3).join(', ');
      }
    } catch {
      // fallback
    }
    return 'Russas - CE';
  };

  const detectCategoryFromCoords = async (lat: number, lng: number): Promise<string | null> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&extratags=1`
      );
      const data = await res.json();
      if (!data) return null;

      const type = (data.type || '').toLowerCase();
      const category = (data.category || '').toLowerCase();
      const amenity = (data.extratags?.amenity || '').toLowerCase();
      const leisure = (data.extratags?.leisure || '').toLowerCase();
      const shop = (data.extratags?.shop || '').toLowerCase();
      const combined = `${type} ${category} ${amenity} ${leisure} ${shop}`;

      if (/church|chapel|place_of_worship|religious/.test(combined)) {
        return 'igrejas-templos';
      }
      if (/restaurant|fast_food|cafe|canteen|food|bar|pub|ice_cream/.test(combined)) {
        return 'alimentacao';
      }
      if (/fitness|gym|sports_centre|health_club/.test(combined)) {
        return 'academias';
      }
      if (/pharmacy|hospital|clinic|doctors|chemist/.test(combined)) {
        return 'saude-farmacias';
      }
      if (/library|books/.test(combined)) {
        return 'bibliotecas';
      }
      if (/supermarket|convenience|grocery|bakery|mall|clothes|shoes/.test(combined)) {
        return 'mercados';
      }
      if (/bus_stop|bus_station|transit_station/.test(combined)) {
        return 'transporte';
      }
      if (/bank|post_office|copyshop|printing|laundry/.test(combined)) {
        return 'servicos';
      }
      if (/dormitory|apartments|residential|house/.test(combined)) {
        return 'moradias';
      }
      if (/stadium|pitch|sports|playground/.test(combined)) {
        return 'esportes';
      }

      const distToCampus = haversineDistance(UNIVERSITY.lat, UNIVERSITY.lng, lat, lng);
      if (distToCampus <= 0.35) {
        return 'salas-predios';
      }
    } catch {
      // ignore
    }
    return null;
  };

  const handleLocationPick = async (lat: number, lng: number) => {
    const calculatedAddress = await fetchAddressFromCoords(lat, lng);
    const detectedSlug = await detectCategoryFromCoords(lat, lng);
    const matchedCategory = detectedSlug ? categories.find((c) => c.slug === detectedSlug) : null;

    setForm((prev) => ({
      ...prev,
      lat: String(lat),
      lng: String(lng),
      address: prev.address.trim() ? prev.address : calculatedAddress,
      category_id: matchedCategory ? matchedCategory.id : prev.category_id,
    }));
  };

  const startEdit = (place: Place) => {
    setEditingId(place.id);
    setForm({
      name: place.name,
      description: place.description ?? '',
      address: place.address,
      lat: String(place.lat),
      lng: String(place.lng),
      category_id: place.category_id,
      hours: place.hours ?? '',
      contact: place.contact ?? '',
      photos: place.photos.join('\n'),
    });
    setGeoSearchQuery('');
    setAutoFillInput('');
    setShowForm(true);
  };

  const startCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      category_id: categories[0]?.id ?? '',
      lat: String(UNIVERSITY.lat),
      lng: String(UNIVERSITY.lng),
      address: 'Campus da UFC em Russas, CE',
    });
    setGeoSearchQuery('');
    setAutoFillInput('');
    setShowForm(true);
  };

  const parseGoogleMapsInput = (input: string) => {
    let name: string | undefined;
    let lat: number | undefined;
    let lng: number | undefined;
    let photoUrl: string | undefined;

    let decodedInput = input;
    try {
      decodedInput = decodeURIComponent(input);
    } catch {
      // ignore
    }

    // 1. Priority 1: Exact Place Pin coordinates in Google Maps URL (!3d<lat>!4d<lng> or 3d<lat>!4d<lng>)
    const pinMatch = decodedInput.match(/3d(-?\d+\.\d+)[!&]?4d(-?\d+\.\d+)/i);
    if (pinMatch) {
      lat = parseFloat(pinMatch[1]);
      lng = parseFloat(pinMatch[2]);
    }

    // 2. Priority 2: Reversed pin parameters (2d<lng>!3d<lat>)
    if (lat === undefined || lng === undefined) {
      const revPinMatch = decodedInput.match(/2d(-?\d+\.\d+)[!&]?3d(-?\d+\.\d+)/i);
      if (revPinMatch) {
        lng = parseFloat(revPinMatch[1]);
        lat = parseFloat(revPinMatch[2]);
      }
    }

    // 3. Priority 3: Direct query param coordinates (q=lat,lng or ll=lat,lng or search/lat,lng or dir/lat,lng)
    if (lat === undefined || lng === undefined) {
      const queryMatch = decodedInput.match(/(?:[?&](?:q|ll)=(?:loc:)?|search\/|dir\/)(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/i);
      if (queryMatch) {
        lat = parseFloat(queryMatch[1]);
        lng = parseFloat(queryMatch[2]);
      }
    }

    // 4. Priority 4: Viewport camera center (@lat,lng) - used as fallback
    if (lat === undefined || lng === undefined) {
      const viewportMatch = decodedInput.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (viewportMatch) {
        lat = parseFloat(viewportMatch[1]);
        lng = parseFloat(viewportMatch[2]);
      }
    }

    // 5. Priority 5: Plain decimal coordinates in text (e.g. "-4.9471, -37.9745" or embedded in string)
    if (lat === undefined || lng === undefined) {
      const coordMatches = [...decodedInput.matchAll(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/g)];
      for (const match of coordMatches) {
        const candidateLat = parseFloat(match[1]);
        const candidateLng = parseFloat(match[2]);
        if (candidateLat >= -90 && candidateLat <= 90 && candidateLng >= -180 && candidateLng <= 180) {
          lat = candidateLat;
          lng = candidateLng;
          break;
        }
      }
    }

    // 6. Extract place name from URL (/place/Name+Of+Place/)
    const placeNameRegex = /\/place\/([^/@?]+)/;
    const placeMatch = decodedInput.match(placeNameRegex);
    if (placeMatch) {
      const rawName = placeMatch[1].replace(/\+/g, ' ').trim();
      if (rawName && !rawName.startsWith('http')) {
        name = rawName;
      }
    }

    // 7. Extract Google Photo ID if present in link
    const photoIdRegex = /(AF1Qip[A-Za-z0-9_-]{15,})/;
    const photoMatch = decodedInput.match(photoIdRegex);
    if (photoMatch) {
      photoUrl = `https://lh3.googleusercontent.com/p/${photoMatch[1]}=w800-h600`;
    }

    return { name, lat, lng, photoUrl };
  };

  const handleAutoFill = async () => {
    let rawInput = autoFillInput.trim() || form.name.trim();
    if (!rawInput) {
      alert('Digite o nome do local, cole o link do Google Maps ou coordenadas (-4.947, -37.974).');
      return;
    }

    setAutoFilling(true);

    let htmlContent = '';

    if (rawInput.includes('goo.gl') || rawInput.includes('maps.app') || rawInput.includes('maps.g') || rawInput.startsWith('http')) {
      try {
        const proxyRes = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(rawInput)}`);
        const proxyData = await proxyRes.json();
        if (proxyData) {
          if (proxyData.status?.url) {
            rawInput += ' ' + proxyData.status.url;
          }
          if (proxyData.contents) {
            htmlContent += ' ' + proxyData.contents;
          }
        }
      } catch {
        // ignore
      }

      if (!htmlContent) {
        try {
          const corsRes = await fetch(`https://corsproxy.io/?${encodeURIComponent(autoFillInput.trim())}`);
          const text = await corsRes.text();
          htmlContent += ' ' + text;
        } catch {
          // ignore
        }
      }
    }

    const combinedText = `${rawInput} ${htmlContent}`;
    const parsed = parseGoogleMapsInput(combinedText);

    let nameToUse = parsed.name || (rawInput.startsWith('http') ? '' : rawInput);
    if (!nameToUse && rawInput.includes('/place/')) {
      const match = rawInput.match(/\/place\/([^/@?]+)/);
      if (match) {
        try {
          nameToUse = decodeURIComponent(match[1].replace(/\+/g, ' '));
        } catch {
          nameToUse = match[1].replace(/\+/g, ' ');
        }
      }
    }

    let foundLat = parsed.lat;
    let foundLng = parsed.lng;
    let foundAddress = '';

    if (foundLat !== undefined && foundLng !== undefined) {
      foundAddress = await fetchAddressFromCoords(foundLat, foundLng);
    } else {
      const cleanQuery = (nameToUse || autoFillInput.trim()).replace(/https?:\/\/\S+/g, '').trim();

      if (cleanQuery) {
        try {
          let response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
              `${cleanQuery} Russas Ceara`
            )}&format=json&limit=1`
          );
          let data = await response.json();
          if (!data || data.length === 0) {
            response = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                `${cleanQuery} Ceara`
              )}&format=json&limit=1`
            );
            data = await response.json();
          }

          if (data && data.length > 0) {
            foundLat = parseFloat(data[0].lat);
            foundLng = parseFloat(data[0].lon);
            foundAddress = await fetchAddressFromCoords(foundLat, foundLng);
            if (!nameToUse) {
              nameToUse = data[0].display_name.split(',')[0];
            }
          }
        } catch {
          // ignore
        }
      }
    }

    let positionWasMissing = false;
    if (foundLat === undefined || foundLng === undefined) {
      foundLat = parseFloat(form.lat) || UNIVERSITY.lat;
      foundLng = parseFloat(form.lng) || UNIVERSITY.lng;
      positionWasMissing = true;
    }

    if (positionWasMissing) {
      alert(
        '⚠️ Não foi possível extrair a localização exata deste link ou texto de busca.\n\nA posição atual do mapa foi mantida. Você pode clicar no mapa para definir o pino onde desejar.'
      );
    }

    const detectedFromLocation = await detectCategoryFromCoords(foundLat, foundLng);

    const qLower = (nameToUse + ' ' + rawInput).toLowerCase();
    let catSlug = detectedFromLocation || 'salas-predios';
    if (!detectedFromLocation) {
      if (/igreja|templo|paróquia|paroquia|capela|catedral|evangélica|evangelica|católica|catolica/.test(qLower)) {
        catSlug = 'igrejas-templos';
      } else if (/ru|restaurante|comida|almoço|jantar|cantina|lanchonete|açaí|pizza|burger|bar|refeição/.test(qLower)) {
        catSlug = 'alimentacao';
      } else if (/biblioteca|livro|estudo|acervo/.test(qLower)) {
        catSlug = 'bibliotecas';
      } else if (/academia|fit|crossfit|treino|musculação/.test(qLower)) {
        catSlug = 'academias';
      } else if (/bloco|sala|predio|prédio|laboratorio|laboratório|auditório|secretaria/.test(qLower)) {
        catSlug = 'salas-predios';
      } else if (/dacc|da|ca|convivencia|convivência|descanso|café/.test(qLower)) {
        catSlug = 'convivencia';
      } else if (/quadra|campo|esporte|ginásio|piscina|ceu/.test(qLower)) {
        catSlug = 'esportes';
      } else if (/mercado|supermercado|conveniencia|loja/.test(qLower)) {
        catSlug = 'mercados';
      } else if (/farmacia|farmácia|remedio|hospital|posto|upa/.test(qLower)) {
        catSlug = 'saude-farmacias';
      } else if (/moradia|republica|república|pensaol|casa/.test(qLower)) {
        catSlug = 'moradias';
      } else if (/transporte|rodoviaria|rodoviária|onibus|ônibus|van/.test(qLower)) {
        catSlug = 'transporte';
      } else if (/xerox|copia|impressao|impressão|banco|correio|serviço/.test(qLower)) {
        catSlug = 'servicos';
      }
    }

    const matchedCat = categories.find((c) => c.slug === catSlug) || categories[0];

    let photoToUse = parsed.photoUrl || '';
    if (!photoToUse && (rawInput.includes('.jpg') || rawInput.includes('.png') || rawInput.includes('.webp') || rawInput.includes('googleusercontent.com'))) {
      const photoMatch = rawInput.match(/(https?:\/\/\S+\.(?:jpg|png|webp)|https?:\/\/lh3\.googleusercontent\.com\/\S+)/i);
      if (photoMatch) photoToUse = photoMatch[1];
    }

    setForm((prev) => ({
      ...prev,
      name: nameToUse || prev.name || 'Novo Local',
      category_id: matchedCat ? matchedCat.id : prev.category_id,
      lat: String(foundLat),
      lng: String(foundLng),
      address: foundAddress || prev.address || 'Russas - CE',
      description: prev.description || `Local cadastrado em Russas, CE.`,
      photos: photoToUse || prev.photos || '',
    }));

    setAutoFilling(false);
  };

  const handleSearchLocation = async () => {
    const query = geoSearchQuery.trim() || form.name.trim();
    if (!query) return;
    setSearchingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          `${query} Russas Ceara`
        )}&format=json&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const item = data[0];
        const newLat = parseFloat(item.lat);
        const newLng = parseFloat(item.lon);
        const fetchedAddress = await fetchAddressFromCoords(newLat, newLng);

        setForm((prev) => ({
          ...prev,
          lat: item.lat,
          lng: item.lon,
          address: fetchedAddress,
        }));
      } else {
        alert('Nenhum resultado encontrado para essa busca. Tente marcar diretamente no mapa.');
      }
    } catch {
      alert('Erro ao buscar localização.');
    } finally {
      setSearchingLocation(false);
    }
  };

  const handleGetGPSLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada neste dispositivo.');
      return;
    }
    setLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const address = await fetchAddressFromCoords(lat, lng);
        setForm((prev) => ({
          ...prev,
          lat: String(lat),
          lng: String(lng),
          address: prev.address.trim() ? prev.address : address,
        }));
        setLocatingGPS(false);
      },
      () => {
        alert('Não foi possível obter sua localização atual.');
        setLocatingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Url = e.target?.result as string;
      if (base64Url) {
        setForm((prev) => ({
          ...prev,
          photos: prev.photos.trim()
            ? `${prev.photos.trim()}\n${base64Url}`
            : base64Url,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePhotosPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    let foundImage = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file);
          foundImage = true;
        }
      }
    }
    if (foundImage) {
      e.preventDefault();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      processImageFile(files[i]);
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    const lines = form.photos.split('\n').filter((p) => p.trim());
    const updated = lines.filter((_, i) => i !== indexToRemove);
    setForm((prev) => ({ ...prev, photos: updated.join('\n') }));
  };

  const handleSaveCategory = async () => {
    if (!newCatName.trim()) {
      alert('Digite o nome da nova categoria.');
      return;
    }
    setSavingCat(true);
    const slug = newCatName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-');

    try {
      await createCategory({
        name: newCatName.trim(),
        slug,
        icon: newCatIcon,
        color: newCatColor,
      });
      setNewCatName('');
      setShowCategoryModal(false);
      await loadData();
    } catch {
      alert('Erro ao criar nova categoria.');
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
    try {
      await deleteCategory(id);
      await loadData();
    } catch {
      alert('Erro ao excluir categoria.');
    }
  };

  const handleSave = async () => {
    const name = form.name.trim();
    const categoryId = form.category_id || categories[0]?.id || 'cat-1';
    if (!name) {
      alert('Por favor, preencha o Nome do local.');
      return;
    }

    setSaving(true);
    const latNum = parseFloat(form.lat) || UNIVERSITY.lat;
    const lngNum = parseFloat(form.lng) || UNIVERSITY.lng;
    
    let finalAddress = form.address.trim();
    if (!finalAddress) {
      finalAddress = await fetchAddressFromCoords(latNum, lngNum);
    }

    const payload = {
      name,
      description: form.description.trim() || null,
      address: finalAddress,
      lat: latNum,
      lng: lngNum,
      category_id: categoryId,
      hours: form.hours.trim() || null,
      contact: form.contact.trim() || null,
      photos: form.photos
        .split('\n')
        .map((p) => p.trim())
        .filter(Boolean),
    };

    try {
      if (editingId) {
        await updatePlace(editingId, payload);
      } else {
        await createPlace(payload);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadData();
    } catch {
      alert('Erro ao salvar o local.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este local?')) return;
    try {
      await deletePlace(id);
      await loadData();
    } catch {
      // ignore
    }
  };

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
              <Lock className="h-7 w-7 text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Painel Administrativo</h1>
            <p className="mt-1 text-sm text-gray-400">Acesso restrito à equipe</p>
          </div>
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
          <button
            onClick={handleLogin}
            className="mt-4 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Entrar
          </button>
          <button
            onClick={onExit}
            className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao mapa
          </button>
          <p className="mt-4 text-center text-xs text-gray-300">
            Senha de demonstração: admin123
          </p>
        </div>
      </div>
    );
  }

  const filteredPlaces = search.trim()
    ? places.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : places;

  const currentLatNum = parseFloat(form.lat) || UNIVERSITY.lat;
  const currentLngNum = parseFloat(form.lng) || UNIVERSITY.lng;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-800">Painel Administrativo</h1>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              {places.length} locais
            </span>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
              {categories.length} categorias
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-100"
            >
              <Tag className="h-4 w-4" />
              Categorias ({categories.length})
            </button>
            <button
              onClick={startCreate}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 shadow-md"
            >
              <Plus className="h-4 w-4" />
              Novo local
            </button>
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              <MapPin className="h-4 w-4" />
              Ver mapa
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl p-6">
        {/* Search */}
        <div className="mb-4 relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar local cadastrado por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 shadow-sm"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Categoria</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase md:table-cell">Endereço</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPlaces.map((place) => {
                  const cat = categories.find((c) => c.id === place.category_id);
                  const Icon = getCategoryIcon(cat?.icon ?? 'MapPin');
                  return (
                    <tr key={place.id} className="transition hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${cat?.color}15` }}
                          >
                            <Icon className="h-4 w-4" style={{ color: cat?.color }} />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{place.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{cat?.name ?? '—'}</td>
                      <td className="hidden px-4 py-3 text-sm text-gray-500 md:table-cell">{place.address}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => startEdit(place)}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
                            title="Editar local"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(place.id)}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
                            title="Excluir local"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredPlaces.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400">
                Nenhum local cadastrado até o momento. Clique em &quot;Novo local&quot; para adicionar.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Manager Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl animate-fade-in">
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-800">🏷️ Gerenciar Categorias</h2>
                <p className="text-xs text-gray-400">Adicione ou remova categorias do sistema</p>
              </div>
              <button onClick={() => setShowCategoryModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Create new category form */}
            <div className="mb-5 rounded-xl border border-purple-100 bg-purple-50/50 p-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-purple-800">Criar Nova Categoria</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Nome da Categoria</label>
                  <input
                    type="text"
                    placeholder="Ex: Igrejas & Templos, Clubes..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-purple-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">Ícone / Emoji</label>
                    <select
                      value={newCatIcon}
                      onChange={(e) => setNewCatIcon(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
                    >
                      {AVAILABLE_ICONS.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.emoji} {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">Cor</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newCatColor}
                        onChange={(e) => setNewCatColor(e.target.value)}
                        className="h-9 w-12 cursor-pointer rounded-lg border-0 bg-transparent"
                      />
                      <div className="flex flex-wrap gap-1">
                        {AVAILABLE_COLORS.slice(0, 6).map((col) => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => setNewCatColor(col)}
                            className="h-5 w-5 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: col }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveCategory}
                  disabled={savingCat || !newCatName.trim()}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white transition hover:bg-purple-700 disabled:opacity-50 shadow-md"
                >
                  {savingCat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Adicionar Categoria
                </button>
              </div>
            </div>

            {/* List existing categories */}
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Categorias Cadastradas ({categories.length})</h3>
              <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
                {categories.map((cat) => {
                  const Icon = getCategoryIcon(cat.icon);
                  return (
                    <div key={cat.id} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${cat.color}20` }}>
                          <Icon className="h-4 w-4" style={{ color: cat.color }} />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-800">{cat.name}</span>
                          <span className="ml-2 text-xs text-gray-400">({cat.slug})</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                        title="Excluir Categoria"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fast Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl animate-fade-in">
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {editingId ? 'Editar local' : 'Novo local no mapa'}
                </h2>
                <p className="text-xs text-gray-400">
                  Preencha o nome e selecione o ponto no mapa para cadastrar
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Auto-Fill Assistant Card */}
            <div className="mb-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white shadow-md">
              <div className="mb-1 flex items-center gap-1.5 text-sm font-bold">
                <Zap className="h-4 w-4 fill-amber-300 text-amber-300" />
                Assistente de Auto-Preenchimento Rápido
              </div>
              <p className="mb-3 text-xs text-blue-100">
                Cole o link do Google Maps, coordenadas (-4.947, -37.974) ou o nome do lugar para atualizar os campos:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Cole o link do Google Maps ou digite o nome..."
                  value={autoFillInput}
                  onChange={(e) => setAutoFillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAutoFill())}
                  className="flex-1 rounded-xl border-0 bg-white/90 px-3.5 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleAutoFill}
                  disabled={autoFilling}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-gray-900 transition hover:bg-amber-300 disabled:opacity-50 shadow-sm"
                >
                  {autoFilling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-gray-900" />}
                  Auto-Preencher
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Nome e Categoria */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Nome do Local *</label>
                  <input
                    type="text"
                    placeholder="Ex: Igreja Matriz, Bloco de Computação..."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Categoria *</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Localização no mapa interativo */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700">
                    Posição no Mapa (Clique no mapa para posicionar o pino)
                  </label>
                  <button
                    type="button"
                    onClick={handleGetGPSLocation}
                    disabled={locatingGPS}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    {locatingGPS ? <Loader2 className="h-3 w-3 animate-spin" /> : <LocateFixed className="h-3 w-3" />}
                    Pegar meu GPS
                  </button>
                </div>

                <LocationPickerMap
                  lat={currentLatNum}
                  lng={currentLngNum}
                  onChange={handleLocationPick}
                />
              </div>

              {/* Busca de endereço rápida */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Ou digite o nome da rua / local para buscar no mapa:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Rua Felipe Santiago, Russas"
                    value={geoSearchQuery}
                    onChange={(e) => setGeoSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchLocation())}
                    className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={handleSearchLocation}
                    disabled={searchingLocation}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
                  >
                    {searchingLocation ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Compass className="h-3.5 w-3.5" />}
                    Buscar Posição
                  </button>
                </div>
              </div>

              {/* Endereço */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Endereço / Referência (Preenchido automaticamente ao clicar no mapa)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Campus da UFC em Russas, CE"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Opcionais recolhidos / detalhes */}
              <div className="space-y-3 border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-400">Detalhes Opcionais:</p>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Descrição / Dica para o Calouro</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    placeholder="Dicas sobre o local, o que encontrar aqui..."
                    className="w-full resize-none rounded-xl border border-gray-200 px-3.5 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Horário de Funcionamento</label>
                    <input
                      type="text"
                      placeholder="Ex: Seg-Sex 08h às 18h"
                      value={form.hours}
                      onChange={(e) => setForm({ ...form, hours: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Contato / Instagram</label>
                    <input
                      type="text"
                      placeholder="Ex: @ufcrussas"
                      value={form.contact}
                      onChange={(e) => setForm({ ...form, contact: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">
                      Fotos do Local (Cole imagens copiadas com Ctrl+V ou adicione URLs)
                    </label>
                    <label className="flex cursor-pointer items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition shadow-sm">
                      <Upload className="h-3.5 w-3.5 text-blue-600" />
                      Escolher foto do aparelho
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <textarea
                    value={form.photos}
                    onChange={(e) => setForm({ ...form, photos: e.target.value })}
                    onPaste={handlePhotosPaste}
                    rows={2}
                    placeholder="📋 Cole uma imagem copiada com Ctrl+V aqui ou cole a URL da foto (uma por linha)..."
                    className="w-full resize-none rounded-xl border border-gray-200 px-3.5 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />

                  {/* Thumbnail Previews */}
                  {form.photos.split('\n').filter((p) => p.trim()).length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {form.photos
                        .split('\n')
                        .map((p) => p.trim())
                        .filter(Boolean)
                        .map((photoUrl, index) => (
                          <div key={index} className="relative h-16 w-16 overflow-hidden rounded-xl border border-gray-200 shadow-sm group">
                            <img
                              src={photoUrl}
                              alt={`Foto ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(index)}
                              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-90 transition hover:bg-rose-600"
                              title="Remover foto"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 shadow-md"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingId ? 'Salvar alterações' : 'Adicionar ao Mapa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
