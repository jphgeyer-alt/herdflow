import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Alert,
  Easing,
  Linking,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
});

type Section = 'Dashboard' | 'Marketplace' | 'Cattle' | 'Camps' | 'Vaccines' | 'Counts';
type Gender = 'Female' | 'Male' | 'Other';
type Status = 'Active' | 'Sold' | 'Quarantined' | 'Dead' | 'Veterinary';

interface CattleRecord {
  id: number;
  tag: string;
  breed: string;
  colorId: string;
  gender: Gender;
  birthDate: string;
  status: Status;
  weight: number;
  campId: number | null;
  soldPrice?: number | null;
  soldDate?: string | null;
  soldBuyerAuction?: string;
  deadReason?: string;
  note: string;
  createdAt: string;
}

interface Camp {
  id: number;
  name: string;
  colorId: string;
  description: string;
  createdAt: string;
}

interface VaccineRecord {
  id: number;
  campId: number | null;
  cattleId: number | null;
  vaccineName: string;
  medicineName: string;
  treatmentType: 'Vaccine' | 'Medicine' | 'Sick Treatment';
  applicationMethod: string;
  nextDueAt: string;
  scheduledDate?: string;
  givenDate: string | null;
  note: string;
  createdAt: string;
}

interface CountLog {
  id: number;
  campId: number;
  countDate: string;
  bulls: number;
  cows: number;
  calves: number;
  personCounted?: string;
  note: string;
  createdAt: string;
}

interface MarketplaceItem {
  id: number;
  name: string;
  price: string;
  unit: string;
  description: string;
  imageUrl?: string;
  stock?: number;
  isPublished?: boolean;
  publishedAt?: string | null;
  createdAt: string;
}

interface MarketplaceRegistration {
  id: number;
  certificationType: 'Logistics Certified Client' | 'Certified Livestock Seller';
  status: 'Pending' | 'Approved' | 'Rejected';
  name: string;
  companyName: string;
  phone: string;
  email: string;
  region: string;
  note: string;
  createdAt: string;
}

interface PendingMutation {
  id: string;
  path: string;
  method: string;
  body?: string;
  createdAt: string;
}

type MutationResult =
  | { ok: true; queued: false; response: Response }
  | { ok: false; queued: boolean; errorMessage: string };

type RawCattleRecord = Partial<CattleRecord> & {
  soldBuyerAction?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim()) {
    return error;
  }
  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizePendingMutations(value: unknown, maxQueueSize: number): PendingMutation[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is PendingMutation => {
      return isRecord(entry)
        && typeof entry.id === 'string'
        && typeof entry.path === 'string'
        && typeof entry.method === 'string'
        && typeof entry.createdAt === 'string'
        && (entry.body === undefined || typeof entry.body === 'string');
    })
    .slice(-maxQueueSize);
}

function normalizeCattleRecords(value: unknown): CattleRecord[] {
  return toArray<RawCattleRecord>(value).map((record) => ({
    ...record,
    soldBuyerAuction: record.soldBuyerAuction ?? record.soldBuyerAction ?? '',
    deadReason: record.deadReason ?? (record.status === 'Dead' ? (record.note ?? '') : '')
  })) as CattleRecord[];
}

const expoEnv = (globalThis as {
  process?: {
    env?: {
      EXPO_PUBLIC_API_BASE?: string;
      EXPO_PUBLIC_MARKETPLACE_URL?: string;
      EXPO_PUBLIC_SITE_URL?: string;
      EXPO_PUBLIC_HERDFLOW_REGISTRATION_EMAIL?: string;
    };
  };
}).process?.env;

function trimTrailingSlashes(value: string) {
  return value.replace(/\/+$/, '');
}

function normalizeHostTypos(value: string) {
  return value.replace(/\.orender\.com/gi, '.onrender.com');
}

function forceMarketplacePath(value: string) {
  const normalized = normalizeHostTypos(value.trim());
  if (!normalized) return normalized;

  try {
    const parsed = new URL(normalized);
    parsed.pathname = '/marketplace';
    parsed.search = '';
    parsed.hash = '';
    return trimTrailingSlashes(parsed.toString());
  } catch {
    const withoutQuery = normalized.split(/[?#]/)[0];
    const base = trimTrailingSlashes(withoutQuery);
    return base.endsWith('/marketplace') ? base : `${base}/marketplace`;
  }
}

function resolveMarketplaceUrl(explicitMarketplaceUrl: string | undefined, siteBaseUrl: string) {
  const fallback = forceMarketplacePath(siteBaseUrl);
  if (!explicitMarketplaceUrl) return fallback;

  const candidate = explicitMarketplaceUrl.trim();
  if (!candidate) return fallback;
  return forceMarketplacePath(candidate);
}

const configuredApiBase = expoEnv?.EXPO_PUBLIC_API_BASE?.trim();
const API_BASE = trimTrailingSlashes(normalizeHostTypos(configuredApiBase || 'https://herdflow-h619.onrender.com'));
const HERDFLOW_REGISTRATION_EMAIL = expoEnv?.EXPO_PUBLIC_HERDFLOW_REGISTRATION_EMAIL?.trim() || 'sales@herdflow.example';
const configuredMarketplaceUrl = expoEnv?.EXPO_PUBLIC_MARKETPLACE_URL?.trim();
const configuredSiteUrl = expoEnv?.EXPO_PUBLIC_SITE_URL?.trim();
const resolvedSiteUrl = trimTrailingSlashes(normalizeHostTypos(configuredSiteUrl || 'https://herdflow-h619.onrender.com'));
const MARKETPLACE_URL = resolveMarketplaceUrl(configuredMarketplaceUrl, resolvedSiteUrl);
const API_BASE_CANDIDATES = Array.from(new Set([
  API_BASE,
  'http://localhost:4175',
  'http://127.0.0.1:4175',
  'http://localhost:4174',
  'http://127.0.0.1:4174',
  'https://herdflow-h619.onrender.com'
].map((value) => trimTrailingSlashes(normalizeHostTypos(value)))));
const registrationTypes: MarketplaceRegistration['certificationType'][] = ['Logistics Certified Client', 'Certified Livestock Seller'];
const genders: Gender[] = ['Female', 'Male', 'Other'];
const statuses: Status[] = ['Active', 'Sold', 'Quarantined', 'Dead'];
const cattleBreeds = [
  'Angus',
  'Hereford',
  'Brahman',
  'Simmental',
  'Limousin',
  'Charolais',
  'Holstein Friesian',
  'Jersey',
  'Guernsey',
  'Brown Swiss',
  'Ayrshire',
  'Shorthorn',
  'Red Poll',
  'Nguni',
  'Boran',
  'Bonsmara',
  'Santa Gertrudis',
  'Beefmaster',
  'Brangus',
  'Braford',
  'Tuli',
  'Senepol',
  'Dexter',
  'Highland',
  'Texas Longhorn',
  'Ankole-Watusi',
  'Mixed Breed'
];
const colors = [
  { label: 'Blue', value: '#2563eb' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Red', value: '#c2410c' },
  { label: 'Pink', value: '#db2777' },
  { label: 'Purple', value: '#7c3aed' },
  { label: 'Yellow', value: '#f59e0b' },
  { label: 'White', value: '#ffffff' }
];
const reminderChannelId = 'herdflow-reminders';
const reminderLeadTimeMs = 24 * 60 * 60 * 1000;
const offlineQueueStorageKey = 'herdflow.offlineMutationQueue.v1';
const maxOfflineQueueSize = 200;

const M3 = {
  color: {
    primary: '#00639B',
    onPrimary: '#FFFFFF',
    primaryContainer: '#CDE5FF',
    onPrimaryContainer: '#001D33',
    secondaryContainer: '#DCE3F2',
    onSecondaryContainer: '#1A1C20',
    tertiaryContainer: '#CDEDE5',
    error: '#B3261E',
    onError: '#FFFFFF',
    errorContainer: '#F9DEDC',
    onErrorContainer: '#410E0B',
    surface: '#FFFBFE',
    surfaceContainer: '#F3EDF7',
    surfaceVariant: '#E7E0EC',
    outline: '#79747E',
    outlineVariant: '#CAC4D0',
    onSurface: '#1C1B1F',
    onSurfaceVariant: '#49454F',
    successContainer: '#D7F7D9',
    onSuccessContainer: '#0D3A16'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24
  },
  radius: {
    sm: 12,
    md: 16,
    lg: 24,
    pill: 999
  },
  motion: {
    short: 200,
    standard: 260,
    emphasized: 320
  },
  type: {
    titleLarge: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const },
    titleMedium: { fontSize: 16, lineHeight: 24, fontWeight: '700' as const },
    headlineSmall: { fontSize: 24, lineHeight: 32, fontWeight: '800' as const },
    bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '500' as const },
    bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
    bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
    labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '700' as const },
    labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: '700' as const },
    labelSmall: { fontSize: 11, lineHeight: 16, fontWeight: '700' as const }
  }
};

type VaccineFormState = {
  campId: number | null;
  cattleId: number | null;
  vaccineName: string;
  medicineName: string;
  treatmentType: 'Vaccine' | 'Medicine' | 'Sick Treatment';
  applicationMethod: string;
  nextDueDate: string;
  nextDueTime: string;
  givenDate: string | null;
  note: string;
};

type RegistrationFormState = {
  certificationType: MarketplaceRegistration['certificationType'];
  status: MarketplaceRegistration['status'];
  name: string;
  companyName: string;
  phone: string;
  email: string;
  region: string;
  note: string;
};

