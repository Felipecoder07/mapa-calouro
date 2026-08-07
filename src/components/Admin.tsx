import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Lock, LogOut, Plus, Pencil, Trash2, X, Search, Loader2,
  Save, MapPin, ArrowLeft, LocateFixed, Zap, Upload, Image as ImageIcon,
  Tag, Compass, Star, Send,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ADMIN_PASSWORD_KEY, UNIVERSITY } from '@/lib/constants';
import { fetchCategories, fetchPlaces, createPlace, updatePlace, deletePlace, createCategory, deleteCategory, loginAdmin, getAdminToken, fetchReviews, addReview, deleteReview } from '@/lib/api';
import { getCategoryIcon, getCategoryEmoji } from '@/lib/icons';
import { haversineDistance } from '@/lib/distance';
import type { Place, Category, Review } from '@/types';

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
        attributionControl={false}
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
  const [newCatCustomEmoji, setNewCatCustomEmoji] = useState('');
  const [newCatColor, setNewCatColor] = useState('#a855f7');
  const [savingCat, setSavingCat] = useState(false);

  const [searchingLocation, setSearchingLocation] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [locatingGPS, setLocatingGPS] = useState(false);
  const [geoSearchQuery, setGeoSearchQuery] = useState('');
  const [autoFillInput, setAutoFillInput] = useState('');
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [catDropdownRect, setCatDropdownRect] = useState<DOMRect | null>(null);
  const catDropdownBtnRef = useRef<HTMLButtonElement>(null);

  // Review management states for Admin Place Modal
  const [modalReviews, setModalReviews] = useState<Review[]>([]);
  const [loadingModalReviews, setLoadingModalReviews] = useState(false);
  const [adminReviewAuthor, setAdminReviewAuthor] = useState('');
  const [adminReviewRating, setAdminReviewRating] = useState(5);
  const [adminReviewComment, setAdminReviewComment] = useState('');
  const [submittingAdminReview, setSubmittingAdminReview] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_PASSWORD_KEY);
    if (stored === 'true') setAuthed(true);
  }, []);

  // Lock body scroll when any modal is open to prevent scroll chaining to background
  useEffect(() => {
    const isAnyModalOpen = showForm || showCategoryModal;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showForm, showCategoryModal]);

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

  const catDropdownPanelRef = useRef<HTMLDivElement>(null);

  const updateCatDropdownPosition = useCallback(() => {
    if (catDropdownBtnRef.current) {
      setCatDropdownRect(catDropdownBtnRef.current.getBoundingClientRect());
    }
  }, []);

  // Update fixed dropdown position on scroll/resize and handle click outside
  useEffect(() => {
    if (!showCatDropdown) return;

    updateCatDropdownPosition();

    const handleScrollOrResize = (e: Event) => {
      if (e.type === 'scroll') {
        // Close dropdown if scroll originated anywhere outside the dropdown panel itself
        if (catDropdownPanelRef.current && !catDropdownPanelRef.current.contains(e.target as Node)) {
          setShowCatDropdown(false);
          return;
        }
      }
      updateCatDropdownPosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    const handleClickOutside = (e: MouseEvent) => {
      if (
        catDropdownBtnRef.current &&
        !catDropdownBtnRef.current.contains(e.target as Node) &&
        catDropdownPanelRef.current &&
        !catDropdownPanelRef.current.contains(e.target as Node)
      ) {
        setShowCatDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCatDropdown, updateCatDropdownPosition]);

  const handleLogin = async () => {
    setError('');
    const ok = await loginAdmin(password);
    if (ok) {
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
    if (distToCampus <= 0.15) {
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
      if (distToCampus <= 0.15) {
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
    setModalReviews([]);
    setAdminReviewAuthor('');
    setAdminReviewRating(5);
    setAdminReviewComment('');
    setLoadingModalReviews(true);
    fetchReviews(place.id)
      .then(setModalReviews)
      .catch(() => setModalReviews([]))
      .finally(() => setLoadingModalReviews(false));
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
    setModalReviews([]);
    setAdminReviewAuthor('');
    setAdminReviewRating(5);
    setAdminReviewComment('');
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
    // Note: Google Maps URLs often place the city/region coordinates first and the specific place pin coordinates LAST.
    const pinMatches = [...decodedInput.matchAll(/3d(-?\d+\.\d+)[!&]?4d(-?\d+\.\d+)/gi)];
    if (pinMatches.length > 0) {
      const lastMatch = pinMatches[pinMatches.length - 1];
      lat = parseFloat(lastMatch[1]);
      lng = parseFloat(lastMatch[2]);
    }

    // 2. Priority 2: Reversed pin parameters (2d<lng>!3d<lat>)
    if (lat === undefined || lng === undefined) {
      const revPinMatches = [...decodedInput.matchAll(/2d(-?\d+\.\d+)[!&]?3d(-?\d+\.\d+)/gi)];
      if (revPinMatches.length > 0) {
        const lastRev = revPinMatches[revPinMatches.length - 1];
        lng = parseFloat(lastRev[1]);
        lat = parseFloat(lastRev[2]);
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

    // 4. Priority 4: Plain decimal coordinates in text (e.g. "-4.9471, -37.9745")
    if (lat === undefined || lng === undefined) {
      const coordMatches = [...decodedInput.matchAll(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/g)];
      for (const match of coordMatches) {
        const candidateLat = parseFloat(match[1]);
        const candidateLng = parseFloat(match[2]);
        // Only accept coordinates within the Russas / Ceará region bounds (-5.2 to -4.7 lat, -38.2 to -37.7 lng)
        if (candidateLat >= -5.3 && candidateLat <= -4.6 && candidateLng >= -38.3 && candidateLng <= -37.6) {
          lat = candidateLat;
          lng = candidateLng;
          break;
        }
      }
    }

    // 5. Extract place name from URL (/place/Name+Of+Place/)
    const placeNameRegex = /\/place\/([^/@?]+)/;
    const placeMatch = decodedInput.match(placeNameRegex);
    if (placeMatch) {
      let rawName = placeMatch[1].replace(/\+/g, ' ').trim();
      try {
        rawName = decodeURIComponent(rawName);
      } catch {
        // ignore
      }
      if (rawName && !rawName.startsWith('http')) {
        name = rawName;
      }
    }

    // 6. Extract Google Photo ID if present in link
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

    // First check if the raw input ALREADY contains exact coordinates and place name (instant 0.01s parse!)
    let parsed = parseGoogleMapsInput(rawInput);

    // Only query proxy servers if coordinates are missing AND it's a shortened URL (e.g. maps.app.goo.gl)
    if ((parsed.lat === undefined || parsed.lng === undefined) &&
        (rawInput.includes('goo.gl') || rawInput.includes('maps.app') || rawInput.includes('maps.g') || rawInput.startsWith('http'))) {
      
      const fetchWithTimeout = async (url: string, timeoutMs = 1500) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);
        try {
          return await fetch(url, { signal: controller.signal });
        } finally {
          clearTimeout(id);
        }
      };

      try {
        const proxyRes = await fetchWithTimeout(`https://api.allorigins.win/get?url=${encodeURIComponent(rawInput)}`, 1500);
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
        // ignore timeout or network error
      }

      if (!htmlContent) {
        try {
          const corsRes = await fetchWithTimeout(`https://corsproxy.io/?${encodeURIComponent(autoFillInput.trim())}`, 1500);
          const text = await corsRes.text();
          htmlContent += ' ' + text;
        } catch {
          // ignore timeout
        }
      }

      // Re-parse with htmlContent from proxy
      parsed = parseGoogleMapsInput(`${rawInput} ${htmlContent}`);
    }

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

    if (nameToUse) {
      try {
        nameToUse = decodeURIComponent(nameToUse);
      } catch {
        // ignore
      }
    }

    let foundLat = parsed.lat;
    let foundLng = parsed.lng;

    // Validate that found coordinates are within Russas region bounds
    if (foundLat !== undefined && foundLng !== undefined) {
      if (foundLat < -5.3 || foundLat > -4.6 || foundLng < -38.3 || foundLng > -37.6) {
        // Reject out-of-bounds coordinates
        foundLat = undefined;
        foundLng = undefined;
      }
    }

    if (foundLat === undefined || foundLng === undefined) {
      const cleanQuery = (nameToUse || autoFillInput.trim()).replace(/https?:\/\/\S+/g, '').trim();

      if (cleanQuery) {
        try {
          // Search ONLY within Russas Ceara to prevent picking locations from other cities
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
              `${cleanQuery} Russas Ceara`
            )}&format=json&limit=1`
          );
          const data = await response.json();

          if (data && data.length > 0) {
            const candidateLat = parseFloat(data[0].lat);
            const candidateLng = parseFloat(data[0].lon);
            // Verify search result is inside Russas region
            if (candidateLat >= -5.3 && candidateLat <= -4.6 && candidateLng >= -38.3 && candidateLng <= -37.6) {
              foundLat = candidateLat;
              foundLng = candidateLng;
              if (!nameToUse) {
                nameToUse = data[0].display_name.split(',')[0];
              }
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

    const finalLat = foundLat ?? UNIVERSITY.lat;
    const finalLng = foundLng ?? UNIVERSITY.lng;

    // Execute address lookup and category detection IN PARALLEL for maximum speed (cuts wait time in half!)
    const [foundAddress, detectedFromLocation] = await Promise.all([
      fetchAddressFromCoords(finalLat, finalLng),
      detectCategoryFromCoords(finalLat, finalLng),
    ]);

    // Strip raw URLs out of search text so parameters like 'russas' or 'data' in URLs don't trigger false category matches
    const textWithoutUrl = (nameToUse + ' ' + rawInput).replace(/https?:\/\/\S+/gi, '').trim();
    const qLower = textWithoutUrl.toLowerCase();

    let detectedFromName: string | null = null;
    if (/igreja|templo|paróquia|paroquia|capela|catedral|evangélica|evangelica|católica|catolica|adventista|batista|presbiteriana|metodista|assembleia|assembléia|mesquita|sinagoga|espírita|espirita|terreiro|santuário|santuario|missa|culto/.test(qLower)) {
      detectedFromName = 'igrejas-templos';
    } else if (/\bru\b|restaurante|comida|almoço|almoco|jantar|cantina|lanchonete|açaí|acai|pizza|pizzaria|burger|hambúrguer|hamburguer|hamburgueria|bar|refeição|refeicao|espetinho|espeto|churrascaria|marmita|marmitaria|pastel|pastelaria|sorvete|sorveteria|gelato|doceria|confeitaria|padaria|panificadora|bistrô|bistro|sushi|temakeria|churros|tapioca|tapiocaria|foodtruck|petisco|boteco|choperia/.test(qLower)) {
      detectedFromName = 'alimentacao';
    } else if (/biblioteca|livro|livraria|estudo|acervo|leitura|videoteca|gibiteca|sebo/.test(qLower)) {
      detectedFromName = 'bibliotecas';
    } else if (/academia|fit|crossfit|treino|musculação|musculacao|pilates|fisioterapia|funcional|calistenia|aeróbica|aerobica|dança|danca|jiu jitsu|boxe|karate|karatê|muay thai/.test(qLower)) {
      detectedFromName = 'academias';
    } else if (/bloco|sala|predio|prédio|laboratorio|laboratório|auditório|auditorio|secretaria|diretoria|coordenação|coordenacao|gabinete|departamento|dce|centro acadêmico|centro academico|anfiteatro|complexo|núcleo|nucleo/.test(qLower)) {
      detectedFromName = 'salas-predios';
    } else if (/dacc|\bda\b|\bca\b|convivencia|convivência|descanso|café|cafe|praça|praca|espaço|espaco|área verde|area verde|vivência|vivencia|resenha|lounge|sinuca/.test(qLower)) {
      detectedFromName = 'convivencia';
    } else if (/quadra|campo|esporte|ginásio|ginasio|piscina|ceu|futebol|society|vôlei|volei|basquete|tênis|tenis|beach tennis|futsal|arena|estádio|estadio|atletismo/.test(qLower)) {
      detectedFromName = 'esportes';
    } else if (/mercado|supermercado|conveniencia|conveniência|loja|mercearia|atacado|atacadão|atacadao|hipermercado|hortifruti|frutaria|açougue|acougue|peixaria|utilidades|bazar|shopping|galeria/.test(qLower)) {
      detectedFromName = 'mercados';
    } else if (/farmacia|farmácia|remedio|remédio|hospital|posto|upa|clínica|clinica|médico|medico|drogaria|drogarias|dentista|odontologia|odonto|psicologia|enfermagem|pronto socorro|samu|vacina/.test(qLower)) {
      detectedFromName = 'saude-farmacias';
    } else if (/moradia|republica|república|pensão|pensaol|casa|kitnet|kit|pousada|quarto|apartamento|apto|flat|condomínio|condominio|aluguel|hospedagem|hotel/.test(qLower)) {
      detectedFromName = 'moradias';
    } else if (/transporte|rodoviaria|rodoviária|onibus|ônibus|van|parada|terminal|estação|estacao|metrô|metro|lotação|lotacao|táxi|taxi|uber|garagem/.test(qLower)) {
      detectedFromName = 'transporte';
    } else if (/xerox|copia|cópia|impressao|impressão|banco|correio|serviço|servico|gráfica|grafica|papelaria|chaveiro|barbearia|salão|salao|estética|estetica|lotérica|loterica|caixa eletrônico|caixa eletronico|lan house|assistência|assistencia|oficina|lava jato/.test(qLower)) {
      detectedFromName = 'servicos';
    }

    const catSlug = detectedFromName || detectedFromLocation || 'salas-predios';

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

    const iconToSave = newCatCustomEmoji.trim() || newCatIcon;

    try {
      await createCategory({
        name: newCatName.trim(),
        slug,
        icon: iconToSave,
        color: newCatColor,
      });
      setNewCatName('');
      setNewCatCustomEmoji('');
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

  const handleAddAdminReview = async () => {
    if (!adminReviewAuthor.trim()) return;
    if (editingId) {
      setSubmittingAdminReview(true);
      try {
        const created = await addReview({
          place_id: editingId,
          author: adminReviewAuthor.trim(),
          rating: adminReviewRating,
          comment: adminReviewComment.trim() || null,
        });
        setModalReviews((prev) => [created, ...prev]);
        setAdminReviewAuthor('');
        setAdminReviewRating(5);
        setAdminReviewComment('');
      } catch {
        alert('Erro ao salvar avaliação');
      } finally {
        setSubmittingAdminReview(false);
      }
    } else {
      const tempReview: Review = {
        id: `rev-temp-${Date.now()}-${Math.random()}`,
        place_id: '',
        author: adminReviewAuthor.trim(),
        rating: adminReviewRating,
        comment: adminReviewComment.trim() || null,
        created_at: new Date().toISOString(),
      };
      setModalReviews((prev) => [tempReview, ...prev]);
      setAdminReviewAuthor('');
      setAdminReviewRating(5);
      setAdminReviewComment('');
    }
  };

  const handleDeleteAdminReview = async (review: Review) => {
    if (!confirm('Deseja excluir esta avaliação?')) return;
    try {
      if (!review.id.startsWith('rev-temp-')) {
        await deleteReview(review.id);
      }
      setModalReviews((prev) => prev.filter((r) => r.id !== review.id));
    } catch {
      alert('Erro ao excluir avaliação');
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
        const created = await createPlace(payload);
        if (modalReviews.length > 0) {
          for (const rev of modalReviews) {
            await addReview({
              place_id: created.id,
              author: rev.author,
              rating: rev.rating,
              comment: rev.comment,
            });
          }
        }
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      setModalReviews([]);
      await loadData();
    } catch (e) {
      console.error('Erro em handleSave:', e);
      alert('Erro ao salvar o local. Verifique os campos e tente novamente.');
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
      <div className="flex min-h-screen items-center justify-center bg-slate-200/80 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl border border-slate-300/50">
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
                  const emoji = getCategoryEmoji(cat);
                  return (
                    <tr key={place.id} className="transition hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-base shadow-sm"
                            style={{ backgroundColor: `${cat?.color}15` }}
                            title={cat?.name}
                          >
                            {emoji}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{place.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-xs"
                          style={{ backgroundColor: `${cat?.color}15`, color: cat?.color }}
                        >
                          <span>{emoji}</span>
                          <span>{cat?.name ?? '—'}</span>
                        </span>
                      </td>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(28,28,28,0.55)' }}>
          <div
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl p-0 animate-fade-in"
            style={{
              background: '#f7f4ed',
              border: '1px solid #eceae4',
              boxShadow: 'rgba(0,0,0,0.18) 0px 16px 48px',
            }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-6 py-5"
              style={{ borderBottom: '1px solid #eceae4' }}
            >
              <div>
                <h2 className="text-xl font-semibold" style={{ color: '#1c1c1c', letterSpacing: '-0.4px' }}>
                  Gerenciar Categorias
                </h2>
                <p className="mt-0.5 text-sm" style={{ color: '#5f5f5d' }}>
                  Adicione ou remova categorias do sistema
                </p>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full transition"
                style={{ background: 'rgba(28,28,28,0.06)', color: '#5f5f5d' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(28,28,28,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(28,28,28,0.06)')}
                title="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Create new category form */}
              <div
                className="rounded-xl p-5 space-y-4"
                style={{ background: 'rgba(28,28,28,0.03)', border: '1px solid #eceae4' }}
              >
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(28,28,28,0.4)' }}>
                  Nova Categoria
                </p>

                {/* Name */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium" style={{ color: '#1c1c1c' }}>
                    Nome da Categoria
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Igrejas & Templos, Clubes..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition"
                    style={{
                      background: '#f7f4ed',
                      border: '1px solid #eceae4',
                      color: '#1c1c1c',
                    }}
                    onFocus={e => (e.currentTarget.style.border = '1px solid rgba(28,28,28,0.4)')}
                    onBlur={e => (e.currentTarget.style.border = '1px solid #eceae4')}
                  />
                </div>

                {/* Icon / Emoji */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium" style={{ color: '#1c1c1c' }}>
                    Ícone ou Emoji da Categoria
                  </label>
                  <input
                    type="text"
                    placeholder="Digite o nome do ícone ou cole um emoji (ex: 🎯, 🚀, 🎭, ⛪)..."
                    value={newCatCustomEmoji}
                    onChange={(e) => {
                      setNewCatCustomEmoji(e.target.value);
                      setNewCatIcon(e.target.value);
                    }}
                    className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition"
                    style={{
                      background: '#f7f4ed',
                      border: '1px solid #eceae4',
                      color: '#1c1c1c',
                    }}
                    onFocus={e => (e.currentTarget.style.border = '1px solid rgba(28,28,28,0.4)')}
                    onBlur={e => (e.currentTarget.style.border = '1px solid #eceae4')}
                  />

                  {/* Quick emoji picker */}
                  <p className="mt-2.5 mb-1.5 text-xs" style={{ color: 'rgba(28,28,28,0.4)' }}>
                    Ou selecione um emoji rápido:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['🎯', '🚀', '🎭', '🎨', '🏛️', '🏥', '🍿', '🍔', '⚽', '🚌', '🎓', '💊', '🛒', '🏠', '🖨️', '⛪', '✨', '☕', '💪', '🍽️', '📚', '🏢'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setNewCatCustomEmoji(emoji);
                          setNewCatIcon(emoji);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-base transition"
                        style={{
                          background: newCatCustomEmoji === emoji ? '#1c1c1c' : '#f7f4ed',
                          border: `1px solid ${newCatCustomEmoji === emoji ? '#1c1c1c' : '#eceae4'}`,
                          boxShadow: newCatCustomEmoji === emoji ? 'rgba(255,255,255,0.2) 0px 0.5px 0px 0px inset, rgba(0,0,0,0.2) 0px 0px 0px 0.5px inset' : 'none',
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium" style={{ color: '#1c1c1c' }}>
                    Cor
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded-lg"
                      style={{ border: '1px solid #eceae4', background: 'transparent' }}
                    />
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_COLORS.map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setNewCatColor(col)}
                          className="h-6 w-6 rounded-full transition"
                          style={{
                            backgroundColor: col,
                            border: newCatColor === col ? `3px solid #1c1c1c` : '2px solid #eceae4',
                            boxShadow: newCatColor === col ? '0 0 0 1px #f7f4ed' : 'none',
                          }}
                          title={col}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview + CTA */}
                <div className="flex items-center gap-3">
                  {/* Live preview pill */}
                  {newCatName.trim() && (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ background: `${newCatColor}18`, color: newCatColor, border: `1px solid ${newCatColor}30` }}
                    >
                      <span>{newCatCustomEmoji || '🏷️'}</span>
                      <span>{newCatName}</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveCategory}
                    disabled={savingCat || !newCatName.trim()}
                    className="ml-auto flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-40"
                    style={{
                      background: '#1c1c1c',
                      color: '#fcfbf8',
                      boxShadow: 'rgba(255,255,255,0.2) 0px 0.5px 0px 0px inset, rgba(0,0,0,0.2) 0px 0px 0px 0.5px inset, rgba(0,0,0,0.05) 0px 1px 2px 0px',
                    }}
                  >
                    {savingCat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Existing categories list */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(28,28,28,0.4)' }}>
                  Cadastradas — {categories.length}
                </p>
                <div
                  className="max-h-64 overflow-y-auto rounded-xl"
                  style={{ border: '1px solid #eceae4' }}
                >
                  {categories.map((cat, idx) => {
                    const emoji = getCategoryEmoji(cat);
                    return (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between px-4 py-3 transition"
                        style={{
                          borderTop: idx > 0 ? '1px solid #eceae4' : 'none',
                          background: '#f7f4ed',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(28,28,28,0.03)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#f7f4ed')}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
                            style={{ background: `${cat.color}18`, border: `1px solid ${cat.color}25` }}
                          >
                            {emoji}
                          </div>
                          <div>
                            <span className="text-sm font-medium" style={{ color: '#1c1c1c' }}>
                              {cat.name}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg transition"
                          style={{ color: 'rgba(28,28,28,0.4)', background: 'transparent', border: '1px solid transparent' }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                            e.currentTarget.style.color = '#ef4444';
                            e.currentTarget.style.border = '1px solid rgba(239,68,68,0.2)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'rgba(28,28,28,0.4)';
                            e.currentTarget.style.border = '1px solid transparent';
                          }}
                          title="Excluir categoria"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                  {categories.length === 0 && (
                    <div className="py-8 text-center text-sm" style={{ color: 'rgba(28,28,28,0.4)' }}>
                      Nenhuma categoria cadastrada.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fast Form modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForm(false);
          }}
          onWheel={(e) => e.stopPropagation()}
        >
          <div
            className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl animate-fade-in"
            onWheel={(e) => e.stopPropagation()}
          >
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
                  {/* Custom dropdown trigger */}
                  <button
                    ref={catDropdownBtnRef}
                    type="button"
                    onClick={() => setShowCatDropdown((v) => !v)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-left outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                  >
                    <span className="flex items-center gap-2 truncate">
                      {form.category_id ? (() => {
                        const cat = categories.find(c => c.id === form.category_id);
                        return cat ? <><span>{getCategoryEmoji(cat)}</span><span className="truncate">{cat.name}</span></> : <span className="text-gray-400">Selecionar categoria...</span>;
                      })() : <span className="text-gray-400">Selecionar categoria...</span>}
                    </span>
                    <svg className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${showCatDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>

                  {/* Custom dropdown panel — fixed position to escape overflow-hidden/Leaflet, with real-time scroll tracking */}
                  {showCatDropdown && catDropdownRect && (
                    <div
                      ref={catDropdownPanelRef}
                      className="overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-2xl"
                      style={{
                        position: 'fixed',
                        top: catDropdownRect.bottom + 4,
                        left: catDropdownRect.left,
                        width: catDropdownRect.width,
                        maxHeight: '220px',
                        zIndex: 9999,
                      }}
                      onWheel={(e) => e.stopPropagation()}
                    >
                      {categories.map((cat) => {
                        const isSelected = form.category_id === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setForm({ ...form, category_id: cat.id });
                              setShowCatDropdown(false);
                            }}
                            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-left transition hover:bg-gray-50"
                            style={{
                              background: isSelected ? `${cat.color}12` : undefined,
                              borderLeft: isSelected ? `3px solid ${cat.color}` : '3px solid transparent',
                            }}
                          >
                            <span
                              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-base"
                              style={{ background: `${cat.color}18` }}
                            >
                              {getCategoryEmoji(cat)}
                            </span>
                            <span className="truncate font-medium text-gray-800">{cat.name}</span>
                            {isSelected && <span className="ml-auto text-xs font-semibold" style={{ color: cat.color }}>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
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

              {/* Reviews Management Section (Admin Only) */}
              <div className="space-y-3 border-t border-gray-100 pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    ⭐ Avaliações do Local ({modalReviews.length})
                  </h3>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                    Gestão Admin PET
                  </span>
                </div>

                {/* Existing Reviews List */}
                {loadingModalReviews ? (
                  <div className="flex justify-center py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                ) : modalReviews.length > 0 ? (
                  <div className="max-h-44 overflow-y-auto space-y-2 pr-1 rounded-xl border border-gray-100 bg-gray-50/50 p-2">
                    {modalReviews.map((rev) => (
                      <div key={rev.id} className="flex items-start justify-between rounded-xl bg-white p-2.5 shadow-2xs border border-gray-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-800">{rev.author}</span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <Star
                                  key={n}
                                  className={`h-3 w-3 ${n <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                                />
                              ))}
                            </div>
                          </div>
                          {rev.comment && <p className="mt-1 text-xs text-gray-600 leading-relaxed">{rev.comment}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteAdminReview(rev)}
                          className="rounded-lg p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Excluir avaliação"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Nenhuma avaliação cadastrada para este local ainda.</p>
                )}

                {/* Form to add a new review as Admin */}
                <div className="rounded-xl border border-gray-200/80 bg-gray-50/90 p-3 space-y-2.5">
                  <p className="text-xs font-bold text-gray-700">➕ Adicionar Avaliação ao Local:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="mb-0.5 block text-[11px] font-medium text-gray-500">Nome do Autor</label>
                      <input
                        type="text"
                        placeholder="Ex: PET Computação, Calouro UFC..."
                        value={adminReviewAuthor}
                        onChange={(e) => setAdminReviewAuthor(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-[11px] font-medium text-gray-500">Nota (1 a 5 estrelas)</label>
                      <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-gray-200 h-[34px]">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setAdminReviewRating(n)}
                          >
                            <Star
                              className={`h-4 w-4 transition ${n <= adminReviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 hover:text-amber-300'}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[11px] font-medium text-gray-500">Comentário / Recomendação</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ex: Excelente espaço para estudar em grupo, ar condicionado forte!"
                        value={adminReviewComment}
                        onChange={(e) => setAdminReviewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAdminReview())}
                        className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-blue-400"
                      />
                      <button
                        type="button"
                        onClick={handleAddAdminReview}
                        disabled={submittingAdminReview || !adminReviewAuthor.trim()}
                        className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50 shadow-xs"
                      >
                        {submittingAdminReview ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        Adicionar
                      </button>
                    </div>
                  </div>
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