export default function App() {
  const { width } = useWindowDimensions();
  const isCompactLayout = width < 420;
  const [appBooting, setAppBooting] = useState(true);
  const [bootStatus, setBootStatus] = useState('Initializing secure session...');
  const [bootOverlayVisible, setBootOverlayVisible] = useState(true);
  const [dashboardView, setDashboardView] = useState<'overview' | 'campTotals' | 'campDetails' | 'deadDetails'>('overview');
  const [selectedDashboardCampId, setSelectedDashboardCampId] = useState<number | null>(null);
  const [section, setSection] = useState<Section>('Dashboard');
  const [cattle, setCattle] = useState<CattleRecord[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [vaccines, setVaccines] = useState<VaccineRecord[]>([]);
  const [counts, setCounts] = useState<CountLog[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [marketplaceRegistrations, setMarketplaceRegistrations] = useState<MarketplaceRegistration[]>([]);
  const [marketplaceQuery, setMarketplaceQuery] = useState('');
  const [cattleSearchQuery, setCattleSearchQuery] = useState('');
  const [sectionLoading, setSectionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeApiBase, setActiveApiBase] = useState(API_BASE);
  const [failedMarketplaceImages, setFailedMarketplaceImages] = useState<Set<number>>(new Set());
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const isMountedRef = useRef(true);
  const sectionTransition = useRef(new Animated.Value(1)).current;
  const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const bootOpacity = useRef(new Animated.Value(1)).current;
  const bootLogoScale = useRef(new Animated.Value(0.9)).current;
  const bootProgress = useRef(new Animated.Value(0.08)).current;
  const bootProgressWidth = bootProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  const [cattleForm, setCattleForm] = useState<Omit<CattleRecord, 'id' | 'createdAt'>>({
    tag: '',
    breed: '',
    colorId: colors[0].value,
    gender: 'Female',
    birthDate: '',
    status: 'Active',
    weight: 0,
    campId: null,
    soldPrice: null,
    soldDate: null,
    soldBuyerAuction: '',
    deadReason: '',
    note: ''
  });
  const [editingCattleId, setEditingCattleId] = useState<number | null>(null);

  const [campForm, setCampForm] = useState<Omit<Camp, 'id' | 'createdAt'>>({
    name: '',
    colorId: colors[0].value,
    description: ''
  });
  const [editingCampId, setEditingCampId] = useState<number | null>(null);

  const [vaccineForm, setVaccineForm] = useState<VaccineFormState>({
    campId: null,
    cattleId: null,
    vaccineName: '',
    medicineName: '',
    treatmentType: 'Vaccine',
    applicationMethod: 'Injection',
    nextDueDate: '',
    nextDueTime: '09:00',
    givenDate: null,
    note: ''
  });
  const resetVaccineForm = () => setVaccineForm({
    campId: null,
    cattleId: null,
    vaccineName: '',
    medicineName: '',
    treatmentType: 'Vaccine',
    applicationMethod: 'Injection',
    nextDueDate: '',
    nextDueTime: '09:00',
    givenDate: null,
    note: ''
  });
  const [editingVaccineId, setEditingVaccineId] = useState<number | null>(null);
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const [showSoldDatePicker, setShowSoldDatePicker] = useState(false);
  const [showCountDatePicker, setShowCountDatePicker] = useState(false);
  const [showVaccineDatePicker, setShowVaccineDatePicker] = useState(false);
  const [showVaccineTimePicker, setShowVaccineTimePicker] = useState(false);
  const [showGivenDatePicker, setShowGivenDatePicker] = useState(false);
  const [registrationForm, setRegistrationForm] = useState<RegistrationFormState>({
    certificationType: 'Logistics Certified Client',
    status: 'Pending',
    name: '',
    companyName: '',
    phone: '',
    email: '',
    region: '',
    note: ''
  });
  const [countForm, setCountForm] = useState<Omit<CountLog, 'id' | 'createdAt'>>({
    campId: 0,
    countDate: '',
    bulls: 0,
    cows: 0,
    calves: 0,
    personCounted: '',
    note: ''
  });

  function setErrorSafe(value: string | null) {
    if (isMountedRef.current) {
      setError(value);
    }
  }

  function setSectionLoadingSafe(value: boolean) {
    if (isMountedRef.current) {
      setSectionLoading(value);
    }
  }

  function setOfflineQueueCountSafe(value: number) {
    if (isMountedRef.current) {
      setOfflineQueueCount(value);
    }
  }

  function setNotificationPermissionSafe(value: 'granted' | 'denied' | 'undetermined') {
    if (isMountedRef.current) {
      setNotificationPermission(value);
    }
  }

  function setActiveApiBaseSafe(value: string) {
    if (isMountedRef.current) {
      setActiveApiBase(value);
    }
  }

  const breedChoices = useMemo(() => {
    const currentBreed = cattleForm.breed.trim();
    if (!currentBreed) {
      return cattleBreeds;
    }
    return cattleBreeds.includes(currentBreed) ? cattleBreeds : [currentBreed, ...cattleBreeds];
  }, [cattleForm.breed]);

  const summary = useMemo(() => {
    const total = cattle.length;
    const active = cattle.filter((item) => item.status === 'Active').length;
    const sold = cattle.filter((item) => item.status === 'Sold').length;
    const quarantined = cattle.filter((item) => item.status === 'Quarantined').length;
    const dead = cattle.filter((item) => item.status === 'Dead').length;
    return { total, active, sold, quarantined, dead };
  }, [cattle]);

  const soldCattle = useMemo(() => {
    return cattle.filter((item) => item.status === 'Sold');
  }, [cattle]);

  const quarantinedCattle = useMemo(() => {
    return cattle.filter((item) => item.status === 'Quarantined');
  }, [cattle]);

  const deadCattle = useMemo(() => {
    return cattle.filter((item) => item.status === 'Dead');
  }, [cattle]);

  const treatmentUpdatesByCattleId = useMemo(() => {
    const byCattleId = new Map<number, VaccineRecord[]>();

    for (const animal of quarantinedCattle) {
      const updates = vaccines
        .filter((record) =>
          record.treatmentType === 'Sick Treatment' &&
          (record.cattleId === animal.id || (record.cattleId === null && record.campId === animal.campId))
        )
        .sort((a, b) => {
          const aTime = new Date(a.givenDate || a.nextDueAt || a.scheduledDate || a.createdAt).getTime();
          const bTime = new Date(b.givenDate || b.nextDueAt || b.scheduledDate || b.createdAt).getTime();
          return bTime - aTime;
        })
        .slice(0, 3);

      byCattleId.set(animal.id, updates);
    }

    return byCattleId;
  }, [quarantinedCattle, vaccines]);

  const campTotals = useMemo(() => {
    const totals: Array<{ campId: number | null; campName: string; total: number }> = camps.map((camp) => ({
      campId: camp.id,
      campName: camp.name,
      total: cattle.filter((item) => item.campId === camp.id).length
    }));

    const unassignedTotal = cattle.filter((item) => item.campId === null).length;
    if (unassignedTotal > 0) {
      totals.push({
        campId: null,
        campName: 'Unassigned',
        total: unassignedTotal
      });
    }

    return totals;
  }, [camps, cattle]);

  const filteredMarketplaceItems = useMemo(() => {
    const query = marketplaceQuery.trim().toLowerCase();
    const publishedItems = marketplaceItems.filter((item) => item.isPublished !== false);
    if (!query) return publishedItems;
    return publishedItems.filter((item) =>
      [item.name, item.description, item.unit]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [marketplaceItems, marketplaceQuery]);

  const filteredCattleRecords = useMemo(() => {
    const query = cattleSearchQuery.trim().toLowerCase();
    if (!query) return cattle;
    return cattle.filter((item) => item.tag.toLowerCase().includes(query));
  }, [cattle, cattleSearchQuery]);

  const herdRecordsByCamp = useMemo(() => {
    const grouped = new Map<string, { campId: number | null; campName: string; records: CattleRecord[] }>();

    for (const record of filteredCattleRecords) {
      const key = record.campId === null ? 'unassigned' : String(record.campId);
      if (!grouped.has(key)) {
        grouped.set(key, {
          campId: record.campId,
          campName: getCampName(record.campId),
          records: []
        });
      }
      grouped.get(key)!.records.push(record);
    }

    const orderedGroups: Array<{ campId: number | null; campName: string; records: CattleRecord[] }> = [];

    for (const camp of camps) {
      const key = String(camp.id);
      const group = grouped.get(key);
      if (group) {
        orderedGroups.push(group);
        grouped.delete(key);
      }
    }

    const unassignedGroup = grouped.get('unassigned');
    if (unassignedGroup) {
      orderedGroups.push(unassignedGroup);
      grouped.delete('unassigned');
    }

    for (const group of grouped.values()) {
      orderedGroups.push(group);
    }

    return orderedGroups;
  }, [filteredCattleRecords, camps]);

  const marketplaceSnapshot = useMemo(() => {
    const publishedItems = marketplaceItems.filter((item) => item.isPublished !== false);
    const inStock = publishedItems.filter((item) => (item.stock || 0) > 0).length;
    const lowStock = publishedItems.filter((item) => (item.stock || 0) > 0 && (item.stock || 0) <= 5).length;
    return {
      totalItems: publishedItems.length,
      inStock,
      lowStock,
      registrations: marketplaceRegistrations.length
    };
  }, [marketplaceItems, marketplaceRegistrations]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    Animated.spring(bootLogoScale, {
      toValue: 1,
      friction: 6,
      tension: 70,
      useNativeDriver: true
    }).start();

    const advanceBootProgress = (value: number) => {
      Animated.timing(bootProgress, {
        toValue: value,
        duration: M3.motion.standard,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false
      }).start();
    };

    void (async () => {
      try {
        if (isActive) {
          advanceBootProgress(0.3);
          setBootStatus('Checking reminders and notifications...');
        }
        await configureNotifications();

        if (isActive) {
          advanceBootProgress(0.68);
          setBootStatus('Syncing livestock and marketplace data...');
        }
        await refreshData();

        if (isActive) {
          advanceBootProgress(0.92);
          setBootStatus('Finalizing your dashboard...');
        }
        await new Promise((resolve) => setTimeout(resolve, 900));
      } finally {
        if (isActive) {
          advanceBootProgress(1);
          setAppBooting(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [bootLogoScale, bootProgress]);

  useEffect(() => {
    if (!appBooting && bootOverlayVisible) {
      Animated.timing(bootOpacity, {
        toValue: 0,
        duration: M3.motion.emphasized,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true
      }).start(({ finished }) => {
        if (finished) {
          setBootOverlayVisible(false);
        }
      });
    }
  }, [appBooting, bootOverlayVisible, bootOpacity]);

  useEffect(() => {
    if (section !== 'Dashboard') {
      setDashboardView('overview');
      setSelectedDashboardCampId(null);
    }
  }, [section]);

  useEffect(() => {
    sectionTransition.setValue(0);
    Animated.timing(sectionTransition, {
      toValue: 1,
      duration: M3.motion.standard,
      easing: Easing.bezier(0.2, 0, 0, 1),
      useNativeDriver: true
    }).start();
  }, [section, sectionTransition]);

  useEffect(() => {
    void (async () => {
      const queue = await readOfflineQueue();
      setOfflineQueueCountSafe(queue.length);
    })();
  }, []);

  async function readOfflineQueue() {
    try {
      const raw = await AsyncStorage.getItem(offlineQueueStorageKey);
      if (!raw) {
        return [] as PendingMutation[];
      }
      const parsed = JSON.parse(raw) as unknown;
      return normalizePendingMutations(parsed, maxOfflineQueueSize);
    } catch {
      return [] as PendingMutation[];
    }
  }

  async function writeOfflineQueue(queue: PendingMutation[]) {
    const boundedQueue = normalizePendingMutations(queue, maxOfflineQueueSize);
    const serialized = JSON.stringify(boundedQueue);

    await AsyncStorage.setItem(offlineQueueStorageKey, serialized);

    setOfflineQueueCountSafe(boundedQueue.length);
  }

  async function enqueueMutation(path: string, method: string, body?: string) {
    const queue = await readOfflineQueue();
    queue.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      path,
      method,
      body,
      createdAt: new Date().toISOString()
    });

    if (queue.length > maxOfflineQueueSize) {
      queue.splice(0, queue.length - maxOfflineQueueSize);
    }

    await writeOfflineQueue(queue);
  }

  async function flushOfflineQueue() {
    const queue = await readOfflineQueue();
    if (!queue.length) {
      setOfflineQueueCountSafe(0);
      return;
    }

    const pending: PendingMutation[] = [];
    for (const mutation of queue) {
      try {
        const response = await fetchWithTimeout(apiUrl(mutation.path), {
          method: mutation.method,
          headers: mutation.body ? { 'Content-Type': 'application/json' } : undefined,
          body: mutation.body
        });

        if (!response.ok) {
          pending.push(mutation);
        }
      } catch {
        pending.push(mutation);
      }
    }

    await writeOfflineQueue(pending);
  }

  async function performMutation(path: string, method: string, body?: unknown): Promise<MutationResult> {
    const serializedBody = body === undefined ? undefined : JSON.stringify(body);
    try {
      const response = await fetchWithTimeout(apiUrl(path), {
        method,
        headers: serializedBody ? { 'Content-Type': 'application/json' } : undefined,
        body: serializedBody
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = isRecord(payload) && typeof payload.error === 'string'
          ? payload.error
          : response.statusText || 'Request failed';
        return { ok: false, queued: false, errorMessage: message };
      }

      return { ok: true, queued: false, response };
    } catch {
      await enqueueMutation(path, method, serializedBody);
      return { ok: false, queued: true, errorMessage: 'Saved offline. Sync will retry when connection is available.' };
    }
  }

  function apiUrl(path: string) {
    return `${activeApiBase}${path}`;
  }

  function prioritizedApiBases() {
    return [activeApiBase, ...API_BASE_CANDIDATES.filter((base) => base !== activeApiBase)];
  }

  async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = 12000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...(init || {}), signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function isValidPhone(value: string) {
    const digits = value.replace(/\D/g, '');
    return digits.length >= 7;
  }

  function parseNonNegativeNumber(value: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return 0;
    }
    return parsed;
  }

  function isValidIsoDate(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }
    const date = new Date(`${value}T00:00:00`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  async function configureNotifications() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(reminderChannelId, {
        name: 'HerdFlow Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: M3.color.primary
      });
    }

    const permissions = await Notifications.getPermissionsAsync();
    setNotificationPermissionSafe(permissions.status);
    if (permissions.status !== 'granted') {
      const updated = await Notifications.requestPermissionsAsync();
      setNotificationPermissionSafe(updated.status);
    }
  }

  async function refreshData() {
    setSectionLoadingSafe(true);
    setErrorSafe(null);
    try {
      let loaded = false;
      for (const base of prioritizedApiBases()) {
        try {
          const [cattleRes, campsRes, vaccineRes, countRes] = await Promise.all([
            fetchWithTimeout(`${base}/api/cattle`),
            fetchWithTimeout(`${base}/api/camps`),
            fetchWithTimeout(`${base}/api/vaccines`),
            fetchWithTimeout(`${base}/api/counts`)
          ]);

          if (!cattleRes.ok || !campsRes.ok || !vaccineRes.ok || !countRes.ok) {
            continue;
          }

          const [marketplaceRes, registrationsRes] = await Promise.all([
            fetchWithTimeout(`${base}/api/marketplace/items`),
            fetchWithTimeout(`${base}/api/marketplace/registrations`)
          ]);

          const cattleData = await cattleRes.json().catch(() => []);
          const campsData = await campsRes.json().catch(() => []);
          const vaccineData = await vaccineRes.json().catch(() => []);
          const countData = await countRes.json().catch(() => []);
          const marketplaceData = marketplaceRes.ok ? await marketplaceRes.json().catch(() => []) : [];
          const registrationData = registrationsRes.ok ? await registrationsRes.json().catch(() => []) : [];

          const normalizedCattleData = normalizeCattleRecords(cattleData);
          const normalizedMarketplaceData = toArray<MarketplaceItem>(marketplaceData).map((item) => ({
            ...item,
            isPublished: item.isPublished !== false
          }));

          if (!isMountedRef.current) {
            return;
          }

          setCattle(normalizedCattleData);
          setCamps(toArray<Camp>(campsData));
          setVaccines(toArray<VaccineRecord>(vaccineData));
          setCounts(toArray<CountLog>(countData));
          setMarketplaceItems(normalizedMarketplaceData);
          setMarketplaceRegistrations(toArray<MarketplaceRegistration>(registrationData));
          setActiveApiBaseSafe(base);
          await flushOfflineQueue();
          void rescheduleVaccineReminders(toArray<VaccineRecord>(vaccineData));
          loaded = true;
          break;
        } catch {
          // Try next API base candidate.
        }
      }

      if (!loaded) {
        const queue = await readOfflineQueue();
        setOfflineQueueCountSafe(queue.length);
        throw new Error('Unable to connect to HerdFlow API. Check APP API/website API ports and network access.');
      }
    } catch (err: unknown) {
      setErrorSafe(getErrorMessage(err, 'Unable to load data.'));
    } finally {
      setSectionLoadingSafe(false);
    }
  }

  async function syncPendingOperations() {
    setError(null);
    await flushOfflineQueue();
    await refreshData();
  }

  async function openMarketplace() {
    try {
      await Linking.openURL(MARKETPLACE_URL);
    } catch {
      Alert.alert('Marketplace unavailable', `Unable to open the marketplace link right now: ${MARKETPLACE_URL}`);
    }
  }

  async function openRegistrationOptions() {
    Alert.alert(
      'HerdFlow Certification Registration',
      'Choose the registration template you want to send to HerdFlow.',
      [
        {
          text: 'Certified Logistic Company',
          onPress: () => {
            void openRegistrationTemplate('logistics');
          }
        },
        {
          text: 'Certified Supplier / Sell Livestock',
          onPress: () => {
            void openRegistrationTemplate('supplier');
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  }

  async function openRegistrationTemplate(type: 'logistics' | 'supplier') {
    const subject = type === 'logistics'
      ? 'Registration - Certified Logistic Company'
      : 'Registration - Certified Supplier / Sell Livestock';

    const body = type === 'logistics'
      ? [
          'Hello HerdFlow Team,',
          '',
          'I want to register to become a Certified Logistic Company on HerdFlow.',
          '',
          'Company Name:',
          'Contact Person:',
          'Phone Number:',
          'Email Address:',
          'Region / Operating Areas:',
          'Logistics Services Offered:',
          'Fleet / Capacity Details:',
          'Additional Notes:',
          '',
          'Regards,'
        ].join('\n')
      : [
          'Hello HerdFlow Team,',
          '',
          'I want to register to become a Certified Supplier and Sell Livestock on HerdFlow.',
          '',
          'Business / Farm Name:',
          'Contact Person:',
          'Phone Number:',
          'Email Address:',
          'Region:',
          'Livestock Types / Breeds:',
          'Estimated Supply Capacity:',
          'Additional Notes:',
          '',
          'Regards,'
        ].join('\n');

    const mailtoUrl = `mailto:${HERDFLOW_REGISTRATION_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      await Linking.openURL(mailtoUrl);
    } catch {
      Alert.alert(
        'Email unavailable',
        `Unable to open your email app. Please send your registration details to ${HERDFLOW_REGISTRATION_EMAIL}.`
      );
    }
  }

  async function saveMarketplaceRegistration() {
    const trimmedName = registrationForm.name.trim();
    const trimmedCompanyName = registrationForm.companyName.trim();
    const trimmedPhone = registrationForm.phone.trim();
    const trimmedEmail = registrationForm.email.trim();
    const trimmedRegion = registrationForm.region.trim();

    if (!trimmedName || !trimmedCompanyName || !trimmedPhone || !trimmedEmail || !trimmedRegion) {
      setError('Name, company name, phone, email, and region are required.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!isValidPhone(trimmedPhone)) {
      setError('Please enter a valid phone number.');
      return;
    }

    const payload: RegistrationFormState = {
      ...registrationForm,
      name: trimmedName,
      companyName: trimmedCompanyName,
      phone: trimmedPhone,
      email: trimmedEmail,
      region: trimmedRegion,
      note: registrationForm.note.trim()
    };

    const localRegistration: MarketplaceRegistration = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      ...payload
    };

    setMarketplaceRegistrations((current) => [localRegistration, ...current]);
    setRegistrationForm({
      certificationType: 'Logistics Certified Client',
      status: 'Pending',
      name: '',
      companyName: '',
      phone: '',
      email: '',
      region: '',
      note: ''
    });

    try {
      const result = await performMutation('/api/marketplace/registrations', 'POST', payload);
      if (!result.ok && !result.queued) {
        throw new Error(result.errorMessage || 'Unable to save registration.');
      }
      await refreshData();
    } catch {
      Alert.alert('Saved locally', 'Registration was added on the device. Background sync will retry if remote save failed.');
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString();
  }

  function formatDateTime(dateTime: string) {
    const value = new Date(dateTime);
    return `${value.toLocaleDateString()} · ${value.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }

  function toDateInputValue(value: string) {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function toTimeInputValue(value: string) {
    const date = new Date(value);
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  function combineDateTime(dateValue: string, timeValue: string) {
    return new Date(`${dateValue}T${timeValue}:00`).toISOString();
  }

  function getCampCattle(campId: number | null) {
    return cattle.filter((item) => item.campId === campId);
  }

  function getCampCattleSummary(campId: number | null) {
    const campAnimals = getCampCattle(campId);
    if (!campAnimals.length) {
      return 'No cattle in this camp yet.';
    }
    return campAnimals.map((animal) => animal.tag).join(', ');
  }

  function setBirthDate(date: Date) {
    setCattleForm((prev) => ({ ...prev, birthDate: date.toISOString().split('T')[0] }));
  }

  function setSoldDate(date: Date) {
    setCattleForm((prev) => ({ ...prev, soldDate: date.toISOString().split('T')[0] }));
  }

  function setScheduledDate(date: Date) {
    setVaccineForm((prev) => ({ ...prev, nextDueDate: toDateInputValue(date.toISOString()) }));
  }

  function setScheduledTime(date: Date) {
    setVaccineForm((prev) => ({ ...prev, nextDueTime: toTimeInputValue(date.toISOString()) }));
  }

  function setGivenDate(date: Date) {
    setVaccineForm((prev) => ({ ...prev, givenDate: date.toISOString().split('T')[0] }));
  }

  function handleBirthDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    setShowBirthDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  }

  function handleSoldDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    setShowSoldDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSoldDate(selectedDate);
    }
  }

  function handleCountDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    setShowCountDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setCountForm((prev) => ({ ...prev, countDate: selectedDate.toISOString().split('T')[0] }));
    }
  }

  function handleScheduledDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    setShowVaccineDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setScheduledDate(selectedDate);
    }
  }

  function handleScheduledTimeChange(event: DateTimePickerEvent, selectedDate?: Date) {
    setShowVaccineTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setScheduledTime(selectedDate);
    }
  }

  function handleGivenDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    setShowGivenDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setGivenDate(selectedDate);
    }
  }

  function getCampName(campId: number | null) {
    return campId ? camps.find((camp) => camp.id === campId)?.name || 'Unassigned' : 'Unassigned';
  }

  function getCattleName(cattleId: number | null) {
    if (cattleId === null) {
      return 'Unknown';
    }
    const animal = cattle.find((item) => item.id === cattleId);
    return animal ? `${animal.tag} (${animal.breed})` : 'Unknown';
  }

  function getCampAnimals(campId: number | null) {
    return getCampCattle(campId);
  }

  async function rescheduleVaccineReminders(records: VaccineRecord[]) {
    try {
      const permissions = await Notifications.getPermissionsAsync();
      if (permissions.status !== 'granted') {
        return;
      }

      await Notifications.cancelAllScheduledNotificationsAsync();

      const now = Date.now();
      for (const record of records) {
        if (!record.nextDueAt) {
          continue;
        }

        const dueAt = new Date(record.nextDueAt).getTime();
        const reminderAt = dueAt - reminderLeadTimeMs;
        if (!Number.isFinite(reminderAt) || reminderAt <= now) {
          continue;
        }

        const campName = getCampName(record.campId ?? null);
        const cattleSummary = getCampCattleSummary(record.campId ?? null);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'HerdFlow reminder',
            body: `${record.medicineName || record.vaccineName} for ${campName} is due in 24 hours. Method: ${record.applicationMethod}. Animals: ${cattleSummary}`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            data: { recordId: record.id, campId: record.campId }
          },
          trigger: {
            date: new Date(reminderAt),
            channelId: reminderChannelId
          }
        });
      }
    } catch (notificationError) {
      console.warn('Reminder sync failed', notificationError);
    }
  }

  async function saveCattle() {
    setError(null);
    if (!cattleForm.tag || !cattleForm.breed) {
      setError('Tag and breed are required.');
      return;
    }
    if (cattleForm.status === 'Sold') {
      if (!cattleForm.soldDate || !cattleForm.soldBuyerAuction?.trim() || !cattleForm.soldPrice || cattleForm.soldPrice <= 0) {
        setError('For sold cattle, sold date, sold price, and buyer/auction are required.');
        return;
      }
    }
    if (cattleForm.status === 'Dead' && !cattleForm.deadReason?.trim()) {
      setError('For dead cattle, reason is required.');
      return;
    }
    try {
      const path = editingCattleId ? `/api/cattle/${editingCattleId}` : '/api/cattle';
      const method = editingCattleId ? 'PUT' : 'POST';
      const result = await performMutation(path, method, cattleForm);
      if (!result.ok && !result.queued) {
        throw new Error(result.errorMessage || 'Unable to save cattle.');
      }
      resetCattleForm();
      void refreshData();
      if (result.queued) {
        Alert.alert('Saved offline', 'Cattle update was queued and will sync automatically.');
      }
    } catch (err: unknown) {
      setErrorSafe(getErrorMessage(err, 'Failed to save cattle.'));
    }
  }

  async function deleteCattle(record: CattleRecord) {
    Alert.alert('Delete Animal', `Delete ${record.tag}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await performMutation(`/api/cattle/${record.id}`, 'DELETE');
            if (!result.ok && !result.queued) {
              throw new Error(result.errorMessage || 'Failed to delete animal.');
            }
            void refreshData();
          } catch {
            setError('Failed to delete animal.');
          }
        }
      }
    ]);
  }

  function editCattle(record: CattleRecord) {
    setEditingCattleId(record.id);
    setCattleForm({
      tag: record.tag,
      breed: record.breed,
      colorId: record.colorId,
      gender: record.gender,
      birthDate: record.birthDate,
      status: record.status,
      weight: record.weight,
      campId: record.campId,
      soldPrice: record.soldPrice ?? null,
      soldDate: record.soldDate ?? null,
      soldBuyerAuction: record.soldBuyerAuction ?? '',
      deadReason: record.deadReason ?? '',
      note: record.note
    });
    setSection('Cattle');
  }

  function resetCattleForm() {
    setEditingCattleId(null);
    setCattleForm({
      tag: '',
      breed: '',
      colorId: colors[0].value,
      gender: 'Female',
      birthDate: '',
      status: 'Active',
      weight: 0,
      campId: null,
      soldPrice: null,
      soldDate: null,
      soldBuyerAuction: '',
      deadReason: '',
      note: ''
    });
  }

  async function saveCamp() {
    if (!campForm.name) {
      setError('Camp name is required.');
      return;
    }
    try {
      const path = editingCampId ? `/api/camps/${editingCampId}` : '/api/camps';
      const method = editingCampId ? 'PUT' : 'POST';
      const result = await performMutation(path, method, campForm);
      if (!result.ok && !result.queued) {
        throw new Error(result.errorMessage || 'Unable to save camp.');
      }
      resetCampForm();
      void refreshData();
      if (result.queued) {
        Alert.alert('Saved offline', 'Camp update was queued and will sync automatically.');
      }
    } catch (err: unknown) {
      setErrorSafe(getErrorMessage(err, 'Failed to save camp.'));
    }
  }

  async function deleteCamp(camp: Camp) {
    Alert.alert('Delete Camp', `Delete ${camp.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await performMutation(`/api/camps/${camp.id}`, 'DELETE');
            if (!result.ok && !result.queued) {
              throw new Error(result.errorMessage || 'Failed to delete camp.');
            }
            void refreshData();
          } catch {
            setError('Failed to delete camp.');
          }
        }
      }
    ]);
  }

  function editCamp(camp: Camp) {
    setEditingCampId(camp.id);
    setCampForm({
      name: camp.name,
      colorId: camp.colorId,
      description: camp.description
    });
    setSection('Camps');
  }

  function resetCampForm() {
    setEditingCampId(null);
    setCampForm({ name: '', colorId: colors[0].value, description: '' });
  }

  async function saveVaccine() {
    const treatmentName = vaccineForm.medicineName.trim() || vaccineForm.vaccineName.trim();
    if (!vaccineForm.campId || !treatmentName || !vaccineForm.nextDueDate || !vaccineForm.nextDueTime) {
      setError('Camp, medicine name, due date, and due time are required.');
      return;
    }

    const nextDueAt = combineDateTime(vaccineForm.nextDueDate, vaccineForm.nextDueTime);
    const reminderAt = new Date(nextDueAt).getTime() - reminderLeadTimeMs;
    if (reminderAt <= Date.now()) {
      setError('Choose a due time at least 24 hours in the future so the reminder can fire 24 hours prior.');
      return;
    }
    try {
      const path = editingVaccineId ? `/api/vaccines/${editingVaccineId}` : '/api/vaccines';
      const method = editingVaccineId ? 'PUT' : 'POST';
      const payload = {
          campId: vaccineForm.campId,
          cattleId: getCampAnimals(vaccineForm.campId)[0]?.id ?? null,
          treatmentType: vaccineForm.treatmentType,
          medicineName: treatmentName,
          vaccineName: treatmentName,
          applicationMethod: vaccineForm.applicationMethod,
          nextDueAt,
          scheduledDate: vaccineForm.nextDueDate,
          givenDate: vaccineForm.givenDate,
          note: vaccineForm.note
      };
      const result = await performMutation(path, method, payload);
      if (!result.ok && !result.queued) {
        throw new Error(result.errorMessage || 'Unable to save vaccine.');
      }
      resetVaccineForm();
      void refreshData();
      if (result.queued) {
        Alert.alert('Saved offline', 'Treatment update was queued and will sync automatically.');
      }
    } catch (err: unknown) {
      setErrorSafe(getErrorMessage(err, 'Failed to save vaccine.'));
    }
  }

  async function deleteVaccine(vaccine: VaccineRecord) {
    Alert.alert('Delete Treatment', `Delete ${vaccine.medicineName || vaccine.vaccineName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await performMutation(`/api/vaccines/${vaccine.id}`, 'DELETE');
            if (!result.ok && !result.queued) {
              throw new Error(result.errorMessage || 'Failed to delete treatment.');
            }
            void refreshData();
          } catch {
            setError('Failed to delete vaccine.');
          }
        }
      }
    ]);
  }

  function editVaccine(entry: VaccineRecord) {
    setEditingVaccineId(entry.id);
    setVaccineForm({
      campId: entry.campId ?? null,
      cattleId: entry.cattleId,
      vaccineName: entry.vaccineName,
      medicineName: entry.medicineName || entry.vaccineName,
      treatmentType: entry.treatmentType || 'Vaccine',
      applicationMethod: entry.applicationMethod || 'Injection',
      nextDueDate: toDateInputValue(entry.nextDueAt || entry.scheduledDate || new Date().toISOString()),
      nextDueTime: toTimeInputValue(entry.nextDueAt || entry.scheduledDate || new Date().toISOString()),
      givenDate: entry.givenDate,
      note: entry.note
    });
    setSection('Vaccines');
  }

  async function saveCount() {
    if (!countForm.campId || !countForm.countDate) {
      setError('Camp and count date are required.');
      return;
    }
    if (!isValidIsoDate(countForm.countDate)) {
      setError('Count date must be a valid date in YYYY-MM-DD format.');
      return;
    }
    if (countForm.bulls < 0 || countForm.cows < 0 || countForm.calves < 0) {
      setError('Count values cannot be negative.');
      return;
    }
    try {
      const result = await performMutation('/api/counts', 'POST', countForm);
      if (!result.ok && !result.queued) {
        throw new Error(result.errorMessage || 'Unable to save count.');
      }
      setCountForm({ campId: 0, countDate: '', bulls: 0, cows: 0, calves: 0, personCounted: '', note: '' });
      void refreshData();
      if (result.queued) {
        Alert.alert('Saved offline', 'Count entry was queued and will sync automatically.');
      }
    } catch (err: unknown) {
      setErrorSafe(getErrorMessage(err, 'Failed to save count.'));
    }
  }

  async function deleteCount(count: CountLog) {
    Alert.alert('Delete Count', `Delete count from ${formatDate(count.countDate)}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await performMutation(`/api/counts/${count.id}`, 'DELETE');
            if (!result.ok && !result.queued) {
              throw new Error(result.errorMessage || 'Failed to delete count.');
            }
            void refreshData();
          } catch {
            setError('Failed to delete count.');
          }
        }
      }
    ]);
  }

  function renderLoadingState(message = 'Loading records...') {
    return (
      <View style={styles.stateCard}>
        <ActivityIndicator size="small" color={M3.color.primary} />
        <Text style={styles.stateTitle}>Syncing Data</Text>
        <Text style={styles.stateMessage}>{message}</Text>
      </View>
    );
  }

  function renderEmptyState(title: string, message: string) {
    return (
      <View style={styles.stateCard}>
        <Text style={styles.stateTitle}>{title}</Text>
        <Text style={styles.stateMessage}>{message}</Text>
      </View>
    );
  }

  function renderErrorState() {
    if (!error) return null;
    const shouldShowRetry = /unable|failed|connect|load|sync/i.test(error);

    return (
      <View style={styles.stateCardError}>
        <Text style={styles.stateTitle}>Something Went Wrong</Text>
        <Text style={[styles.stateMessage, styles.stateMessageError]}>{error}</Text>
        <View style={styles.stateActionRow}>
          {shouldShowRetry ? (
            <TouchableOpacity style={styles.statePrimaryAction} onPress={refreshData}>
              <Text style={styles.statePrimaryActionText}>Try Again</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.stateTonalAction} onPress={() => setError(null)}>
            <Text style={styles.stateTonalActionText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={bootOverlayVisible ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <Image source={require('./assets/logo.png')} style={styles.logo} />
          <View style={styles.headerText}>
            <Text style={styles.brandSpacer}>{' '}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.marketplaceActionWrap}>
            <TouchableOpacity style={styles.marketplaceButton} onPress={openMarketplace}>
              <Text style={styles.marketplaceButtonText}>Marketplace</Text>
            </TouchableOpacity>
            <Text style={styles.marketplaceTagline}>Become part of HerdFlow .</Text>
          </View>
          <TouchableOpacity style={styles.registrationButton} onPress={openRegistrationOptions}>
            <Text style={styles.registrationButtonText}>Registration</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshButton} onPress={refreshData}>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.apiHint}>API: {activeApiBase}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        {(['Dashboard', 'Marketplace', 'Cattle', 'Camps', 'Vaccines', 'Counts'] as Section[]).map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.tabButton, section === item && styles.tabButtonActive]}
            onPress={() => setSection(item)}
          >
            <Text style={[styles.tabText, section === item && styles.tabTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {renderErrorState()}
        {sectionLoading ? renderLoadingState('Fetching the latest app data...') : null}

        <Animated.View
          style={[
            styles.contentAnimated,
            {
              opacity: sectionTransition,
              transform: [
                {
                  translateY: sectionTransition.interpolate({
                    inputRange: [0, 1],
                    outputRange: [12, 0]
                  })
                }
              ]
            }
          ]}
        >

        {section === 'Dashboard' && (
          <>
            <View style={styles.summaryGrid}>
              {[
                { label: 'Total', value: summary.total },
                { label: 'Active', value: summary.active },
                { label: 'Sold', value: summary.sold },
                { label: 'Quarantine', value: summary.quarantined },
                { label: 'Dead', value: summary.dead }
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.card, (item.label === 'Total' || item.label === 'Dead') && styles.cardInteractive]}
                  onPress={() => {
                    if (item.label === 'Total') {
                      setDashboardView('campTotals');
                      setSelectedDashboardCampId(null);
                    }
                    if (item.label === 'Dead') {
                      setDashboardView('deadDetails');
                      setSelectedDashboardCampId(null);
                    }
                  }}
                  activeOpacity={item.label === 'Total' || item.label === 'Dead' ? 0.82 : 1}
                >
                  <Text style={styles.cardLabel}>{item.label}</Text>
                  <Text style={styles.cardValue}>{item.value}</Text>
                  {item.label === 'Total' ? <Text style={styles.cardHint}>Tap to view camp totals</Text> : null}
                  {item.label === 'Dead' ? <Text style={styles.cardHint}>Tap to view dead records</Text> : null}
                </TouchableOpacity>
              ))}
            </View>

            {dashboardView === 'campTotals' && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>Totals By Camp</Text>
                {campTotals.map((camp) => (
                  <View key={camp.campName} style={styles.listItem}>
                    <View>
                      <Text style={styles.listTitle}>{camp.campName}</Text>
                      <Text style={styles.listSubtitle}>{camp.total} cattle</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        setSelectedDashboardCampId(camp.campId);
                        setDashboardView('campDetails');
                      }}
                    >
                      <Text style={styles.actionText}>View Cattle</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {campTotals.length === 0 && renderEmptyState('No Camps Yet', 'Create your first camp to organize herd records.')}
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    setDashboardView('overview');
                    setSelectedDashboardCampId(null);
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Back To Dashboard</Text>
                </TouchableOpacity>
              </View>
            )}

            {dashboardView === 'campDetails' && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>Camp Cattle</Text>
                <Text style={styles.listHint}>Camp: {selectedDashboardCampId === null ? 'Unassigned' : getCampName(selectedDashboardCampId)}</Text>
                {getCampAnimals(selectedDashboardCampId).map((animal) => (
                  <View key={animal.id} style={styles.listItem}>
                    <Text style={styles.listTitle}>{animal.tag} - {animal.breed}</Text>
                    <Text style={styles.listSubtitle}>{animal.status} · {animal.gender}</Text>
                    <Text style={styles.listHint}>Weight: {animal.weight} kg</Text>
                  </View>
                ))}
                {getCampAnimals(selectedDashboardCampId).length === 0 && renderEmptyState('No Cattle In This Camp', 'Assign cattle to this camp to view details here.')}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.secondaryButtonSmall}
                    onPress={() => setDashboardView('campTotals')}
                  >
                    <Text style={styles.secondaryButtonText}>Back To Camp Totals</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {dashboardView === 'deadDetails' && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>Dead Cattle Records</Text>
                {deadCattle.map((record) => (
                  <View key={record.id} style={styles.listItem}>
                    <Text style={styles.listTitle}>{record.tag} - {record.breed}</Text>
                    <Text style={styles.listSubtitle}>Where: {getCampName(record.campId)}</Text>
                    <Text style={styles.listHint}>Reason: {record.deadReason?.trim() ? record.deadReason : 'No reason recorded.'}</Text>
                  </View>
                ))}
                {deadCattle.length === 0 && renderEmptyState('No Dead Records', 'Dead cattle records will appear here when captured.')}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.secondaryButtonSmall}
                    onPress={() => setDashboardView('overview')}
                  >
                    <Text style={styles.secondaryButtonText}>Back To Dashboard</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Sold Cattle Details</Text>
              {soldCattle.map((record) => (
                <View key={record.id} style={styles.listItem}>
                  <Text style={styles.listTitle}>{record.tag} - {record.breed}</Text>
                  <Text style={styles.listSubtitle}>Camp: {getCampName(record.campId)}</Text>
                  <Text style={styles.listHint}>Price sold: {record.soldPrice ? `$${record.soldPrice.toFixed(2)}` : 'Not recorded'}</Text>
                  <Text style={styles.listHint}>Date sold: {record.soldDate ? formatDate(record.soldDate) : 'Not recorded'}</Text>
                  <Text style={styles.listHint}>Buyer / Auction: {record.soldBuyerAuction?.trim() ? record.soldBuyerAuction : 'Not recorded'}</Text>
                </View>
              ))}
              {soldCattle.length === 0 && renderEmptyState('No Sold Cattle', 'Sold livestock entries will appear here with pricing and buyer details.')}
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Quarantine Details</Text>
              {quarantinedCattle.map((record) => {
                const treatmentUpdates = treatmentUpdatesByCattleId.get(record.id) || [];
                return (
                  <View key={record.id} style={styles.listItem}>
                    <Text style={styles.listTitle}>{record.tag} - {record.breed}</Text>
                    <Text style={styles.listSubtitle}>Camp: {getCampName(record.campId)}</Text>
                    <Text style={styles.listHint}>Notes: {record.note?.trim() ? record.note : 'No quarantine notes provided.'}</Text>
                    <Text style={styles.listHint}>Treatment updates:</Text>
                    {treatmentUpdates.length > 0 ? (
                      treatmentUpdates.map((update) => (
                        <Text key={update.id} style={styles.listHint}>
                          - {(update.medicineName || update.vaccineName).trim() || 'Treatment'} via {update.applicationMethod}: {update.givenDate ? `Given ${formatDate(update.givenDate)}` : `Due ${formatDate(update.nextDueAt || update.scheduledDate || update.createdAt)}`}
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.listHint}>No treatment updates recorded yet.</Text>
                    )}
                  </View>
                );
              })}
              {quarantinedCattle.length === 0 && renderEmptyState('No Quarantine Cases', 'Current quarantine details and treatment updates will appear here.')}
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Upcoming Vaccines</Text>
              {(vaccines.filter((item) => !item.givenDate).slice(0, 4)).map((item) => (
                <View key={item.id} style={styles.listItem}>
                  <View>
                    <Text style={styles.listTitle}>{item.vaccineName}</Text>
                    <Text style={styles.listSubtitle}>{getCattleName(item.cattleId)}</Text>
                  </View>
                  <Text style={styles.listMeta}>{formatDate(item.nextDueAt || item.scheduledDate || new Date().toISOString())}</Text>
                </View>
              ))}
              {!vaccines.some((item) => !item.givenDate) && renderEmptyState('No Upcoming Treatments', 'Scheduled treatment reminders will show up when available.')}
            </View>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Latest Camp Counts</Text>
              {(counts.slice(0, 2)).map((item) => (
                <View key={item.id} style={styles.listItem}>
                  <View>
                    <Text style={styles.listTitle}>{getCampName(item.campId)}</Text>
                    <Text style={styles.listSubtitle}>{formatDate(item.countDate)}</Text>
                  </View>
                  <View style={styles.countsRow}>
                    <Text style={styles.countBadge}>B {item.bulls}</Text>
                    <Text style={styles.countBadge}>C {item.cows}</Text>
                    <Text style={styles.countBadge}>K {item.calves}</Text>
                  </View>
                </View>
              ))}
              {counts.length === 0 && renderEmptyState('No Camp Counts', 'Record your first camp count to see summaries here.')}
            </View>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>HerdFlow Marketplace</Text>
              <Text style={styles.muted}>Find feed, medicine, tools, and livestock supplies in one place.</Text>
              <View style={styles.marketplaceHighlightsRow}>
                <View style={styles.marketplaceHighlightCard}>
                  <Text style={styles.marketplaceHighlightLabel}>Live products</Text>
                  <Text style={styles.marketplaceHighlightValue}>{marketplaceSnapshot.totalItems}</Text>
                </View>
                <View style={styles.marketplaceHighlightCard}>
                  <Text style={styles.marketplaceHighlightLabel}>In stock</Text>
                  <Text style={styles.marketplaceHighlightValue}>{marketplaceSnapshot.inStock}</Text>
                </View>
                <View style={styles.marketplaceHighlightCard}>
                  <Text style={styles.marketplaceHighlightLabel}>Low stock</Text>
                  <Text style={styles.marketplaceHighlightValue}>{marketplaceSnapshot.lowStock}</Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.primaryButton, styles.marketplaceCta]} onPress={openMarketplace}>
                <Text style={styles.primaryButtonText}>Open Marketplace</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>App Health</Text>
              <Text style={styles.listHint}>Connected API: {activeApiBase}</Text>
              <Text style={styles.listHint}>Pending offline sync: {offlineQueueCount}</Text>
              <Text style={styles.listHint}>Notification permission: {notificationPermission}</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={syncPendingOperations}>
                <Text style={styles.primaryButtonText}>Sync Pending Operations</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {section === 'Marketplace' && (
          <>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>HerdFlow Marketplace</Text>
              <Text style={styles.muted}>Browse the live marketplace list managed from the web app.</Text>
              <View style={styles.marketplaceTrustRow}>
                <Text style={styles.marketplaceTrustChip}>Verified stock</Text>
                <Text style={styles.marketplaceTrustChip}>Commercial checkout</Text>
                <Text style={styles.marketplaceTrustChip}>Order tracking</Text>
              </View>
              <TextInput
                style={styles.marketplaceSearchInput}
                placeholder="Search feed, medicine, tools..."
                value={marketplaceQuery}
                onChangeText={setMarketplaceQuery}
              />
              <View style={styles.marketplaceGrid}>
                {filteredMarketplaceItems.map((item) => (
                  <View key={item.id} style={[styles.marketplaceCard, isCompactLayout && styles.marketplaceCardCompact]}>
                    {item.imageUrl?.trim() && !failedMarketplaceImages.has(item.id) ? (
                      <Image
                        source={{ uri: item.imageUrl.trim() }}
                        style={styles.marketplaceImage}
                        resizeMode="cover"
                        onError={() => {
                          setFailedMarketplaceImages((current) => {
                            const next = new Set(current);
                            next.add(item.id);
                            return next;
                          });
                        }}
                      />
                    ) : (
                      <View style={styles.marketplaceImagePlaceholder}>
                        <Text style={styles.marketplaceImagePlaceholderText}>No image</Text>
                      </View>
                    )}
                    <Text style={styles.marketplaceCardTitle}>{item.name}</Text>
                    <Text style={styles.marketplaceCardPrice}>{item.price} <Text style={styles.marketplaceCardUnit}>{item.unit}</Text></Text>
                    <Text style={[styles.marketplaceStock, (item.stock || 0) > 0 ? styles.marketplaceStockIn : styles.marketplaceStockOut]}>
                      {(item.stock || 0) > 0 ? `In stock: ${item.stock}` : 'Out of stock'}
                    </Text>
                    <Text style={styles.marketplaceCardText}>{item.description}</Text>
                    <TouchableOpacity style={styles.marketplaceBuyButton} onPress={openMarketplace}>
                      <Text style={styles.marketplaceBuyText}>Buy item</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              {filteredMarketplaceItems.length === 0 && renderEmptyState('No Matching Products', 'Try a different search term or clear filters.')}
            </View>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Certified Registration</Text>
              <Text style={styles.muted}>Register as a HerdFlow Logistics Certified Client or a HerdFlow Certified Livestock Seller.</Text>
              <View style={styles.choiceGrid}>
                {registrationTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.optionButton, registrationForm.certificationType === type && styles.optionButtonActive]}
                    onPress={() => setRegistrationForm((current) => ({ ...current, certificationType: type }))}
                  >
                    <Text style={[styles.optionText, registrationForm.certificationType === type && styles.optionTextActive]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.input}
                placeholder="Full name"
                value={registrationForm.name}
                onChangeText={(value) => setRegistrationForm((current) => ({ ...current, name: value }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Company or ranch name"
                value={registrationForm.companyName}
                onChangeText={(value) => setRegistrationForm((current) => ({ ...current, companyName: value }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone"
                value={registrationForm.phone}
                onChangeText={(value) => setRegistrationForm((current) => ({ ...current, phone: value }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={registrationForm.email}
                onChangeText={(value) => setRegistrationForm((current) => ({ ...current, email: value }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Region / location"
                value={registrationForm.region}
                onChangeText={(value) => setRegistrationForm((current) => ({ ...current, region: value }))}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Notes"
                value={registrationForm.note}
                onChangeText={(value) => setRegistrationForm((current) => ({ ...current, note: value }))}
                multiline
              />
              <TouchableOpacity style={styles.primaryButton} onPress={saveMarketplaceRegistration}>
                <Text style={styles.primaryButtonText}>Submit Registration</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Submitted Registrations</Text>
              <Text style={styles.muted}>These certification requests are stored in HerdFlow.</Text>
              {marketplaceRegistrations.map((entry) => (
                <View key={entry.id} style={styles.listItem}>
                  <Text style={styles.listTitle}>{entry.name}</Text>
                  <Text style={styles.listSubtitle}>{entry.certificationType}</Text>
                  <Text style={styles.listHint}>Status: {entry.status}</Text>
                  <Text style={styles.listHint}>{entry.companyName}</Text>
                  <Text style={styles.listHint}>{entry.phone} · {entry.email}</Text>
                  <Text style={styles.listHint}>{entry.region}</Text>
                  {entry.note ? <Text style={styles.listHint}>{entry.note}</Text> : null}
                </View>
              ))}
              {marketplaceRegistrations.length === 0 && renderEmptyState('No Registrations Yet', 'New certification requests will appear in this list.')}
            </View>
          </>
        )}

        {section === 'Cattle' && (
          <>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>{editingCattleId ? 'Edit Animal' : 'Add Animal'}</Text>
              <View style={styles.formRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Tag ID"
                  value={cattleForm.tag}
                  onChangeText={(value) => setCattleForm((prev) => ({ ...prev, tag: value }))}
                />
              </View>
              <Text style={styles.fieldLabel}>Breed</Text>
              <View style={[styles.optionRow, styles.choiceGrid]}>
                {breedChoices.map((breed) => (
                  <TouchableOpacity
                    key={breed}
                    style={[styles.breedButton, cattleForm.breed === breed && styles.optionButtonActive]}
                    onPress={() => setCattleForm((prev) => ({ ...prev, breed }))}
                  >
                    <Text style={[styles.optionText, cattleForm.breed === breed && styles.optionTextActive]}>{breed}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.fieldLabel}>Color</Text>
              <View style={[styles.optionRow, styles.colorRow]}>
                {colors.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.colorButton,
                      cattleForm.colorId === option.value && styles.colorButtonActive
                    ]}
                    onPress={() => setCattleForm((prev) => ({ ...prev, colorId: option.value }))}
                  >
                    <View style={[styles.colorDot, { backgroundColor: option.value }]} />
                    <Text style={[styles.optionText, cattleForm.colorId === option.value && styles.optionTextActive]}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.formRow}>
                <TouchableOpacity style={styles.dateInput} onPress={() => setShowBirthDatePicker(true)}>
                  <Text style={styles.dateInputText}>{cattleForm.birthDate ? formatDate(cattleForm.birthDate) : 'Select birth date'}</Text>
                </TouchableOpacity>
              </View>
              {showBirthDatePicker && (
                <DateTimePicker
                  value={cattleForm.birthDate ? new Date(cattleForm.birthDate) : new Date()}
                  mode="date"
                  display="calendar"
                  onChange={handleBirthDateChange}
                  maximumDate={new Date()}
                />
              )}
              <View style={styles.optionRow}>
                {genders.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionButton, cattleForm.gender === option && styles.optionButtonActive]}
                    onPress={() => setCattleForm((prev) => ({ ...prev, gender: option }))}
                  >
                    <Text style={[styles.optionText, cattleForm.gender === option && styles.optionTextActive]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.optionRow}>
                {statuses.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionButton, cattleForm.status === option && styles.optionButtonActive]}
                    onPress={() => setCattleForm((prev) => ({ ...prev, status: option }))}
                  >
                    <Text style={[styles.optionText, cattleForm.status === option && styles.optionTextActive]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.formRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Weight (kg)"
                  keyboardType="numeric"
                  value={cattleForm.weight ? String(cattleForm.weight) : ''}
                  onChangeText={(value) => setCattleForm((prev) => ({ ...prev, weight: parseNonNegativeNumber(value) }))}
                />
              </View>
              {cattleForm.status === 'Sold' && (
                <>
                  <View style={styles.formRow}>
                    <TextInput
                      style={styles.input}
                      placeholder="Sold Price"
                      keyboardType="numeric"
                      value={cattleForm.soldPrice ? String(cattleForm.soldPrice) : ''}
                      onChangeText={(value) => setCattleForm((prev) => ({ ...prev, soldPrice: parseNonNegativeNumber(value) }))}
                    />
                  </View>
                  <TouchableOpacity style={styles.dateInput} onPress={() => setShowSoldDatePicker(true)}>
                    <Text style={styles.dateInputText}>{cattleForm.soldDate ? formatDate(cattleForm.soldDate) : 'Select sold date'}</Text>
                  </TouchableOpacity>
                  {showSoldDatePicker && (
                    <DateTimePicker
                      value={cattleForm.soldDate ? new Date(cattleForm.soldDate) : new Date()}
                      mode="date"
                      display="calendar"
                      onChange={handleSoldDateChange}
                      maximumDate={new Date()}
                    />
                  )}
                  <TextInput
                    style={styles.input}
                    placeholder="Buyer / Auction Name"
                    value={cattleForm.soldBuyerAuction || ''}
                    onChangeText={(value) => setCattleForm((prev) => ({ ...prev, soldBuyerAuction: value }))}
                  />
                </>
              )}
              {cattleForm.status === 'Dead' && (
                <TextInput
                  style={styles.input}
                  placeholder="Dead reason"
                  value={cattleForm.deadReason || ''}
                  onChangeText={(value) => setCattleForm((prev) => ({ ...prev, deadReason: value }))}
                />
              )}
              <Text style={styles.fieldLabel}>Camp Assignment</Text>
              <View style={[styles.optionRow, styles.campRow]}>
                <TouchableOpacity
                  style={[styles.optionButton, cattleForm.campId === null && styles.optionButtonActive]}
                  onPress={() => setCattleForm((prev) => ({ ...prev, campId: null }))}
                >
                  <Text style={[styles.optionText, cattleForm.campId === null && styles.optionTextActive]}>Unassigned</Text>
                </TouchableOpacity>
                {camps.length > 0 ? camps.map((camp) => (
                  <TouchableOpacity
                    key={camp.id}
                    style={[styles.optionButton, cattleForm.campId === camp.id && styles.optionButtonActive]}
                    onPress={() => setCattleForm((prev) => ({ ...prev, campId: camp.id }))}
                  >
                    <Text style={[styles.optionText, cattleForm.campId === camp.id && styles.optionTextActive]}>{camp.name}</Text>
                  </TouchableOpacity>
                )) : (
                  <Text style={styles.muted}>Create a camp first, then assign animals to it.</Text>
                )}
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Notes"
                value={cattleForm.note}
                onChangeText={(value) => setCattleForm((prev) => ({ ...prev, note: value }))}
                multiline
              />
              <TouchableOpacity style={styles.primaryButton} onPress={saveCattle}>
                <Text style={styles.primaryButtonText}>{editingCattleId ? 'Save Animal' : 'Add Animal'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={resetCattleForm}>
                <Text style={styles.secondaryButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Herd Records</Text>
              <TextInput
                style={styles.marketplaceSearchInput}
                placeholder="Search cattle ID (tag)"
                value={cattleSearchQuery}
                onChangeText={setCattleSearchQuery}
              />
              {herdRecordsByCamp.map((group) => (
                <View key={`${group.campId ?? 'unassigned'}-${group.campName}`}>
                  <Text style={styles.campGroupTitle}>Camp: {group.campName}</Text>
                  {group.records.map((record) => (
                    <View key={record.id} style={styles.listItem}>
                      <TouchableOpacity style={styles.listMain} onPress={() => editCattle(record)}>
                        <Text style={styles.listTitle}>{record.tag} — {record.breed}</Text>
                        <Text style={styles.listSubtitle}>{record.status}</Text>
                        <Text style={styles.listHint}>Tap Edit or open this animal to change it later.</Text>
                      </TouchableOpacity>
                      <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionButton} onPress={() => editCattle(record)}>
                          <Text style={styles.actionText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => deleteCattle(record)}>
                          <Text style={styles.deleteText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
              {filteredCattleRecords.length === 0 && (
                renderEmptyState(
                  cattleSearchQuery.trim() ? 'No Cattle Found' : 'No Cattle Records',
                  cattleSearchQuery.trim() ? 'No cattle matched that tag ID.' : 'Add your first cattle record to get started.'
                )
              )}
            </View>
          </>
        )}

        {section === 'Camps' && (
          <>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>{editingCampId ? 'Edit Camp' : 'Add Camp'}</Text>
              <TextInput
                style={styles.input}
                placeholder="Camp name"
                value={campForm.name}
                onChangeText={(value) => setCampForm((prev) => ({ ...prev, name: value }))}
              />
              <Text style={styles.fieldLabel}>Color</Text>
              <View style={[styles.optionRow, styles.colorRow]}>
                {colors.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.colorButton,
                      campForm.colorId === option.value && styles.colorButtonActive
                    ]}
                    onPress={() => setCampForm((prev) => ({ ...prev, colorId: option.value }))}
                  >
                    <View style={[styles.colorDot, { backgroundColor: option.value }]} />
                    <Text style={[styles.optionText, campForm.colorId === option.value && styles.optionTextActive]}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                value={campForm.description}
                onChangeText={(value) => setCampForm((prev) => ({ ...prev, description: value }))}
                multiline
              />
              <TouchableOpacity style={styles.primaryButton} onPress={saveCamp}>
                <Text style={styles.primaryButtonText}>{editingCampId ? 'Save Camp' : 'Add Camp'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={resetCampForm}>
                <Text style={styles.secondaryButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Camp List</Text>
              {camps.map((camp) => (
                <View key={camp.id} style={styles.listItem}> 
                  <View>
                    <Text style={styles.listTitle}>{camp.name}</Text>
                    <Text style={styles.listSubtitle}>{camp.description || 'No description'}</Text>
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => editCamp(camp)}>
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => deleteCamp(camp)}>
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {camps.length === 0 && renderEmptyState('No Camps Created', 'Add a camp to group animals and improve reporting.')}
            </View>
          </>
        )}

        {section === 'Vaccines' && (
          <>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>{editingVaccineId ? 'Edit Treatment' : 'Schedule Treatment'}</Text>
              <Text style={styles.fieldLabel}>Choose Camp</Text>
              <View style={[styles.optionRow, styles.campRow]}> 
                {camps.length > 0 ? camps.map((camp) => (
                  <TouchableOpacity
                    key={camp.id}
                    style={[styles.optionButton, vaccineForm.campId === camp.id && styles.optionButtonActive]}
                    onPress={() => setVaccineForm((prev) => ({ ...prev, campId: camp.id }))}
                  >
                    <Text style={[styles.optionText, vaccineForm.campId === camp.id && styles.optionTextActive]}>{camp.name}</Text>
                  </TouchableOpacity>
                )) : (
                  <Text style={styles.muted}>Create a camp first, then select it here.</Text>
                )}
              </View>
              {vaccineForm.campId ? (
                <Text style={styles.listHint}>Applies to: {getCampAnimals(vaccineForm.campId).length ? getCampAnimals(vaccineForm.campId).map((animal) => animal.tag).join(', ') : 'No cattle in this camp yet.'}</Text>
              ) : null}
              <Text style={styles.fieldLabel}>Treatment Type</Text>
              <View style={[styles.optionRow, styles.choiceGrid]}>
                {(['Vaccine', 'Medicine', 'Sick Treatment'] as const).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionButton, vaccineForm.treatmentType === option && styles.optionButtonActive]}
                    onPress={() => setVaccineForm((prev) => ({ ...prev, treatmentType: option }))}
                  >
                    <Text style={[styles.optionText, vaccineForm.treatmentType === option && styles.optionTextActive]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.input}
                placeholder="Medicine / vaccine name"
                value={vaccineForm.medicineName}
                onChangeText={(value) => setVaccineForm((prev) => ({ ...prev, medicineName: value, vaccineName: value }))}
              />
              <TextInput
                style={styles.input}
                placeholder="How to apply it (Injection, oral, pour-on, spray...)"
                value={vaccineForm.applicationMethod}
                onChangeText={(value) => setVaccineForm((prev) => ({ ...prev, applicationMethod: value }))}
              />
              <TouchableOpacity style={styles.dateInput} onPress={() => setShowVaccineDatePicker(true)}>
                <Text style={styles.dateInputText}>{vaccineForm.nextDueDate ? formatDate(vaccineForm.nextDueDate) : 'Select next due date'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dateInput, styles.marginTopMd]} onPress={() => setShowVaccineTimePicker(true)}>
                <Text style={styles.dateInputText}>{vaccineForm.nextDueTime || 'Select next due time'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dateInput, styles.marginTopMd]} onPress={() => setShowGivenDatePicker(true)}>
                <Text style={styles.dateInputText}>{vaccineForm.givenDate ? formatDate(vaccineForm.givenDate) : 'Select given / treated date'}</Text>
              </TouchableOpacity>
              {showVaccineDatePicker && (
                <DateTimePicker
                  value={vaccineForm.nextDueDate ? new Date(vaccineForm.nextDueDate) : new Date()}
                  mode="date"
                  display="calendar"
                  onChange={handleScheduledDateChange}
                />
              )}
              {showVaccineTimePicker && (
                <DateTimePicker
                  value={vaccineForm.nextDueTime ? new Date(`1970-01-01T${vaccineForm.nextDueTime}:00`) : new Date()}
                  mode="time"
                  display="clock"
                  onChange={handleScheduledTimeChange}
                />
              )}
              {showGivenDatePicker && (
                <DateTimePicker
                  value={vaccineForm.givenDate ? new Date(vaccineForm.givenDate) : new Date()}
                  mode="date"
                  display="calendar"
                  onChange={handleGivenDateChange}
                />
              )}
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Notes, dosage, or follow-up instructions"
                value={vaccineForm.note}
                onChangeText={(value) => setVaccineForm((prev) => ({ ...prev, note: value }))}
                multiline
              />
              <TouchableOpacity style={styles.primaryButton} onPress={saveVaccine}>
                <Text style={styles.primaryButtonText}>{editingVaccineId ? 'Save Treatment' : 'Add Treatment'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Treatment Schedule</Text>
              {vaccines.map((entry) => (
                <View key={entry.id} style={styles.listItem}>
                  <View>
                    <Text style={styles.listTitle}>{entry.medicineName || entry.vaccineName}</Text>
                    <Text style={styles.listSubtitle}>{entry.treatmentType || 'Treatment'} · {getCampName(entry.campId ?? null)} · {getCampAnimals(entry.campId ?? null).length} cattle</Text>
                    <Text style={styles.listHint}>{entry.applicationMethod || 'Application method not set'} · Next: {entry.nextDueAt ? formatDateTime(entry.nextDueAt) : formatDate(entry.scheduledDate || new Date().toISOString())}</Text>
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => editVaccine(entry)}>
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => deleteVaccine(entry)}>
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {vaccines.length === 0 && renderEmptyState('No Treatment Records', 'Create a treatment schedule to start tracking doses and due dates.')}
            </View>
          </>
        )}

        {section === 'Counts' && (
          <>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Record Camp Count</Text>
              <Text style={styles.fieldLabel}>Choose Camp</Text>
              <View style={[styles.optionRow, styles.campRow]}>
                {camps.length > 0 ? camps.map((camp) => (
                  <TouchableOpacity
                    key={camp.id}
                    style={[styles.optionButton, countForm.campId === camp.id && styles.optionButtonActive]}
                    onPress={() => setCountForm((prev) => ({ ...prev, campId: camp.id }))}
                  >
                    <Text style={[styles.optionText, countForm.campId === camp.id && styles.optionTextActive]}>{camp.name}</Text>
                  </TouchableOpacity>
                )) : (
                  <Text style={styles.muted}>Create a camp first, then select it here.</Text>
                )}
              </View>
              <TouchableOpacity style={styles.dateInput} onPress={() => setShowCountDatePicker(true)}>
                <Text style={styles.dateInputText}>{countForm.countDate ? formatDate(countForm.countDate) : 'Select count date'}</Text>
              </TouchableOpacity>
              {showCountDatePicker && (
                <DateTimePicker
                  value={countForm.countDate ? new Date(countForm.countDate) : new Date()}
                  mode="date"
                  display="calendar"
                  onChange={handleCountDateChange}
                  maximumDate={new Date()}
                />
              )}
              <View style={styles.formRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Bulls"
                  keyboardType="numeric"
                  value={countForm.bulls ? String(countForm.bulls) : ''}
                  onChangeText={(value) => setCountForm((prev) => ({ ...prev, bulls: parseNonNegativeNumber(value) }))}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Cows"
                  keyboardType="numeric"
                  value={countForm.cows ? String(countForm.cows) : ''}
                  onChangeText={(value) => setCountForm((prev) => ({ ...prev, cows: parseNonNegativeNumber(value) }))}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Calves"
                keyboardType="numeric"
                value={countForm.calves ? String(countForm.calves) : ''}
                onChangeText={(value) => setCountForm((prev) => ({ ...prev, calves: parseNonNegativeNumber(value) }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Person counted"
                value={countForm.personCounted || ''}
                onChangeText={(value) => setCountForm((prev) => ({ ...prev, personCounted: value }))}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Notes"
                value={countForm.note}
                onChangeText={(value) => setCountForm((prev) => ({ ...prev, note: value }))}
                multiline
              />
              <TouchableOpacity style={styles.primaryButton} onPress={saveCount}>
                <Text style={styles.primaryButtonText}>Save Count</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Recent Counts</Text>
              {counts.map((log) => (
                <View key={log.id} style={styles.listItem}>
                  <View>
                    <Text style={styles.listTitle}>{getCampName(log.campId)}</Text>
                    <Text style={styles.listSubtitle}>{formatDate(log.countDate)}</Text>
                    <Text style={styles.listHint}>Person counted: {log.personCounted?.trim() ? log.personCounted : 'Not recorded'}</Text>
                  </View>
                  <View style={styles.countsRow}>
                    <Text style={styles.countBadge}>B {log.bulls}</Text>
                    <Text style={styles.countBadge}>C {log.cows}</Text>
                    <Text style={styles.countBadge}>K {log.calves}</Text>
                  </View>
                  <TouchableOpacity style={[styles.actionButton, styles.deleteButton, styles.deleteSmall]} onPress={() => deleteCount(log)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {counts.length === 0 && renderEmptyState('No Count Records', 'Once camp counts are saved, recent entries appear here.')}
            </View>
          </>
        )}
        </Animated.View>
      </ScrollView>

      {bootOverlayVisible && (
        <Animated.View style={[styles.bootScreenOverlay, { opacity: bootOpacity }]}>
          <View style={styles.bootCard}>
            <Animated.Image source={require('./assets/logo.png')} style={[styles.bootLogo, { transform: [{ scale: bootLogoScale }] }]} />
            <Text style={styles.bootSubtitle}>Preparing your livestock operations dashboard...</Text>
            <Text style={styles.bootStatusText}>{bootStatus}</Text>
            <View style={styles.bootProgressTrack}>
              <Animated.View style={[styles.bootProgressFill, { width: bootProgressWidth }]} />
            </View>
            <View style={styles.bootIndicatorWrap}>
              <ActivityIndicator size="small" color={M3.color.primary} />
            </View>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bootScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: M3.color.onPrimaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: M3.spacing.xl,
    zIndex: 999
  },
  bootCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: M3.color.onSurface,
    borderWidth: 1,
    borderColor: M3.color.outline,
    borderRadius: M3.radius.lg,
    alignItems: 'center',
    paddingVertical: 34,
    paddingHorizontal: M3.spacing.xl
  },
  bootLogo: {
    width: 76,
    height: 76,
    borderRadius: 18,
    marginBottom: 18,
    backgroundColor: M3.color.surface
  },
  bootSubtitle: {
    color: M3.color.surfaceVariant,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19
  },
  bootStatusText: {
    marginTop: 10,
    color: M3.color.primaryContainer,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center'
  },
  bootProgressTrack: {
    width: '100%',
    height: 8,
    borderRadius: M3.radius.pill,
    backgroundColor: M3.color.surfaceVariant,
    marginTop: 14,
    overflow: 'hidden'
  },
  bootProgressFill: {
    height: '100%',
    borderRadius: M3.radius.pill,
    backgroundColor: M3.color.primary
  },
  bootIndicatorWrap: {
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: M3.radius.pill,
    backgroundColor: M3.color.surfaceVariant
  },
  safeArea: {
    flex: 1,
    backgroundColor: M3.color.surface
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: M3.spacing.lg,
    paddingVertical: M3.spacing.lg,
    backgroundColor: M3.color.surfaceContainer,
    borderBottomWidth: 1,
    borderBottomColor: M3.color.outlineVariant
  },
  fieldLabel: {
    marginBottom: M3.spacing.sm,
    color: M3.color.onSurfaceVariant,
    ...M3.type.labelLarge
  },
  colorRow: {
    flexWrap: 'wrap'
  },
  campRow: {
    marginBottom: M3.spacing.md
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  colorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: M3.color.outline,
    borderRadius: 14,
    backgroundColor: M3.color.surface,
    marginRight: 10,
    marginBottom: 10,
    minWidth: '30%',
    flexGrow: 1
  },
  colorButtonActive: {
    backgroundColor: M3.color.primaryContainer,
    borderColor: M3.color.primaryContainer
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8
  },
  dateInput: {
    backgroundColor: M3.color.surface,
    borderWidth: 1,
    borderColor: M3.color.outline,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: M3.spacing.lg,
    minWidth: '48%',
    justifyContent: 'center'
  },
  dateInputText: {
    color: M3.color.onSurface,
    ...M3.type.bodyLarge
  },
  marginTopMd: {
    marginTop: M3.spacing.md
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: M3.spacing.md,
    marginTop: M3.spacing.sm
  },
  headerText: {
    flex: 1,
    marginLeft: M3.spacing.md
  },
  logo: {
    height: 44,
    width: 44,
    borderRadius: M3.radius.sm,
    backgroundColor: M3.color.surface
  },
  brandSpacer: {
    width: 1,
    height: 1
  },
  apiHint: {
    width: '100%',
    marginTop: M3.spacing.sm,
    color: M3.color.onSurfaceVariant,
    ...M3.type.labelSmall
  },
  refreshButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: M3.color.secondaryContainer,
    borderRadius: M3.radius.sm
  },
  refreshText: {
    color: M3.color.onSecondaryContainer,
    ...M3.type.labelLarge
  },
  marketplaceButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: M3.color.primary,
    borderRadius: M3.radius.sm,
    marginRight: 10
  },
  marketplaceButtonText: {
    color: M3.color.onPrimary,
    ...M3.type.labelLarge
  },
  marketplaceActionWrap: {
    marginRight: 10
  },
  marketplaceTagline: {
    marginTop: M3.spacing.xs,
    color: M3.color.onSurfaceVariant,
    ...M3.type.bodySmall
  },
  registrationButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: M3.color.tertiaryContainer,
    borderRadius: M3.radius.sm,
    marginRight: 10
  },
  registrationButtonText: {
    color: M3.color.onSurface,
    ...M3.type.labelLarge
  },
  tabRow: {
    paddingHorizontal: M3.spacing.lg,
    paddingBottom: M3.spacing.md,
    marginTop: M3.spacing.md
  },
  tabButton: {
    marginRight: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: M3.color.surface,
    borderRadius: M3.radius.md,
    borderWidth: 1,
    borderColor: M3.color.outlineVariant
  },
  tabButtonActive: {
    backgroundColor: M3.color.primaryContainer,
    borderColor: M3.color.primaryContainer
  },
  tabText: {
    color: M3.color.onSurface,
    ...M3.type.labelLarge,
    textAlign: 'center',
    includeFontPadding: false
  },
  tabTextActive: {
    color: M3.color.onPrimaryContainer
  },
  content: {
    paddingHorizontal: M3.spacing.lg,
    paddingBottom: 40
  },
  contentAnimated: {
    width: '100%'
  },
  sectionBlock: {
    marginTop: M3.spacing.lg,
    backgroundColor: M3.color.surfaceContainer,
    borderRadius: M3.radius.lg,
    padding: M3.spacing.lg,
    borderWidth: 1,
    borderColor: M3.color.outlineVariant
  },
  marketplaceCta: {
    marginTop: M3.spacing.lg,
    alignSelf: 'flex-start'
  },
  marketplaceHighlightsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: M3.spacing.md
  },
  marketplaceHighlightCard: {
    width: '32%',
    minWidth: 96,
    backgroundColor: M3.color.surface,
    borderWidth: 1,
    borderColor: M3.color.outlineVariant,
    borderRadius: 14,
    padding: 10,
    marginBottom: M3.spacing.sm
  },
  marketplaceHighlightLabel: {
    color: M3.color.onSurfaceVariant,
    ...M3.type.labelSmall,
    marginBottom: 6
  },
  marketplaceHighlightValue: {
    color: M3.color.onSurface,
    ...M3.type.headlineSmall
  },
  marketplaceTrustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    marginBottom: 10
  },
  marketplaceTrustChip: {
    backgroundColor: M3.color.secondaryContainer,
    borderWidth: 1,
    borderColor: M3.color.outlineVariant,
    color: M3.color.onSecondaryContainer,
    ...M3.type.labelSmall,
    borderRadius: M3.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: M3.spacing.sm,
    marginBottom: M3.spacing.sm
  },
  marketplaceSearchInput: {
    backgroundColor: M3.color.surface,
    borderWidth: 1,
    borderColor: M3.color.outline,
    borderRadius: M3.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    color: M3.color.onSurface
  },
  marketplaceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: M3.spacing.md
  },
  marketplaceCard: {
    width: '48%',
    backgroundColor: M3.color.surface,
    borderWidth: 1,
    borderColor: M3.color.outlineVariant,
    borderRadius: 18,
    padding: 14,
    marginBottom: M3.spacing.md
  },
  marketplaceCardCompact: {
    width: '100%'
  },
  marketplaceImage: {
    width: '100%',
    height: 132,
    borderRadius: M3.radius.sm,
    marginBottom: 10,
    backgroundColor: M3.color.surfaceVariant
  },
  marketplaceImagePlaceholder: {
    width: '100%',
    height: 132,
    borderRadius: M3.radius.sm,
    marginBottom: 10,
    backgroundColor: M3.color.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center'
  },
  marketplaceImagePlaceholderText: {
    color: M3.color.onSurfaceVariant,
    ...M3.type.labelMedium
  },
  marketplaceCardTitle: {
    color: M3.color.onSurface,
    ...M3.type.titleMedium,
    marginBottom: 6
  },
  marketplaceCardText: {
    color: M3.color.onSurfaceVariant,
    ...M3.type.bodyMedium
  },
  marketplaceStock: {
    alignSelf: 'flex-start',
    borderRadius: M3.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    ...M3.type.labelSmall,
    marginBottom: 6
  },
  marketplaceStockIn: {
    backgroundColor: M3.color.successContainer,
    color: M3.color.onSuccessContainer
  },
  marketplaceStockOut: {
    backgroundColor: M3.color.errorContainer,
    color: M3.color.onErrorContainer
  },
  marketplaceCardPrice: {
    color: M3.color.onSurface,
    ...M3.type.titleLarge,
    marginBottom: 4
  },
  marketplaceCardUnit: {
    color: M3.color.onSurfaceVariant,
    ...M3.type.labelMedium
  },
  sectionTitle: {
    ...M3.type.titleLarge,
    marginBottom: M3.spacing.md,
    color: M3.color.onSurface
  },
  campGroupTitle: {
    color: M3.color.onSurfaceVariant,
    ...M3.type.titleMedium,
    marginTop: 6,
    marginBottom: 8
  },
  marketplaceBuyButton: {
    marginTop: M3.spacing.md,
    backgroundColor: M3.color.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: M3.radius.sm,
    alignSelf: 'flex-start'
  },
  marketplaceBuyText: {
    color: M3.color.onPrimary,
    ...M3.type.labelLarge
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  card: {
    width: '48%',
    marginBottom: M3.spacing.md,
    backgroundColor: M3.color.surface,
    borderRadius: 20,
    padding: M3.spacing.lg,
    borderWidth: 1,
    borderColor: M3.color.outlineVariant
  },
  cardInteractive: {
    borderColor: M3.color.primary,
    borderWidth: 2
  },
  cardLabel: {
    color: M3.color.onSurfaceVariant,
    ...M3.type.bodyMedium,
    marginBottom: M3.spacing.sm
  },
  cardValue: {
    ...M3.type.headlineSmall,
    color: M3.color.onSurface
  },
  cardHint: {
    marginTop: 6,
    color: M3.color.primary,
    ...M3.type.labelMedium
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap'
  },
  input: {
    backgroundColor: M3.color.surface,
    borderWidth: 1,
    borderColor: M3.color.outline,
    borderRadius: 14,
    padding: 14,
    marginBottom: M3.spacing.md,
    color: M3.color.onSurface,
    ...M3.type.bodyLarge,
    flex: 1,
    minWidth: '48%'
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top'
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: M3.spacing.md
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: M3.color.outline,
    borderRadius: 14,
    backgroundColor: M3.color.surface
  },
  breedButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: M3.color.outline,
    borderRadius: 14,
    backgroundColor: M3.color.surface,
    marginRight: 10,
    marginBottom: 10
  },
  optionButtonActive: {
    backgroundColor: M3.color.primaryContainer,
    borderColor: M3.color.primaryContainer
  },
  optionText: {
    color: M3.color.onSurface,
    ...M3.type.labelLarge
  },
  optionTextActive: {
    color: M3.color.onPrimaryContainer
  },
  primaryButton: {
    marginTop: M3.spacing.sm,
    paddingVertical: M3.spacing.lg,
    borderRadius: M3.radius.md,
    backgroundColor: M3.color.primary,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: M3.color.onPrimary,
    ...M3.type.labelLarge
  },
  secondaryButton: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: M3.radius.md,
    backgroundColor: M3.color.secondaryContainer,
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: M3.color.onSecondaryContainer,
    ...M3.type.labelLarge
  },
  secondaryButtonSmall: {
    marginTop: M3.spacing.xs,
    paddingVertical: M3.spacing.md,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: M3.color.secondaryContainer,
    alignItems: 'center'
  },
  listItem: {
    backgroundColor: M3.color.surface,
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: M3.color.outlineVariant
  },
  listMain: {
    marginBottom: 10
  },
  listTitle: {
    color: M3.color.onSurface,
    ...M3.type.titleMedium
  },
  listSubtitle: {
    color: M3.color.onSurfaceVariant,
    ...M3.type.bodyMedium,
    marginTop: M3.spacing.xs
  },
  listHint: {
    color: M3.color.onSurfaceVariant,
    marginTop: M3.spacing.xs,
    ...M3.type.bodySmall
  },
  listMeta: {
    color: M3.color.onSurface,
    ...M3.type.labelLarge
  },
  countsRow: {
    flexDirection: 'row',
    marginTop: M3.spacing.sm,
    flexWrap: 'wrap'
  },
  countBadge: {
    marginRight: M3.spacing.sm,
    backgroundColor: M3.color.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: M3.radius.pill,
    color: M3.color.onSecondaryContainer,
    ...M3.type.labelMedium
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: M3.spacing.md
  },
  actionButton: {
    paddingHorizontal: M3.spacing.md,
    paddingVertical: 10,
    backgroundColor: M3.color.primary,
    borderRadius: 14,
    marginRight: 10
  },
  actionText: {
    color: M3.color.onPrimary,
    ...M3.type.labelLarge
  },
  deleteButton: {
    backgroundColor: M3.color.error
  },
  deleteText: {
    color: M3.color.onError,
    ...M3.type.labelLarge
  },
  deleteSmall: {
    marginTop: M3.spacing.sm
  },
  loader: {
    marginVertical: M3.spacing.xl
  },
  error: {
    color: M3.color.error,
    marginBottom: M3.spacing.md,
    textAlign: 'center',
    ...M3.type.labelLarge
  },
  muted: {
    color: M3.color.onSurfaceVariant
  },
  stateCard: {
    marginTop: M3.spacing.lg,
    backgroundColor: M3.color.surfaceContainer,
    borderRadius: M3.radius.md,
    borderWidth: 1,
    borderColor: M3.color.outlineVariant,
    padding: M3.spacing.lg,
    alignItems: 'center'
  },
  stateCardError: {
    marginTop: M3.spacing.lg,
    backgroundColor: M3.color.errorContainer,
    borderRadius: M3.radius.md,
    borderWidth: 1,
    borderColor: M3.color.error,
    padding: M3.spacing.lg,
    alignItems: 'center'
  },
  stateTitle: {
    marginTop: M3.spacing.sm,
    color: M3.color.onSurface,
    ...M3.type.titleMedium
  },
  stateMessage: {
    marginTop: M3.spacing.sm,
    color: M3.color.onSurfaceVariant,
    textAlign: 'center',
    ...M3.type.bodyMedium
  },
  stateMessageError: {
    color: M3.color.onErrorContainer
  },
  stateActionRow: {
    flexDirection: 'row',
    marginTop: M3.spacing.md,
    gap: M3.spacing.sm
  },
  statePrimaryAction: {
    paddingHorizontal: M3.spacing.lg,
    paddingVertical: 10,
    borderRadius: M3.radius.pill,
    backgroundColor: M3.color.primary
  },
  statePrimaryActionText: {
    color: M3.color.onPrimary,
    ...M3.type.labelLarge
  },
  stateTonalAction: {
    paddingHorizontal: M3.spacing.lg,
    paddingVertical: 10,
    borderRadius: M3.radius.pill,
    backgroundColor: M3.color.secondaryContainer
  },
  stateTonalActionText: {
    color: M3.color.onSecondaryContainer,
    ...M3.type.labelLarge
  }
});
