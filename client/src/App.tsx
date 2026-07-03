import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

type Gender = 'Female' | 'Male' | 'Other';
type Status = 'Active' | 'Sold' | 'Quarantined' | 'Veterinary';
type ViewSection = 'dashboard' | 'cattle' | 'camps' | 'vaccines' | 'counts' | 'marketplace';

const OPERATIONS_PATH = '/app';
const MARKETPLACE_PATH = '/marketplace';
const TRACKING_PATH = '/track';
const DEFAULT_SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://herdflow-h619.onrender.com';
const DEFAULT_MARKETPLACE_URL = `${DEFAULT_SITE_URL}${MARKETPLACE_PATH}`;
const DEFAULT_APP_DOWNLOAD_URL = 'https://expo.io/builds';
const SITE_URL = (import.meta as ImportMeta & { env: { VITE_SITE_URL?: string } }).env.VITE_SITE_URL?.trim() || DEFAULT_SITE_URL;
const MARKETPLACE_URL = (import.meta as ImportMeta & { env: { VITE_MARKETPLACE_URL?: string } }).env.VITE_MARKETPLACE_URL?.trim() || DEFAULT_MARKETPLACE_URL;
const ADMIN_API_KEY = (import.meta as ImportMeta & { env: { VITE_ADMIN_API_KEY?: string } }).env.VITE_ADMIN_API_KEY?.trim() || '';
const APP_DOWNLOAD_URL = (import.meta as ImportMeta & { env: { VITE_APP_DOWNLOAD_URL?: string; VITE_APK_DOWNLOAD_URL?: string } }).env.VITE_APP_DOWNLOAD_URL?.trim()
  || (import.meta as ImportMeta & { env: { VITE_APP_DOWNLOAD_URL?: string; VITE_APK_DOWNLOAD_URL?: string } }).env.VITE_APK_DOWNLOAD_URL?.trim()
  || DEFAULT_APP_DOWNLOAD_URL;
const MARKETPLACE_IMAGE_MAX_DIMENSION = 1280;
const MARKETPLACE_IMAGE_MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const ANALYTICS_STORAGE_KEY = 'herdflow:analytics-events';
const ANALYTICS_SESSION_KEY = 'herdflow:analytics-session';
const ANALYTICS_TRANSPORT_HISTORY_KEY = 'herdflow:analytics-transport-history';
const RELEASE_READINESS_HISTORY_KEY = 'herdflow:release-readiness-history';
const MAX_ANALYTICS_EVENTS = 400;
const MARKETPLACE_PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2e8f0"/><stop offset="1" stop-color="#cbd5e1"/></linearGradient></defs><rect width="1200" height="800" fill="url(#g)"/><g fill="#334155" opacity="0.9"><rect x="230" y="190" width="740" height="420" rx="30" ry="30" fill="none" stroke="#64748b" stroke-width="26"/><circle cx="450" cy="370" r="52"/><path d="M335 545l170-176 98 102 108-118 154 192z"/></g><text x="600" y="660" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="44" fill="#1e293b">Product image</text></svg>'
)}`;

interface MarketplaceItem {
  id: number;
  name: string;
  price: string;
  unit: string;
  description: string;
  imageUrl?: string;
  stock: number;
  isPublished: boolean;
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

interface CustomerSignup {
  id: number;
  name: string;
  email: string;
  phone: string;
  interest: string;
  createdAt: string;
}

interface MarketplaceOrderLine {
  itemId: number;
  name: string;
  price: string;
  unit: string;
  quantity: number;
  imageUrl?: string;
}

interface MarketplaceOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  notes: string;
  status: 'Pending' | 'Confirmed' | 'Fulfilled' | 'Cancelled';
  paymentMethod: 'PayOnDelivery' | 'Stripe' | 'PayFast';
  paymentStatus: 'Pending' | 'Initiated' | 'Paid' | 'Failed';
  paymentReference: string;
  lines: MarketplaceOrderLine[];
  totalAmount: string;
  createdAt: string;
}

const initialMarketplaceForm = {
  name: '',
  price: '',
  unit: '',
  description: '',
  imageUrl: '',
  stock: 0,
  isPublished: false
};

const initialRegistrationForm = {
  certificationType: 'Logistics Certified Client' as 'Logistics Certified Client' | 'Certified Livestock Seller',
  status: 'Pending' as 'Pending' | 'Approved' | 'Rejected',
  name: '',
  companyName: '',
  phone: '',
  email: '',
  region: '',
  note: ''
};

const initialCustomerForm = {
  name: '',
  email: '',
  phone: '',
  interest: ''
};

const initialCheckoutForm = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  deliveryAddress: '',
  notes: '',
  paymentMethod: 'PayOnDelivery' as 'PayOnDelivery' | 'Stripe' | 'PayFast'
};

function getColorChipClass(colorId: string) {
  switch (colorId) {
    case '#2563eb':
      return 'color-chip color-chip-blue';
    case '#16a34a':
      return 'color-chip color-chip-green';
    case '#c2410c':
      return 'color-chip color-chip-orange';
    case '#db2777':
      return 'color-chip color-chip-pink';
    case '#7c3aed':
      return 'color-chip color-chip-purple';
    case '#f59e0b':
      return 'color-chip color-chip-yellow';
    default:
      return 'color-chip color-chip-dark';
  }
}

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
  cattleId: number;
  vaccineName: string;
  scheduledDate: string;
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
  note: string;
  createdAt: string;
}

const statusOptions: Status[] = ['Active', 'Sold', 'Quarantined', 'Veterinary'];
const genderOptions: Gender[] = ['Female', 'Male', 'Other'];
const colors = ['#2563eb', '#16a34a', '#c2410c', '#db2777', '#7c3aed', '#f59e0b', '#0f172a'];

const businessHighlights = [
  {
    title: 'Download-ready',
    description: 'Package HerdFlow as an Android app and share it with staff, partners, and buyers.'
  },
  {
    title: 'Marketplace commerce',
    description: 'List supplies and direct buyers to the HerdFlow store from the same platform.'
  },
  {
    title: 'Partner onboarding',
    description: 'Register logistics companies and farmers who want to sell livestock.'
  }
];

const websiteBenefits = [
  'Livestock tracking for herds, camps, and health records',
  'Marketplace storefront for feed, supplies, and services',
  'Partner registration for logistics companies and livestock sellers',
  'Web, desktop, and Android access from one business platform'
];

const websiteSteps = [
  {
    title: '1. Launch the website',
    description: 'Open HerdFlow in a browser to present the business, the marketplace, and your services.'
  },
  {
    title: '2. Send buyers to the store',
    description: 'Link customers to the marketplace website so they can browse and purchase items.'
  },
  {
    title: '3. Capture partners',
    description: 'Collect registrations from logistics companies and farmers who want to work with HerdFlow.'
  }
];

const websiteServices = [
  {
    title: 'Marketplace sales',
    description: 'List feed, supplies, and livestock-adjacent products with a clear buy path.'
  },
  {
    title: 'Partner onboarding',
    description: 'Register logistics companies and livestock sellers for review by your team.'
  },
  {
    title: 'Livestock operations',
    description: 'Track cattle, camps, treatments, and counts from one system.'
  }
];

const websiteContacts = [
  {
    title: 'Sales email',
    detail: 'sales@herdflow.example',
    href: 'mailto:sales@herdflow.example',
    note: 'Use this for marketplace listings, pricing, and general enquiries.'
  },
  {
    title: 'Phone / WhatsApp',
    detail: '+1 (555) 014-7800',
    href: 'tel:+15550147800',
    note: 'Use this for urgent questions and live follow-up.'
  },
  {
    title: 'Office hours',
    detail: 'Mon-Fri, 8:00 AM - 5:00 PM',
    href: '',
    note: 'Update this with your local support hours.'
  }
];

const globalCommercePillars = [
  {
    title: 'Cross-border readiness',
    detail: 'Operational workflows support regional logistics partners, international buyer onboarding, and centralized order governance.'
  },
  {
    title: 'Commercial reliability',
    detail: 'Inventory is synced with operations, checkout captures buyer data cleanly, and tracking stays transparent across order stages.'
  },
  {
    title: 'Enterprise support model',
    detail: 'Business teams can coordinate procurement, delivery updates, and marketplace admin actions from one shared platform.'
  }
];

const storefrontAssuranceBadges = [
  'Invoice-ready order records',
  'Verified stock visibility',
  'Order tracking with confirmation ID',
  'Business-hour support workflow'
];

const enterpriseServiceStandards = [
  {
    title: 'Commercial payment readiness',
    detail: 'Supports multiple payment methods and reference tracking for finance teams.'
  },
  {
    title: 'Regional fulfilment coordination',
    detail: 'Dispatch planning is aligned with logistics partners and route-ready deliveries.'
  },
  {
    title: 'Buyer assurance operations',
    detail: 'Each order is traceable with clear status visibility from checkout to fulfilment.'
  }
];

const checkoutCommitments = [
  'Commercial orders are reviewed during business hours.',
  'Your confirmation ID is generated immediately after order placement.',
  'Tracking details can be checked any time on the order tracking page.'
];

type CommerceEventName =
  | 'product_view'
  | 'add_to_cart'
  | 'checkout_click'
  | 'place_order_attempt'
  | 'place_order_success';

const analyticsWindows = [7, 30, 90] as const;
type AnalyticsWindowDays = (typeof analyticsWindows)[number];

interface CommerceAnalyticsEvent {
  event: CommerceEventName;
  at: string;
  path: string;
  session: string;
  experiment: string;
  variant: string;
  [key: string]: unknown;
}

interface AnalyticsTransportAttempt {
  at: string;
  ok: boolean;
}

interface ReleaseReadinessSnapshot {
  at: string;
  windowDays: AnalyticsWindowDays;
  passed: number;
  total: number;
  scorePercent: number;
  checkoutToOrderRate: number;
  transportErrorRate: number;
  apiLatencyMs: number | null;
  anomalyCount: number;
}

interface ApiHealthPayload {
  status: 'ok';
  now: string;
  uptimeSeconds: number;
  version: string;
  analyticsEvents: number;
  orders: number;
}

type AdminCatalogFilter = 'all' | 'published' | 'draft';

function getOrCreateAnalyticsSession() {
  if (typeof window === 'undefined') return 'server';
  const existing = localStorage.getItem(ANALYTICS_SESSION_KEY);
  if (existing) return existing;
  const generated = `hf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  localStorage.setItem(ANALYTICS_SESSION_KEY, generated);
  return generated;
}

function getExperimentContext() {
  if (typeof window === 'undefined') {
    return { experiment: 'default', variant: 'control' };
  }

  const params = new URLSearchParams(window.location.search);
  const experiment = params.get('exp') || params.get('experiment') || localStorage.getItem('herdflow:exp') || 'default';
  const variant = params.get('variant') || localStorage.getItem('herdflow:variant') || 'control';

  localStorage.setItem('herdflow:exp', experiment);
  localStorage.setItem('herdflow:variant', variant);

  return { experiment, variant };
}

function inferCurrencyFromLocale(locale: string) {
  if (/\bZA\b/i.test(locale)) return 'ZAR';
  if (/\bGB\b/i.test(locale)) return 'GBP';
  if (/\bAU\b/i.test(locale)) return 'AUD';
  if (/\bNZ\b/i.test(locale)) return 'NZD';
  if (/\bEU\b/i.test(locale) || /^(de|fr|es|it|pt|nl|fi|sv|da|no)-/i.test(locale)) return 'EUR';
  return 'USD';
}

function getRegistrationTypeLabel(value: MarketplaceRegistration['certificationType']) {
  switch (value) {
    case 'Logistics Certified Client':
      return 'Logistics company';
    case 'Certified Livestock Seller':
      return 'Farmer / livestock seller';
    default:
      return value;
  }
}

function classifyMarketplaceCategory(item: MarketplaceItem) {
  const text = `${item.name} ${item.description} ${item.unit}`.toLowerCase();
  if (/feed|mineral|grain|supplement|fodder/.test(text)) return 'Feed';
  if (/vaccine|medicine|vet|iverm|health|treatment|syringe/.test(text)) return 'Health';
  if (/clean|wash|hygiene|sanit/.test(text)) return 'Hygiene';
  if (/tag|tool|kit|equipment|trough|fence/.test(text)) return 'Equipment';
  return 'Farm Essentials';
}

const initialCattleForm = {
  tag: '',
  breed: '',
  colorId: colors[0],
  gender: 'Female' as Gender,
  birthDate: '',
  status: 'Active' as Status,
  weight: 0,
  campId: null as number | null,
  note: ''
};

const initialCampForm = {
  name: '',
  colorId: colors[0],
  description: ''
};

const initialVaccineForm = {
  cattleId: null as number | null,
  vaccineName: '',
  scheduledDate: '',
  givenDate: '' as string | null,
  note: ''
};

const initialCountForm = {
  campId: null as number | null,
  countDate: '',
  bulls: 0,
  cows: 0,
  calves: 0,
  note: ''
};

function App() {
  const pathname = window.location.pathname;
  const isHomePage = pathname === '/';
  const isMarketplacePage = pathname === MARKETPLACE_PATH;
  const isTrackingPage = pathname === TRACKING_PATH;
  const isOperationsPage = pathname === OPERATIONS_PATH;

  const [section, setSection] = useState<ViewSection>('dashboard');
  const [cattle, setCattle] = useState<CattleRecord[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [vaccines, setVaccines] = useState<VaccineRecord[]>([]);
  const [counts, setCounts] = useState<CountLog[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [marketplaceRegistrations, setMarketplaceRegistrations] = useState<MarketplaceRegistration[]>([]);
  const [cattleForm, setCattleForm] = useState(initialCattleForm);
  const [campForm, setCampForm] = useState(initialCampForm);
  const [vaccineForm, setVaccineForm] = useState(initialVaccineForm);
  const [countForm, setCountForm] = useState(initialCountForm);
  const [marketplaceForm, setMarketplaceForm] = useState(initialMarketplaceForm);
  const [registrationForm, setRegistrationForm] = useState(initialRegistrationForm);
  const [customerForm, setCustomerForm] = useState(initialCustomerForm);
  const [checkoutForm, setCheckoutForm] = useState(initialCheckoutForm);
  const [customerSignups, setCustomerSignups] = useState<CustomerSignup[]>([]);
  const [marketplaceOrders, setMarketplaceOrders] = useState<MarketplaceOrder[]>([]);
  const [cartItems, setCartItems] = useState<Array<{ itemId: number; quantity: number }>>([]);
  const [lastOrderNumber, setLastOrderNumber] = useState('');
  const [trackingLookup, setTrackingLookup] = useState({ orderNumber: '', email: '' });
  const [trackingResult, setTrackingResult] = useState<MarketplaceOrder | null>(null);
  const [editingCattleId, setEditingCattleId] = useState<number | null>(null);
  const [editingCampId, setEditingCampId] = useState<number | null>(null);
  const [editingVaccineId, setEditingVaccineId] = useState<number | null>(null);
  const [editingMarketplaceId, setEditingMarketplaceId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncMessage, setSyncMessage] = useState('');
  const [isMarketplaceImageProcessing, setIsMarketplaceImageProcessing] = useState(false);
  const [isMarketplaceDropActive, setIsMarketplaceDropActive] = useState(false);
  const [shopQuery, setShopQuery] = useState('');
  const [shopCategory, setShopCategory] = useState('All');
  const [shopSort, setShopSort] = useState<'featured' | 'price-low' | 'price-high' | 'name'>('featured');
  const [adminCatalogFilter, setAdminCatalogFilter] = useState<AdminCatalogFilter>('all');
  const [analyticsEvents, setAnalyticsEvents] = useState<CommerceAnalyticsEvent[]>([]);
  const [analyticsSource, setAnalyticsSource] = useState<'local' | 'remote'>('local');
  const [analyticsWindowDays, setAnalyticsWindowDays] = useState<AnalyticsWindowDays>(30);
  const [lastRemoteSyncAt, setLastRemoteSyncAt] = useState<string | null>(null);
  const [lastRemoteSyncDurationMs, setLastRemoteSyncDurationMs] = useState<number | null>(null);
  const [analyticsFetchAt, setAnalyticsFetchAt] = useState<string | null>(null);
  const [analyticsFetchDurationMs, setAnalyticsFetchDurationMs] = useState<number | null>(null);
  const [analyticsPostSuccessCount, setAnalyticsPostSuccessCount] = useState(0);
  const [analyticsPostFailureCount, setAnalyticsPostFailureCount] = useState(0);
  const [analyticsLastTransportAt, setAnalyticsLastTransportAt] = useState<string | null>(null);
  const [analyticsTransportHistory, setAnalyticsTransportHistory] = useState<AnalyticsTransportAttempt[]>([]);
  const [releaseReadinessHistory, setReleaseReadinessHistory] = useState<ReleaseReadinessSnapshot[]>([]);
  const [apiHealth, setApiHealth] = useState<ApiHealthPayload | null>(null);
  const [apiHealthLatencyMs, setApiHealthLatencyMs] = useState<number | null>(null);
  const [apiHealthCheckedAt, setApiHealthCheckedAt] = useState<string | null>(null);
  const analyticsSession = useMemo(() => getOrCreateAnalyticsSession(), []);
  const experimentContext = useMemo(() => getExperimentContext(), []);
  const viewedItemIds = useRef<Set<number>>(new Set());

  const customerVisibleItems = useMemo(
    () => marketplaceItems.filter((item) => item.isPublished && getItemStock(item) > 0),
    [marketplaceItems]
  );

  const storefrontItems = useMemo(() => {
    const query = shopQuery.trim().toLowerCase();
    const filtered = customerVisibleItems.filter((item) => {
      const matchesCategory = shopCategory === 'All' || classifyMarketplaceCategory(item) === shopCategory;
      if (!matchesCategory) return false;
      if (!query) return true;
      return [item.name, item.description, item.unit].join(' ').toLowerCase().includes(query);
    });

    const sorted = [...filtered];
    if (shopSort === 'price-low') {
      sorted.sort((a, b) => parsePriceValue(a.price) - parsePriceValue(b.price));
    } else if (shopSort === 'price-high') {
      sorted.sort((a, b) => parsePriceValue(b.price) - parsePriceValue(a.price));
    } else if (shopSort === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [customerVisibleItems, shopCategory, shopQuery, shopSort]);

  const storefrontCategories = useMemo(() => {
    const values = new Set<string>();
    customerVisibleItems.forEach((item) => values.add(classifyMarketplaceCategory(item)));
    return ['All', ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [customerVisibleItems]);

  const featuredStorefrontItems = useMemo(
    () => [...customerVisibleItems].sort((a, b) => getItemStock(b) - getItemStock(a)).slice(0, 3),
    [customerVisibleItems]
  );

  const userLocale = useMemo(() => (typeof navigator !== 'undefined' ? navigator.language : 'en-US'), []);
  const userCurrency = useMemo(() => inferCurrencyFromLocale(userLocale), [userLocale]);

  const lowStockCount = useMemo(
    () => customerVisibleItems.filter((item) => getItemStock(item) <= 5).length,
    [customerVisibleItems]
  );

  const weeklyConfirmedOrders = useMemo(() => {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return marketplaceOrders.filter((order) => {
      const createdAt = new Date(order.createdAt).getTime();
      return Number.isFinite(createdAt) && createdAt >= cutoff && order.status !== 'Cancelled';
    }).length;
  }, [marketplaceOrders]);

  const mostReorderedProduct = useMemo(() => {
    const quantities = new Map<string, number>();
    marketplaceOrders.forEach((order) => {
      order.lines.forEach((line) => {
        const current = quantities.get(line.name) || 0;
        quantities.set(line.name, current + line.quantity);
      });
    });
    const [top] = [...quantities.entries()].sort((a, b) => b[1] - a[1]);
    return top ? { name: top[0], quantity: top[1] } : null;
  }, [marketplaceOrders]);

  const averageProductPrice = useMemo(() => {
    if (customerVisibleItems.length === 0) return 0;
    const total = customerVisibleItems.reduce((sum, item) => sum + parsePriceValue(item.price), 0);
    return total / customerVisibleItems.length;
  }, [customerVisibleItems]);

  const adminCatalogItems = useMemo(() => {
    if (adminCatalogFilter === 'published') {
      return marketplaceItems.filter((item) => item.isPublished);
    }
    if (adminCatalogFilter === 'draft') {
      return marketplaceItems.filter((item) => !item.isPublished);
    }
    return marketplaceItems;
  }, [adminCatalogFilter, marketplaceItems]);

  const filteredAnalyticsEvents = useMemo(() => {
    const cutoff = Date.now() - (analyticsWindowDays * 24 * 60 * 60 * 1000);
    return analyticsEvents.filter((entry) => {
      const stamp = new Date(entry.at).getTime();
      return Number.isFinite(stamp) && stamp >= cutoff;
    });
  }, [analyticsEvents, analyticsWindowDays]);

  const previousWindowEvents = useMemo(() => {
    const windowMs = analyticsWindowDays * 24 * 60 * 60 * 1000;
    const end = Date.now() - windowMs;
    const start = end - windowMs;
    return analyticsEvents.filter((entry) => {
      const stamp = new Date(entry.at).getTime();
      return Number.isFinite(stamp) && stamp >= start && stamp < end;
    });
  }, [analyticsEvents, analyticsWindowDays]);

  const buildAnalyticsSummary = (events: CommerceAnalyticsEvent[]) => {
    const counts: Record<CommerceEventName, number> = {
      product_view: 0,
      add_to_cart: 0,
      checkout_click: 0,
      place_order_attempt: 0,
      place_order_success: 0
    };

    const viewedProducts = new Map<string, number>();
    const cartProducts = new Map<string, number>();
    const sourceBreakdown = new Map<string, { checkoutClicks: number; orderAttempts: number; orderSuccesses: number }>();
    const categoryViews = new Map<string, number>();
    const categoryAdds = new Map<string, number>();

    events.forEach((entry) => {
      if (!(entry.event in counts)) return;
      counts[entry.event] += 1;

      if (entry.event === 'product_view' && typeof entry.itemName === 'string') {
        viewedProducts.set(entry.itemName, (viewedProducts.get(entry.itemName) || 0) + 1);
      }

      if (entry.event === 'add_to_cart' && typeof entry.itemName === 'string') {
        cartProducts.set(entry.itemName, (cartProducts.get(entry.itemName) || 0) + 1);
      }

      if (typeof entry.category === 'string' && entry.category.trim()) {
        const key = entry.category.trim();
        if (entry.event === 'product_view') {
          categoryViews.set(key, (categoryViews.get(key) || 0) + 1);
        }
        if (entry.event === 'add_to_cart') {
          categoryAdds.set(key, (categoryAdds.get(key) || 0) + 1);
        }
      }

      if (typeof entry.source === 'string' && entry.source.trim()) {
        const source = entry.source.trim();
        const current = sourceBreakdown.get(source) || { checkoutClicks: 0, orderAttempts: 0, orderSuccesses: 0 };
        if (entry.event === 'checkout_click') current.checkoutClicks += 1;
        if (entry.event === 'place_order_attempt') current.orderAttempts += 1;
        if (entry.event === 'place_order_success') current.orderSuccesses += 1;
        sourceBreakdown.set(source, current);
      }
    });

    const viewToCartRate = counts.product_view > 0
      ? (counts.add_to_cart / counts.product_view) * 100
      : 0;
    const cartToCheckoutRate = counts.add_to_cart > 0
      ? (counts.checkout_click / counts.add_to_cart) * 100
      : 0;
    const checkoutToOrderRate = counts.checkout_click > 0
      ? (counts.place_order_success / counts.checkout_click) * 100
      : 0;

    const topViewed = [...viewedProducts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    const topCarted = [...cartProducts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    const sourceSegments = [...sourceBreakdown.entries()]
      .map(([source, values]) => ({
        source,
        ...values,
        checkoutToOrderRate: values.checkoutClicks > 0
          ? (values.orderSuccesses / values.checkoutClicks) * 100
          : 0
      }))
      .sort((a, b) => b.checkoutClicks - a.checkoutClicks)
      .slice(0, 5);

    const categoryConversion = [...categoryViews.entries()]
      .map(([category, views]) => {
        const adds = categoryAdds.get(category) || 0;
        return {
          category,
          views,
          adds,
          viewToCartRate: views > 0 ? (adds / views) * 100 : 0
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 6);

    const funnelDropOff = [
      {
        stage: 'Views to cart',
        from: counts.product_view,
        to: counts.add_to_cart
      },
      {
        stage: 'Cart to checkout',
        from: counts.add_to_cart,
        to: counts.checkout_click
      },
      {
        stage: 'Checkout to order',
        from: counts.checkout_click,
        to: counts.place_order_success
      }
    ].map((item) => ({
      ...item,
      dropOff: Math.max(0, item.from - item.to),
      dropOffRate: item.from > 0 ? ((item.from - item.to) / item.from) * 100 : 0
    }));

    return {
      counts,
      viewToCartRate,
      cartToCheckoutRate,
      checkoutToOrderRate,
      topViewed,
      topCarted,
      sourceSegments,
      categoryConversion,
      funnelDropOff
    };
  };

  const analyticsSummary = useMemo(() => buildAnalyticsSummary(filteredAnalyticsEvents), [filteredAnalyticsEvents]);
  const previousAnalyticsSummary = useMemo(() => buildAnalyticsSummary(previousWindowEvents), [previousWindowEvents]);

  const analyticsAnomalies = useMemo(() => {
    const flags: string[] = [];
    const checks = [
      {
        label: 'View to cart conversion',
        current: analyticsSummary.viewToCartRate,
        previous: previousAnalyticsSummary.viewToCartRate,
        minPrevious: 5,
        relativeDrop: 0.2
      },
      {
        label: 'Cart to checkout conversion',
        current: analyticsSummary.cartToCheckoutRate,
        previous: previousAnalyticsSummary.cartToCheckoutRate,
        minPrevious: 5,
        relativeDrop: 0.2
      },
      {
        label: 'Checkout to order conversion',
        current: analyticsSummary.checkoutToOrderRate,
        previous: previousAnalyticsSummary.checkoutToOrderRate,
        minPrevious: 5,
        relativeDrop: 0.2
      }
    ];

    checks.forEach((item) => {
      if (item.previous < item.minPrevious) return;
      if (item.current <= item.previous * (1 - item.relativeDrop)) {
        flags.push(`${item.label} dropped from ${formatPercent(item.previous)} to ${formatPercent(item.current)}.`);
      }
    });

    if (
      previousAnalyticsSummary.counts.place_order_success >= 5
      && analyticsSummary.counts.place_order_success <= Math.floor(previousAnalyticsSummary.counts.place_order_success * 0.7)
    ) {
      flags.push(
        `Order completions fell from ${previousAnalyticsSummary.counts.place_order_success} to ${analyticsSummary.counts.place_order_success} in the current window.`
      );
    }

    return flags;
  }, [analyticsSummary, previousAnalyticsSummary]);

  const analyticsEventsLast24h = useMemo(() => {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    return analyticsEvents.filter((entry) => {
      const stamp = new Date(entry.at).getTime();
      return Number.isFinite(stamp) && stamp >= cutoff;
    }).length;
  }, [analyticsEvents]);

  const analyticsTransportTotal = analyticsPostSuccessCount + analyticsPostFailureCount;
  const analyticsTransportErrorRate = analyticsTransportTotal > 0
    ? (analyticsPostFailureCount / analyticsTransportTotal) * 100
    : 0;

  const analyticsTransportLast24h = useMemo(() => {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    const recent = analyticsTransportHistory.filter((entry) => {
      const stamp = new Date(entry.at).getTime();
      return Number.isFinite(stamp) && stamp >= cutoff;
    });
    const total = recent.length;
    const failures = recent.filter((entry) => !entry.ok).length;
    return {
      total,
      failures,
      errorRate: total > 0 ? (failures / total) * 100 : 0
    };
  }, [analyticsTransportHistory]);

  const trendDays = analyticsWindowDays;
  const trendStart = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    start.setDate(start.getDate() - (trendDays - 1));
    return start;
  }, [trendDays]);

  const conversionTrend = useMemo(() => {
    const bucket = new Map<string, { checkout: number; order: number }>();
    for (let offset = 0; offset < trendDays; offset += 1) {
      const day = new Date(trendStart);
      day.setDate(trendStart.getDate() + offset);
      const key = day.toISOString().slice(0, 10);
      bucket.set(key, { checkout: 0, order: 0 });
    }

    analyticsEvents.forEach((entry) => {
      const stamp = new Date(entry.at);
      if (Number.isNaN(stamp.getTime()) || stamp < trendStart) return;
      const key = stamp.toISOString().slice(0, 10);
      const current = bucket.get(key);
      if (!current) return;
      if (entry.event === 'checkout_click') current.checkout += 1;
      if (entry.event === 'place_order_success') current.order += 1;
    });

    return Array.from(bucket.entries()).map(([key, value]) => ({
      key,
      label: key.slice(5),
      value: value.checkout > 0 ? (value.order / value.checkout) * 100 : 0
    }));
  }, [analyticsEvents, trendDays, trendStart]);

  const errorTrend = useMemo(() => {
    const bucket = new Map<string, { total: number; failed: number }>();
    for (let offset = 0; offset < trendDays; offset += 1) {
      const day = new Date(trendStart);
      day.setDate(trendStart.getDate() + offset);
      const key = day.toISOString().slice(0, 10);
      bucket.set(key, { total: 0, failed: 0 });
    }

    analyticsTransportHistory.forEach((entry) => {
      const stamp = new Date(entry.at);
      if (Number.isNaN(stamp.getTime()) || stamp < trendStart) return;
      const key = stamp.toISOString().slice(0, 10);
      const current = bucket.get(key);
      if (!current) return;
      current.total += 1;
      if (!entry.ok) current.failed += 1;
    });

    return Array.from(bucket.entries()).map(([key, value]) => ({
      key,
      label: key.slice(5),
      value: value.total > 0 ? (value.failed / value.total) * 100 : 0
    }));
  }, [analyticsTransportHistory, trendDays, trendStart]);

  const releaseReadinessChecks = useMemo(() => {
    const imageCoverage = marketplaceItems.length > 0
      ? (marketplaceItems.filter((item) => typeof item.imageUrl === 'string' && item.imageUrl.trim().length > 0).length / marketplaceItems.length) * 100
      : 0;

    const checks = [
      {
        label: 'Connectivity online',
        pass: !isOffline,
        detail: !isOffline ? 'Connected to remote API.' : 'Offline mode active.'
      },
      {
        label: 'Core API health check',
        pass: apiHealth?.status === 'ok' && apiHealthLatencyMs !== null && apiHealthLatencyMs <= 1500,
        detail: apiHealthLatencyMs !== null
          ? `${apiHealthLatencyMs} ms from /api/health.${apiHealth ? ` Uptime ${Math.floor(apiHealth.uptimeSeconds / 60)} min.` : ''}`
          : 'No /api/health check captured yet.'
      },
      {
        label: 'Analytics transport reliability',
        pass: analyticsTransportTotal > 0 ? analyticsTransportErrorRate <= 5 : true,
        detail: analyticsTransportTotal > 0
          ? `${analyticsPostFailureCount}/${analyticsTransportTotal} failed events (${formatPercent(analyticsTransportErrorRate)}).`
          : 'No transport attempts in this session yet.'
      },
      {
        label: 'Checkout conversion floor',
        pass: analyticsSummary.checkoutToOrderRate >= 1,
        detail: `Current checkout-to-order rate is ${formatPercent(analyticsSummary.checkoutToOrderRate)}.`
      },
      {
        label: 'Catalog image coverage',
        pass: imageCoverage >= 90,
        detail: `${formatPercent(imageCoverage)} of listed products have images.`
      },
      {
        label: 'No major conversion anomalies',
        pass: analyticsAnomalies.length === 0,
        detail: analyticsAnomalies.length === 0
          ? 'No anomaly flags in the selected analytics window.'
          : `${analyticsAnomalies.length} anomaly flag(s) need investigation.`
      }
    ];

    const passed = checks.filter((item) => item.pass).length;
    return {
      checks,
      passed,
      total: checks.length,
      imageCoverage
    };
  }, [
    analyticsAnomalies.length,
    analyticsPostFailureCount,
    analyticsSummary.checkoutToOrderRate,
    analyticsTransportErrorRate,
    analyticsTransportTotal,
    apiHealth,
    apiHealthLatencyMs,
    isOffline,
    lastRemoteSyncDurationMs,
    marketplaceItems
  ]);

  const releaseReadinessDelta = useMemo(() => {
    if (releaseReadinessHistory.length < 2) {
      return null;
    }
    const latest = releaseReadinessHistory[releaseReadinessHistory.length - 1];
    const previous = releaseReadinessHistory[releaseReadinessHistory.length - 2];
    return {
      score: latest.scorePercent - previous.scorePercent,
      conversion: latest.checkoutToOrderRate - previous.checkoutToOrderRate,
      errorRate: latest.transportErrorRate - previous.transportErrorRate
    };
  }, [releaseReadinessHistory]);

  function loadLocalAnalyticsEvents() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
      if (!raw) {
        setAnalyticsEvents([]);
        setAnalyticsSource('local');
        return;
      }
      const parsed = JSON.parse(raw) as CommerceAnalyticsEvent[];
      setAnalyticsEvents(Array.isArray(parsed) ? parsed : []);
      setAnalyticsSource('local');
    } catch {
      setAnalyticsEvents([]);
      setAnalyticsSource('local');
    }
  }

  async function hydrateAnalyticsEvents() {
    loadLocalAnalyticsEvents();

    if (!navigator.onLine) return;

    try {
      const startedAt = performance.now();
      const response = await fetch('/api/analytics/events');
      if (!response.ok) return;
      const payload = await response.json() as CommerceAnalyticsEvent[];
      if (!Array.isArray(payload) || payload.length === 0) return;
      const trimmed = payload.slice(-MAX_ANALYTICS_EVENTS);
      setAnalyticsEvents(trimmed);
      setAnalyticsSource('remote');
      saveLocal(ANALYTICS_STORAGE_KEY, trimmed);
      setAnalyticsFetchAt(new Date().toISOString());
      setAnalyticsFetchDurationMs(Math.round(performance.now() - startedAt));
    } catch {
      // Local analytics remains available even if remote endpoint is not configured.
    }
  }

  async function hydrateApiHealth() {
    if (!navigator.onLine) return;

    try {
      const startedAt = performance.now();
      const response = await fetch('/api/health');
      if (!response.ok) return;
      const payload = await response.json() as ApiHealthPayload;
      setApiHealth(payload);
      setApiHealthLatencyMs(Math.round(performance.now() - startedAt));
      setApiHealthCheckedAt(new Date().toISOString());
    } catch {
      // Keep dashboard resilient when health endpoint is unavailable.
    }
  }

  async function clearAnalyticsData() {
    if (!window.confirm('Clear all analytics events? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/analytics/events', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Unable to clear analytics events.');
      }
      localStorage.removeItem(ANALYTICS_STORAGE_KEY);
      setAnalyticsEvents([]);
      setAnalyticsSource('remote');
      setSyncMessage('Analytics events cleared successfully.');
    } catch {
      setError('Failed to clear analytics events.');
    }
  }

  function exportAnalyticsCsv() {
    const escapeCsv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const rows: string[] = [];

    const appendRow = (values: Array<string | number>) => {
      rows.push(values.map(escapeCsv).join(','));
    };

    appendRow(['window_days', analyticsWindowDays]);
    appendRow(['source', analyticsSource]);
    appendRow(['events_in_window', filteredAnalyticsEvents.length]);
    appendRow(['metric', 'value']);
    appendRow(['product_views', analyticsSummary.counts.product_view]);
    appendRow(['add_to_cart', analyticsSummary.counts.add_to_cart]);
    appendRow(['checkout_clicks', analyticsSummary.counts.checkout_click]);
    appendRow(['order_success', analyticsSummary.counts.place_order_success]);
    appendRow(['view_to_cart_rate', formatPercent(analyticsSummary.viewToCartRate)]);
    appendRow(['cart_to_checkout_rate', formatPercent(analyticsSummary.cartToCheckoutRate)]);
    appendRow(['checkout_to_order_rate', formatPercent(analyticsSummary.checkoutToOrderRate)]);

    appendRow(['', '']);
    appendRow(['source_segment', 'checkout_clicks', 'order_attempts', 'order_successes', 'checkout_to_order_rate']);
    analyticsSummary.sourceSegments.forEach((segment) => {
      appendRow([
        segment.source,
        segment.checkoutClicks,
        segment.orderAttempts,
        segment.orderSuccesses,
        formatPercent(segment.checkoutToOrderRate)
      ]);
    });

    appendRow(['', '']);
    appendRow(['category', 'views', 'add_to_cart', 'view_to_cart_rate']);
    analyticsSummary.categoryConversion.forEach((category) => {
      appendRow([
        category.category,
        category.views,
        category.adds,
        formatPercent(category.viewToCartRate)
      ]);
    });

    appendRow(['', '']);
    appendRow(['funnel_stage', 'from', 'to', 'drop_off', 'drop_off_rate']);
    analyticsSummary.funnelDropOff.forEach((item) => {
      appendRow([
        item.stage,
        item.from,
        item.to,
        item.dropOff,
        formatPercent(item.dropOffRate)
      ]);
    });

    const fileName = `herdflow-analytics-${analyticsWindowDays}d-${new Date().toISOString().slice(0, 10)}.csv`;
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setSyncMessage(`Analytics CSV exported: ${fileName}`);
  }

  function exportReleaseReadinessHistoryCsv() {
    if (releaseReadinessHistory.length === 0) {
      setSyncMessage('No release readiness snapshots to export yet.');
      return;
    }

    const escapeCsv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const rows: string[] = [];
    const appendRow = (values: Array<string | number>) => {
      rows.push(values.map(escapeCsv).join(','));
    };

    appendRow([
      'captured_at',
      'window_days',
      'checks_passed',
      'checks_total',
      'score_percent',
      'checkout_to_order_rate',
      'transport_error_rate',
      'api_latency_ms',
      'anomaly_count'
    ]);

    releaseReadinessHistory.forEach((snapshot) => {
      appendRow([
        snapshot.at,
        snapshot.windowDays,
        snapshot.passed,
        snapshot.total,
        snapshot.scorePercent.toFixed(1),
        snapshot.checkoutToOrderRate.toFixed(1),
        snapshot.transportErrorRate.toFixed(1),
        snapshot.apiLatencyMs ?? '',
        snapshot.anomalyCount
      ]);
    });

    const fileName = `herdflow-release-readiness-history-${new Date().toISOString().slice(0, 10)}.csv`;
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setSyncMessage(`Release readiness history exported: ${fileName}`);
  }

  function formatPercent(value: number) {
    return `${value.toFixed(1)}%`;
  }

  function formatDateTime(value: string) {
    return new Date(value).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatDelta(value: number) {
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${value.toFixed(1)} pts`;
  }

  function formatMsDelta(value: number) {
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${Math.round(value)} ms`;
  }

  function buildSparklinePath(values: number[], width = 220, height = 52) {
    if (values.length === 0) return '';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const step = values.length > 1 ? width / (values.length - 1) : width;
    return values
      .map((value, index) => {
        const x = index * step;
        const y = height - ((value - min) / range) * height;
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }

  function pushTransportAttempt(ok: boolean) {
    const attempt: AnalyticsTransportAttempt = { at: new Date().toISOString(), ok };
    setAnalyticsTransportHistory((current) => {
      const next = [...current.slice(-499), attempt];
      saveLocal(ANALYTICS_TRANSPORT_HISTORY_KEY, next);
      return next;
    });
  }

  function loadOperationalHistory() {
    if (typeof window === 'undefined') return;
    try {
      const transportRaw = localStorage.getItem(ANALYTICS_TRANSPORT_HISTORY_KEY);
      const transport = transportRaw ? JSON.parse(transportRaw) as AnalyticsTransportAttempt[] : [];
      setAnalyticsTransportHistory(Array.isArray(transport) ? transport : []);
    } catch {
      setAnalyticsTransportHistory([]);
    }

    try {
      const releaseRaw = localStorage.getItem(RELEASE_READINESS_HISTORY_KEY);
      const release = releaseRaw ? JSON.parse(releaseRaw) as ReleaseReadinessSnapshot[] : [];
      setReleaseReadinessHistory(Array.isArray(release) ? release : []);
    } catch {
      setReleaseReadinessHistory([]);
    }
  }

  function getCampColor(campId: number | null) {
    const camp = camps.find((item) => item.id === campId);
    return camp ? camp.colorId : '#94a3b8';
  }

  function getCampName(campId: number | null) {
    return camps.find((item) => item.id === campId)?.name || 'Unassigned';
  }

  function getCattleLabel(cattleId: number) {
    const animal = cattle.find((item) => item.id === cattleId);
    return animal ? `${animal.tag} (${animal.breed})` : 'Unknown animal';
  }

  function handleFieldChange<K extends keyof typeof initialCattleForm>(key: K, value: typeof initialCattleForm[K]) {
    setCattleForm((current) => ({ ...current, [key]: value }));
  }

  function handleCampField<K extends keyof typeof initialCampForm>(key: K, value: typeof initialCampForm[K]) {
    setCampForm((current) => ({ ...current, [key]: value }));
  }

  function handleVaccineField<K extends keyof typeof initialVaccineForm>(key: K, value: typeof initialVaccineForm[K]) {
    setVaccineForm((current) => ({ ...current, [key]: value }));
  }

  function handleCountField<K extends keyof typeof initialCountForm>(key: K, value: typeof initialCountForm[K]) {
    setCountForm((current) => ({ ...current, [key]: value }));
  }

  function resetCattleForm() {
    setCattleForm(initialCattleForm);
    setEditingCattleId(null);
    setError(null);
  }

  function resetCampForm() {
    setCampForm(initialCampForm);
    setEditingCampId(null);
    setError(null);
  }

  function resetVaccineForm() {
    setVaccineForm(initialVaccineForm);
    setEditingVaccineId(null);
    setError(null);
  }

  function resetCountForm() {
    setCountForm(initialCountForm);
    setError(null);
  }

  function resetMarketplaceForm() {
    setMarketplaceForm(initialMarketplaceForm);
    setEditingMarketplaceId(null);
    setError(null);
  }

  function resetRegistrationForm() {
    setRegistrationForm(initialRegistrationForm);
    setError(null);
  }

  function resetCustomerForm() {
    setCustomerForm(initialCustomerForm);
    setError(null);
  }

  const backupInputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const summary = useMemo(() => {
    const total = cattle.length;
    const active = cattle.filter((item) => item.status === 'Active').length;
    const sold = cattle.filter((item) => item.status === 'Sold').length;
    const quarantined = cattle.filter((item) => item.status === 'Quarantined').length;
    const veterinary = cattle.filter((item) => item.status === 'Veterinary').length;
    const latestCount = counts[0];
    return {
      total,
      active,
      sold,
      quarantined,
      veterinary,
      latestCount
    };
  }, [cattle, counts]);

  function saveLocal(key: string, value: unknown) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function buildRecordId() {
    return Date.now();
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function normalizeMarketplaceItem(item: MarketplaceItem): MarketplaceItem {
    const isPublished = typeof item.isPublished === 'boolean' ? item.isPublished : true;
    return {
      ...item,
      stock: Number.isFinite(Number(item.stock)) ? Math.max(0, Number(item.stock)) : 0,
      isPublished,
      publishedAt: isPublished ? (item.publishedAt || item.createdAt) : null
    };
  }

  function parsePriceValue(price: string) {
    const match = price.match(/[0-9]+(?:\.[0-9]+)?/);
    return match ? Number(match[0]) : 0;
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat(userLocale, {
      style: 'currency',
      currency: userCurrency,
      maximumFractionDigits: 2
    }).format(value);
  }

  function trackCommerceEvent(event: CommerceEventName, payload: Record<string, unknown> = {}) {
    if (typeof window === 'undefined') return;

    const entry = {
      event,
      at: new Date().toISOString(),
      path: window.location.pathname,
      session: analyticsSession,
      experiment: experimentContext.experiment,
      variant: experimentContext.variant,
      ...payload
    };

    try {
      const existing = localStorage.getItem(ANALYTICS_STORAGE_KEY);
      const rows = existing ? JSON.parse(existing) as Array<Record<string, unknown>> : [];
      const nextRows = [...rows.slice(-(MAX_ANALYTICS_EVENTS - 1)), entry];
      localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(nextRows));
      setAnalyticsEvents(nextRows as CommerceAnalyticsEvent[]);
      setAnalyticsSource('local');
    } catch {
      // Keep commerce flow resilient if analytics persistence fails.
    }

    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push(entry);
    }

    void fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
      keepalive: true
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Analytics event transport failed.');
        }
        setAnalyticsPostSuccessCount((current) => current + 1);
        setAnalyticsLastTransportAt(new Date().toISOString());
        pushTransportAttempt(true);
      })
      .catch(() => {
        setAnalyticsPostFailureCount((current) => current + 1);
        pushTransportAttempt(false);
      });
  }

  function getCartItemCount(entries: Array<{ itemId: number; quantity: number }>) {
    return entries.reduce((sum, line) => sum + line.quantity, 0);
  }

  function getCartTotalFromEntries(entries: Array<{ itemId: number; quantity: number }>) {
    return entries.reduce((sum, line) => {
      const item = marketplaceItems.find((candidate) => candidate.id === line.itemId);
      if (!item) return sum;
      return sum + (parsePriceValue(item.price) * line.quantity);
    }, 0);
  }

  function trackCheckoutClick(source: string) {
    trackCommerceEvent('checkout_click', {
      source,
      cartItems: getCartItemCount(cartItems),
      cartValue: Number(cartDetails.total.toFixed(2))
    });
  }

  function getItemStock(item: MarketplaceItem) {
    return Number.isFinite(Number(item.stock)) ? Math.max(0, Number(item.stock)) : 0;
  }

  function renderMarketplaceImage(name: string, imageUrl?: string, className = 'marketplace-image') {
    const source = imageUrl?.trim() || MARKETPLACE_PLACEHOLDER_IMAGE;
    return (
      <img
        src={source}
        alt={`${name} product image`}
        className={className}
        loading="lazy"
        decoding="async"
        sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
        onError={(event) => {
          const target = event.currentTarget;
          if (target.dataset.fallbackApplied === 'true') return;
          target.dataset.fallbackApplied = 'true';
          target.src = MARKETPLACE_PLACEHOLDER_IMAGE;
        }}
      />
    );
  }

  const cartDetails = useMemo(() => {
    const lines = cartItems
      .map((entry) => {
        const item = marketplaceItems.find((candidate) => candidate.id === entry.itemId);
        if (!item) return null;
        const unitPrice = parsePriceValue(item.price);
        return {
          item,
          quantity: entry.quantity,
          lineTotal: unitPrice * entry.quantity
        };
      })
      .filter((entry): entry is { item: MarketplaceItem; quantity: number; lineTotal: number } => Boolean(entry));

    const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    return { lines, total };
  }, [cartItems, marketplaceItems]);

  function addItemToCart(item: MarketplaceItem) {
    const stock = getItemStock(item);
    if (stock <= 0) {
      setSyncMessage(`${item.name} is out of stock.`);
      return;
    }

    const currentQty = cartItems.find((entry) => entry.itemId === item.id)?.quantity || 0;
    if (currentQty >= stock) {
      setSyncMessage(`Only ${stock} units available for ${item.name}.`);
      return;
    }

    const updated = cartItems.some((entry) => entry.itemId === item.id)
      ? cartItems.map((entry) => (entry.itemId === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry))
      : [{ itemId: item.id, quantity: 1 }, ...cartItems];
    setCartItems(updated);
    saveLocal('herdflow:marketplace-cart', updated);
    trackCommerceEvent('add_to_cart', {
      itemId: item.id,
      itemName: item.name,
      unitPrice: parsePriceValue(item.price),
      currency: userCurrency,
      cartItems: getCartItemCount(updated),
      cartValue: Number(getCartTotalFromEntries(updated).toFixed(2))
    });
    setSyncMessage(`${item.name} added to cart.`);
  }

  function updateCartItemQuantity(itemId: number, quantity: number) {
    if (quantity <= 0) {
      removeItemFromCart(itemId);
      return;
    }
    const item = marketplaceItems.find((entry) => entry.id === itemId);
    if (item && quantity > getItemStock(item)) {
      setSyncMessage(`Only ${getItemStock(item)} units available for ${item.name}.`);
      return;
    }
    const updated = cartItems.map((entry) => (entry.itemId === itemId ? { ...entry, quantity } : entry));
    setCartItems(updated);
    saveLocal('herdflow:marketplace-cart', updated);
  }

  function removeItemFromCart(itemId: number) {
    const updated = cartItems.filter((entry) => entry.itemId !== itemId);
    setCartItems(updated);
    saveLocal('herdflow:marketplace-cart', updated);
  }

  function resetCheckoutForm() {
    setCheckoutForm(initialCheckoutForm);
  }

  async function submitMarketplaceOrder(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!checkoutForm.customerName || !checkoutForm.customerEmail || !checkoutForm.customerPhone || !checkoutForm.deliveryAddress) {
      setError('Customer name, email, phone, and delivery address are required.');
      return;
    }

    if (cartDetails.lines.length === 0) {
      setError('Add at least one item to the cart before checkout.');
      return;
    }

    trackCommerceEvent('place_order_attempt', {
      lineCount: cartDetails.lines.length,
      cartItems: getCartItemCount(cartItems),
      cartValue: Number(cartDetails.total.toFixed(2)),
      paymentMethod: checkoutForm.paymentMethod,
      currency: userCurrency
    });

    const localOrder: MarketplaceOrder = {
      id: buildRecordId(),
      orderNumber: `LOCAL-${buildRecordId()}`,
      createdAt: new Date().toISOString(),
      status: 'Pending',
      customerName: checkoutForm.customerName,
      customerEmail: checkoutForm.customerEmail,
      customerPhone: checkoutForm.customerPhone,
      deliveryAddress: checkoutForm.deliveryAddress,
      notes: checkoutForm.notes,
      paymentMethod: checkoutForm.paymentMethod,
      paymentStatus: checkoutForm.paymentMethod === 'PayOnDelivery' ? 'Pending' : 'Initiated',
      paymentReference: '',
      lines: cartDetails.lines.map((line) => ({
        itemId: line.item.id,
        name: line.item.name,
        price: line.item.price,
        unit: line.item.unit,
        quantity: line.quantity,
        imageUrl: line.item.imageUrl || ''
      })),
      totalAmount: formatCurrency(cartDetails.total)
    };

    const updatedOrders = [localOrder, ...marketplaceOrders];
    setMarketplaceOrders(updatedOrders);
    saveLocal('herdflow:marketplace-orders', updatedOrders);
    setCartItems([]);
    saveLocal('herdflow:marketplace-cart', []);
    resetCheckoutForm();
    trackCommerceEvent('place_order_success', {
      orderNumber: localOrder.orderNumber,
      lineCount: localOrder.lines.length,
      totalAmount: localOrder.totalAmount,
      paymentMethod: localOrder.paymentMethod,
      paymentStatus: localOrder.paymentStatus
    });

    if (!isOffline) {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: localOrder.customerName,
            customerEmail: localOrder.customerEmail,
            customerPhone: localOrder.customerPhone,
            deliveryAddress: localOrder.deliveryAddress,
            notes: localOrder.notes,
            paymentMethod: localOrder.paymentMethod,
            lines: localOrder.lines,
            totalAmount: localOrder.totalAmount
          })
        });

        if (!response.ok) {
          throw new Error('Unable to submit order.');
        }

        const createdOrder = await response.json() as MarketplaceOrder;
        setLastOrderNumber(createdOrder.orderNumber);

        if (createdOrder.paymentMethod !== 'PayOnDelivery') {
          const checkoutResponse = await fetch('/api/payments/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: createdOrder.id, method: createdOrder.paymentMethod })
          });
          if (checkoutResponse.ok) {
            const checkoutData = await checkoutResponse.json() as { checkoutUrl?: string };
            if (checkoutData.checkoutUrl) {
              window.open(checkoutData.checkoutUrl, '_blank', 'noopener,noreferrer');
            }
          }
        }

        await fetchRemoteData();
        setSyncMessage(`Order submitted successfully. Confirmation: ${createdOrder.orderNumber}`);
      } catch {
        setSyncMessage('Order saved locally. Remote sync failed.');
      }
    } else {
      setSyncMessage('Order saved locally. It will sync when you are back online.');
    }
  }

  async function trackMarketplaceOrder(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setTrackingResult(null);

    if (!trackingLookup.orderNumber || !trackingLookup.email) {
      setError('Order number and email are required for tracking.');
      return;
    }

    try {
      const response = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(trackingLookup.orderNumber)}&email=${encodeURIComponent(trackingLookup.email)}`);
      if (!response.ok) {
        throw new Error('Order not found.');
      }
      const order = await response.json() as MarketplaceOrder;
      setTrackingResult(order);
      setSyncMessage(`Tracking loaded for ${order.orderNumber}.`);
    } catch {
      setError('Order not found. Please check your order number and email.');
    }
  }

  async function updateMarketplaceOrder(order: MarketplaceOrder, status: MarketplaceOrder['status']) {
    const updatedLocal = marketplaceOrders.map((entry) => (entry.id === order.id ? { ...entry, status } : entry));
    setMarketplaceOrders(updatedLocal);
    saveLocal('herdflow:marketplace-orders', updatedLocal);

    if (!isOffline) {
      try {
        await fetch(`/api/orders/${order.id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
        fetchRemoteData();
      } catch {
        setSyncMessage('Order status updated locally. Remote sync failed.');
      }
    }
  }

  function loadLocalData() {
    const localCattle = localStorage.getItem('herdflow:cattle');
    const localCamps = localStorage.getItem('herdflow:camps');
    const localVaccines = localStorage.getItem('herdflow:vaccines');
    const localCounts = localStorage.getItem('herdflow:counts');
    const localMarketplace = localStorage.getItem('herdflow:marketplace');
    const localRegistrations = localStorage.getItem('herdflow:marketplace-registrations');
    const localCustomerSignups = localStorage.getItem('herdflow:customer-signups');
    const localOrders = localStorage.getItem('herdflow:marketplace-orders');
    const localCart = localStorage.getItem('herdflow:marketplace-cart');

    if (localCattle) setCattle(JSON.parse(localCattle));
    if (localCamps) setCamps(JSON.parse(localCamps));
    if (localVaccines) setVaccines(JSON.parse(localVaccines));
    if (localCounts) setCounts(JSON.parse(localCounts));
    if (localMarketplace) {
      const parsed = JSON.parse(localMarketplace) as MarketplaceItem[];
      setMarketplaceItems(Array.isArray(parsed) ? parsed.map(normalizeMarketplaceItem) : []);
    }
    if (localRegistrations) setMarketplaceRegistrations(JSON.parse(localRegistrations));
    if (localCustomerSignups) setCustomerSignups(JSON.parse(localCustomerSignups));
    if (localOrders) setMarketplaceOrders(JSON.parse(localOrders));
    if (localCart) setCartItems(JSON.parse(localCart));
  }

  async function fetchRemoteData() {
    if (!navigator.onLine) {
      setIsOffline(true);
      setSyncMessage('Offline mode: working from saved data.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const startedAt = performance.now();
    try {
      let usedPublicMarketplaceFallback = false;
      const fetchMarketplaceItemsForContext = async () => {
        if (!isOperationsPage) {
          const response = await fetch('/api/marketplace/items');
          if (!response.ok) {
            throw new Error('Unable to load marketplace items.');
          }
          return response.json();
        }

        const adminResponse = await fetch('/api/admin/marketplace/items', {
          headers: ADMIN_API_KEY ? { 'x-herdflow-admin-key': ADMIN_API_KEY } : undefined
        });

        if (adminResponse.ok) {
          return adminResponse.json();
        }

        const publicResponse = await fetch('/api/marketplace/items');
        if (!publicResponse.ok) {
          throw new Error('Unable to load marketplace items.');
        }

        usedPublicMarketplaceFallback = true;
        return publicResponse.json();
      };

      const [cattleData, campsData, vaccinesData, countsData, marketplaceData, registrationData, customerSignupData, orderData] = await Promise.all([
        fetch('/api/cattle').then((res) => res.json()),
        fetch('/api/camps').then((res) => res.json()),
        fetch('/api/vaccines').then((res) => res.json()),
        fetch('/api/counts').then((res) => res.json()),
        fetchMarketplaceItemsForContext(),
        fetch('/api/marketplace/registrations').then((res) => res.json()),
        fetch('/api/customer-signups').then((res) => res.json()),
        fetch('/api/orders').then((res) => res.json())
      ]);

      setCattle(cattleData);
      setCamps(campsData);
      setVaccines(vaccinesData);
      setCounts(countsData);
      setMarketplaceItems((marketplaceData as MarketplaceItem[]).map(normalizeMarketplaceItem));
      setMarketplaceRegistrations(registrationData);
      setCustomerSignups(customerSignupData);
      setMarketplaceOrders(orderData);
      saveLocal('herdflow:cattle', cattleData);
      saveLocal('herdflow:camps', campsData);
      saveLocal('herdflow:vaccines', vaccinesData);
      saveLocal('herdflow:counts', countsData);
      saveLocal('herdflow:marketplace', (marketplaceData as MarketplaceItem[]).map(normalizeMarketplaceItem));
      saveLocal('herdflow:marketplace-registrations', registrationData);
      saveLocal('herdflow:customer-signups', customerSignupData);
      saveLocal('herdflow:marketplace-orders', orderData);
      setIsOffline(false);
      setLastRemoteSyncAt(new Date().toISOString());
      setLastRemoteSyncDurationMs(Math.round(performance.now() - startedAt));
      void hydrateApiHealth();
      if (usedPublicMarketplaceFallback) {
        setSyncMessage('Connected: remote data loaded. Draft catalog is hidden until VITE_ADMIN_API_KEY is configured.');
      } else {
        setSyncMessage('Connected: remote data loaded.');
      }
    } catch {
      setIsOffline(true);
      setSyncMessage('Unable to reach server. Using offline data.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadLocalData();
    loadOperationalHistory();
    void fetchRemoteData();
    void hydrateAnalyticsEvents();
    void hydrateApiHealth();
  }, []);

  useEffect(() => {
    const success = analyticsTransportHistory.filter((entry) => entry.ok).length;
    const failed = analyticsTransportHistory.length - success;
    setAnalyticsPostSuccessCount(success);
    setAnalyticsPostFailureCount(failed);
    setAnalyticsLastTransportAt(analyticsTransportHistory.length > 0 ? analyticsTransportHistory[analyticsTransportHistory.length - 1].at : null);
  }, [analyticsTransportHistory]);

  useEffect(() => {
    if (releaseReadinessChecks.total === 0) return;

    const next: ReleaseReadinessSnapshot = {
      at: new Date().toISOString(),
      windowDays: analyticsWindowDays,
      passed: releaseReadinessChecks.passed,
      total: releaseReadinessChecks.total,
      scorePercent: releaseReadinessChecks.total > 0
        ? (releaseReadinessChecks.passed / releaseReadinessChecks.total) * 100
        : 0,
      checkoutToOrderRate: analyticsSummary.checkoutToOrderRate,
      transportErrorRate: analyticsTransportLast24h.errorRate,
      apiLatencyMs: apiHealthLatencyMs,
      anomalyCount: analyticsAnomalies.length
    };

    setReleaseReadinessHistory((current) => {
      const previous = current[current.length - 1];
      if (previous) {
        const previousAt = new Date(previous.at).getTime();
        const nowAt = new Date(next.at).getTime();
        const tooSoon = Number.isFinite(previousAt) && nowAt - previousAt < 10 * 60 * 1000;
        const unchanged = previous.passed === next.passed
          && previous.total === next.total
          && previous.windowDays === next.windowDays
          && Math.abs(previous.checkoutToOrderRate - next.checkoutToOrderRate) < 0.1
          && Math.abs(previous.transportErrorRate - next.transportErrorRate) < 0.1
          && previous.anomalyCount === next.anomalyCount
          && previous.apiLatencyMs === next.apiLatencyMs;
        if (tooSoon && unchanged) {
          return current;
        }
      }

      const updated = [...current.slice(-59), next];
      saveLocal(RELEASE_READINESS_HISTORY_KEY, updated);
      return updated;
    });
  }, [
    analyticsAnomalies.length,
    analyticsSummary.checkoutToOrderRate,
    analyticsTransportLast24h.errorRate,
    analyticsWindowDays,
    apiHealthLatencyMs,
    releaseReadinessChecks.passed,
    releaseReadinessChecks.total
  ]);

  useEffect(() => {
    const sectionLabel = section === 'dashboard'
      ? 'Business Suite'
      : section.charAt(0).toUpperCase() + section.slice(1);
    document.title = isHomePage
      ? 'HerdFlow | Livestock Marketplace Website'
      : isTrackingPage
        ? 'HerdFlow Order Tracking'
      : isMarketplacePage
        ? 'HerdFlow Marketplace'
        : `HerdFlow | ${sectionLabel}`;

    const metaDescription = isHomePage
      ? 'HerdFlow is an international livestock commerce platform combining marketplace sales, partner onboarding, and herd operations in one business suite.'
      : isMarketplacePage
        ? 'Shop HerdFlow Marketplace for feed, health products, and ranch essentials with enterprise-grade checkout and order tracking.'
      : isTrackingPage
        ? 'Track your HerdFlow order status in real time using your confirmation number and email.'
        : 'Manage HerdFlow livestock operations, marketplace administration, and partner workflows from one command center.';

    const canonicalPath = isHomePage
      ? '/'
      : isMarketplacePage
        ? MARKETPLACE_PATH
        : isTrackingPage
          ? TRACKING_PATH
          : OPERATIONS_PATH;

    const upsertMeta = (key: 'name' | 'property', value: string, content: string) => {
      let tag = document.head.querySelector(`meta[${key}="${value}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(key, value);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${SITE_URL.replace(/\/+$/, '')}${canonicalPath}`);

    upsertMeta('name', 'description', metaDescription);
    upsertMeta('property', 'og:title', document.title);
    upsertMeta('property', 'og:description', metaDescription);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:url', `${SITE_URL.replace(/\/+$/, '')}${canonicalPath}`);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', document.title);
    upsertMeta('name', 'twitter:description', metaDescription);
  }, [isHomePage, isMarketplacePage, isTrackingPage, section]);

  useEffect(() => {
    if (!isMarketplacePage || storefrontItems.length === 0) return;

    const unseen = storefrontItems.filter((item) => !viewedItemIds.current.has(item.id)).slice(0, 8);
    unseen.forEach((item, index) => {
      viewedItemIds.current.add(item.id);
      trackCommerceEvent('product_view', {
        itemId: item.id,
        itemName: item.name,
        category: classifyMarketplaceCategory(item),
        unitPrice: parsePriceValue(item.price),
        currency: userCurrency,
        listPosition: index + 1
      });
    });
  }, [isMarketplacePage, storefrontItems, userCurrency]);

  async function exportBackup() {
    try {
      const response = await fetch('/api/backup/export');
      if (!response.ok) {
        throw new Error('Could not export backup.');
      }

      const backup = await response.json();
      const fileName = `herdflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setSyncMessage('Backup exported successfully.');
    } catch {
      setSyncMessage('Backup export failed.');
    }
  }

  async function importBackupFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const response = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Invalid backup file.' }));
        throw new Error(body.error || 'Invalid backup file.');
      }

      await fetchRemoteData();
      setSyncMessage('Backup imported successfully.');
    } catch {
      setSyncMessage('Backup import failed. Check that this file is a HerdFlow backup.');
    } finally {
      event.target.value = '';
    }
  }

  function openBackupPicker() {
    backupInputRef.current?.click();
  }

  async function saveCattle(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!cattleForm.tag || !cattleForm.breed || !cattleForm.birthDate || !cattleForm.weight) {
      setError('Tag, breed, birth date, and weight are required.');
      return;
    }

    const localRecord: CattleRecord = {
      id: editingCattleId || buildRecordId(),
      createdAt: new Date().toISOString(),
      ...cattleForm
    };

    const updatedRecords = editingCattleId
      ? cattle.map((item) => (item.id === editingCattleId ? localRecord : item))
      : [localRecord, ...cattle];

    setCattle(updatedRecords);
    saveLocal('herdflow:cattle', updatedRecords);
    resetCattleForm();

    if (!isOffline) {
      try {
        const url = editingCattleId ? `/api/cattle/${editingCattleId}` : '/api/cattle';
        const method = editingCattleId ? 'PUT' : 'POST';
        await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cattleForm)
        });
        fetchRemoteData();
      } catch {
        setSyncMessage('Saved locally. Remote sync failed.');
      }
    }
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
      note: record.note
    });
    setSection('cattle');
  }

  async function removeCattle(record: CattleRecord) {
    if (!window.confirm(`Delete ${record.tag} permanently?`)) return;

    const updated = cattle.filter((item) => item.id !== record.id);
    setCattle(updated);
    saveLocal('herdflow:cattle', updated);

    if (!isOffline) {
      try {
        await fetch(`/api/cattle/${record.id}`, { method: 'DELETE' });
        fetchRemoteData();
      } catch {
        setSyncMessage('Removed locally. Remote delete may be pending.');
      }
    }
  }

  async function saveCamp(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!campForm.name) {
      setError('Camp name is required.');
      return;
    }

    const localCamp: Camp = {
      id: editingCampId || buildRecordId(),
      createdAt: new Date().toISOString(),
      ...campForm
    };
    const updated = editingCampId ? camps.map((item) => (item.id === editingCampId ? localCamp : item)) : [localCamp, ...camps];
    setCamps(updated);
    saveLocal('herdflow:camps', updated);
    resetCampForm();

    if (!isOffline) {
      const url = editingCampId ? `/api/camps/${editingCampId}` : '/api/camps';
      const method = editingCampId ? 'PUT' : 'POST';
      try {
        await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(campForm)
        });
        fetchRemoteData();
      } catch {
        setSyncMessage('Camp saved locally. Remote sync failed.');
      }
    }
  }

  function editCamp(camp: Camp) {
    setEditingCampId(camp.id);
    setCampForm({ name: camp.name, colorId: camp.colorId, description: camp.description });
    setSection('camps');
  }

  async function removeCamp(camp: Camp) {
    if (!window.confirm(`Delete camp ${camp.name}?`)) return;

    const updated = camps.filter((item) => item.id !== camp.id);
    setCamps(updated);
    saveLocal('herdflow:camps', updated);

    const reassigned = cattle.map((item) => (item.campId === camp.id ? { ...item, campId: null } : item));
    setCattle(reassigned);
    saveLocal('herdflow:cattle', reassigned);

    if (!isOffline) {
      try {
        await fetch(`/api/camps/${camp.id}`, { method: 'DELETE' });
        fetchRemoteData();
      } catch {
        setSyncMessage('Camp removed locally. Remote delete may be pending.');
      }
    }
  }

  async function saveVaccine(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!vaccineForm.cattleId || !vaccineForm.vaccineName || !vaccineForm.scheduledDate) {
      setError('Cattle, vaccine name, and scheduled date are required.');
      return;
    }

    const localVaccine: VaccineRecord = {
      id: editingVaccineId || buildRecordId(),
      createdAt: new Date().toISOString(),
      ...vaccineForm,
      cattleId: vaccineForm.cattleId
    };
    const updated = editingVaccineId ? vaccines.map((item) => (item.id === editingVaccineId ? localVaccine : item)) : [localVaccine, ...vaccines];
    setVaccines(updated);
    saveLocal('herdflow:vaccines', updated);
    resetVaccineForm();

    if (!isOffline) {
      const url = editingVaccineId ? `/api/vaccines/${editingVaccineId}` : '/api/vaccines';
      const method = editingVaccineId ? 'PUT' : 'POST';
      try {
        await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cattleId: vaccineForm.cattleId,
            vaccineName: vaccineForm.vaccineName,
            scheduledDate: vaccineForm.scheduledDate,
            givenDate: vaccineForm.givenDate || null,
            note: vaccineForm.note
          })
        });
        fetchRemoteData();
      } catch {
        setSyncMessage('Vaccine schedule saved locally. Remote sync failed.');
      }
    }
  }

  function editVaccine(vaccine: VaccineRecord) {
    setEditingVaccineId(vaccine.id);
    setVaccineForm({
      cattleId: vaccine.cattleId,
      vaccineName: vaccine.vaccineName,
      scheduledDate: vaccine.scheduledDate,
      givenDate: vaccine.givenDate,
      note: vaccine.note
    });
    setSection('vaccines');
  }

  async function removeVaccine(vaccine: VaccineRecord) {
    if (!window.confirm(`Remove vaccine schedule ${vaccine.vaccineName}?`)) return;
    const updated = vaccines.filter((item) => item.id !== vaccine.id);
    setVaccines(updated);
    saveLocal('herdflow:vaccines', updated);

    if (!isOffline) {
      try {
        await fetch(`/api/vaccines/${vaccine.id}`, { method: 'DELETE' });
        fetchRemoteData();
      } catch {
        setSyncMessage('Vaccine removed locally. Remote delete may be pending.');
      }
    }
  }

  async function saveCount(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!countForm.campId || !countForm.countDate) {
      setError('Camp and count date are required.');
      return;
    }

    const localCount: CountLog = {
      id: buildRecordId(),
      createdAt: new Date().toISOString(),
      ...countForm,
      campId: countForm.campId
    };
    const updated = [localCount, ...counts];
    setCounts(updated);
    saveLocal('herdflow:counts', updated);
    resetCountForm();

    if (!isOffline) {
      try {
        await fetch('/api/counts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(localCount)
        });
        fetchRemoteData();
      } catch {
        setSyncMessage('Count recorded locally. Remote sync failed.');
      }
    }
  }

  async function removeCount(log: CountLog) {
    if (!window.confirm(`Delete count record from ${formatDate(log.countDate)}?`)) return;
    const updated = counts.filter((item) => item.id !== log.id);
    setCounts(updated);
    saveLocal('herdflow:counts', updated);

    if (!isOffline) {
      try {
        await fetch(`/api/counts/${log.id}`, { method: 'DELETE' });
        fetchRemoteData();
      } catch {
        setSyncMessage('Count removed locally. Remote delete may be pending.');
      }
    }
  }

  async function saveMarketplaceItem(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!marketplaceForm.name || !marketplaceForm.price || !marketplaceForm.unit || !marketplaceForm.description) {
      setError('Name, price, unit, and description are required.');
      return;
    }

    if (marketplaceForm.stock < 0) {
      setError('Stock must be zero or greater.');
      return;
    }

    const existingItem = editingMarketplaceId
      ? marketplaceItems.find((item) => item.id === editingMarketplaceId)
      : null;
    const now = new Date().toISOString();
    const localItem: MarketplaceItem = normalizeMarketplaceItem({
      id: editingMarketplaceId || buildRecordId(),
      createdAt: existingItem?.createdAt || now,
      publishedAt: marketplaceForm.isPublished
        ? (existingItem?.publishedAt || now)
        : null,
      ...marketplaceForm
    });

    const updated = editingMarketplaceId
      ? marketplaceItems.map((item) => (item.id === editingMarketplaceId ? localItem : item))
      : [localItem, ...marketplaceItems];

    setMarketplaceItems(updated.map(normalizeMarketplaceItem));
    saveLocal('herdflow:marketplace', updated.map(normalizeMarketplaceItem));
    resetMarketplaceForm();

    if (!isOffline) {
      try {
        const url = editingMarketplaceId ? `/api/marketplace/items/${editingMarketplaceId}` : '/api/marketplace/items';
        const method = editingMarketplaceId ? 'PUT' : 'POST';
        await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(marketplaceForm)
        });
        fetchRemoteData();
      } catch {
        setSyncMessage('Marketplace item saved locally. Remote sync failed.');
      }
    }
  }

  async function compressMarketplaceImage(file: File) {
    const base64Image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
          return;
        }
        reject(new Error('Image file could not be read.'));
      };
      reader.onerror = () => reject(new Error('Image file could not be read.'));
      reader.readAsDataURL(file);
    });

    const imageElement = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Image could not be opened.'));
      image.src = base64Image;
    });

    let width = imageElement.width;
    let height = imageElement.height;
    if (width > MARKETPLACE_IMAGE_MAX_DIMENSION || height > MARKETPLACE_IMAGE_MAX_DIMENSION) {
      const ratio = Math.min(MARKETPLACE_IMAGE_MAX_DIMENSION / width, MARKETPLACE_IMAGE_MAX_DIMENSION / height);
      width = Math.max(1, Math.round(width * ratio));
      height = Math.max(1, Math.round(height * ratio));
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Image compression is not supported in this browser.');
    }

    context.drawImage(imageElement, 0, 0, width, height);
    const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const quality = outputType === 'image/jpeg' ? 0.82 : undefined;
    return canvas.toDataURL(outputType, quality);
  }

  async function setMarketplaceImageFromFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    if (file.size > MARKETPLACE_IMAGE_MAX_UPLOAD_BYTES) {
      setError('Image is too large. Please choose an image under 12MB.');
      return;
    }

    setIsMarketplaceImageProcessing(true);
    try {
      const optimizedImage = await compressMarketplaceImage(file);
      setMarketplaceForm((current) => ({ ...current, imageUrl: optimizedImage }));
      setError(null);
      setSyncMessage('Product image optimized and ready.');
    } catch {
      setError('Could not load the selected image file.');
    } finally {
      setIsMarketplaceImageProcessing(false);
    }
  }

  function handleMarketplaceImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setMarketplaceImageFromFile(file);
    }
    event.target.value = '';
  }

  function handleMarketplaceImageDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!isMarketplaceDropActive) {
      setIsMarketplaceDropActive(true);
    }
  }

  function handleMarketplaceImageDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsMarketplaceDropActive(false);
  }

  function handleMarketplaceImageDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsMarketplaceDropActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      setMarketplaceImageFromFile(file);
    }
  }

  function editMarketplaceItem(item: MarketplaceItem) {
    setEditingMarketplaceId(item.id);
    setMarketplaceForm({
      name: item.name,
      price: item.price,
      unit: item.unit,
      description: item.description,
      imageUrl: item.imageUrl || '',
      stock: item.stock,
      isPublished: item.isPublished
    });
  }

  async function removeMarketplaceItem(item: MarketplaceItem) {
    if (!window.confirm(`Delete marketplace item ${item.name}?`)) return;

    const updated = marketplaceItems.filter((entry) => entry.id !== item.id);
    setMarketplaceItems(updated);
    saveLocal('herdflow:marketplace', updated);

    if (!isOffline) {
      try {
        await fetch(`/api/marketplace/items/${item.id}`, { method: 'DELETE' });
        fetchRemoteData();
      } catch {
        setSyncMessage('Marketplace item removed locally. Remote delete may be pending.');
      }
    }
  }

  async function toggleMarketplaceItemPublish(item: MarketplaceItem, nextPublished: boolean) {
    const now = new Date().toISOString();
    const updatedItem = normalizeMarketplaceItem({
      ...item,
      isPublished: nextPublished,
      publishedAt: nextPublished ? (item.publishedAt || now) : null
    });
    const updated = marketplaceItems.map((entry) => (entry.id === item.id ? updatedItem : entry));
    setMarketplaceItems(updated.map(normalizeMarketplaceItem));
    saveLocal('herdflow:marketplace', updated.map(normalizeMarketplaceItem));

    if (!isOffline) {
      try {
        await fetch(`/api/marketplace/items/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: item.name,
            price: item.price,
            unit: item.unit,
            description: item.description,
            imageUrl: item.imageUrl || '',
            stock: item.stock,
            isPublished: nextPublished
          })
        });
        fetchRemoteData();
      } catch {
        setSyncMessage('Publish status changed locally. Remote sync failed.');
      }
    }
  }

  async function saveMarketplaceRegistration(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!registrationForm.name || !registrationForm.companyName || !registrationForm.phone || !registrationForm.email || !registrationForm.region) {
      setError('Name, company name, phone, email, and region are required.');
      return;
    }

    const localRegistration: MarketplaceRegistration = {
      id: buildRecordId(),
      createdAt: new Date().toISOString(),
      ...registrationForm
    };

    const updated = [localRegistration, ...marketplaceRegistrations];
    setMarketplaceRegistrations(updated);
    saveLocal('herdflow:marketplace-registrations', updated);
    resetRegistrationForm();

    if (!isOffline) {
      try {
        await fetch('/api/marketplace/registrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registrationForm)
        });
        fetchRemoteData();
      } catch {
        setSyncMessage('Registration saved locally. Remote sync failed.');
      }
    }
  }

  async function updateMarketplaceRegistrationStatus(entry: MarketplaceRegistration, status: MarketplaceRegistration['status']) {
    const updatedEntry = { ...entry, status };
    const updated = marketplaceRegistrations.map((item) => (item.id === entry.id ? updatedEntry : item));
    setMarketplaceRegistrations(updated);
    saveLocal('herdflow:marketplace-registrations', updated);

    if (!isOffline) {
      try {
        await fetch(`/api/marketplace/registrations/${entry.id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
        fetchRemoteData();
      } catch {
        setSyncMessage('Registration status updated locally. Remote sync failed.');
      }
    }
  }

  function saveCustomerSignup(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!customerForm.name || !customerForm.email || !customerForm.interest) {
      setError('Name, email, and interest are required.');
      return;
    }

    const signup = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      ...customerForm
    };

    const updated = [signup, ...customerSignups];
    setCustomerSignups(updated);
    saveLocal('herdflow:customer-signups', updated);

    if (!isOffline) {
      fetch('/api/customer-signups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerForm)
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Customer signup sync failed.');
          }
          return response.json();
        })
        .then((created: CustomerSignup) => {
          setCustomerSignups((current) => current.map((item) => (item.id === signup.id ? created : item)));
          saveLocal('herdflow:customer-signups', [created, ...customerSignups.filter((item) => item.id !== signup.id)]);
          setSyncMessage('Customer signup received. Follow up from your HerdFlow team.');
        })
        .catch(() => {
          setSyncMessage('Customer signup saved locally. Remote sync failed.');
        });
    } else {
      setSyncMessage('Customer signup saved locally. Follow up when you are back online.');
    }

    resetCustomerForm();
  }

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-container">
          <img src="/src/logo.png" alt="HerdFlow Logo" className="loading-logo" />
          <p className="loading-text">Loading HerdFlow...</p>
        </div>
      </div>
    );
  }

  if (isTrackingPage) {
    return (
      <div className="app-shell">
        <header>
          <div>
            <div className="header-with-logo">
              <img src="/src/logo.png" alt="HerdFlow Logo" className="logo" />
              <div>
                <h1>Order Tracking</h1>
                <p>Enter your confirmation number and email to view live order progress.</p>
              </div>
            </div>
          </div>
        </header>

        {syncMessage && <p className="status-message">{syncMessage}</p>}
        {error && <p className="error-message">{error}</p>}

        <section className="dashboard-grid">
          <div className="panel">
            <h2>Track Your Order</h2>
            <form className="record-form" onSubmit={trackMarketplaceOrder}>
              <label>
                Confirmation Number
                <input value={trackingLookup.orderNumber} onChange={(event) => setTrackingLookup((current) => ({ ...current, orderNumber: event.target.value }))} placeholder="HF-20260627-1234" />
              </label>
              <label>
                Order Email
                <input value={trackingLookup.email} onChange={(event) => setTrackingLookup((current) => ({ ...current, email: event.target.value }))} placeholder="customer@example.com" />
              </label>
              <button type="submit" className="primary">Track Order</button>
            </form>
          </div>

          <div className="panel">
            <h2>Tracking Details</h2>
            {trackingResult ? (
              <div className="marketplace-grid">
                <article>
                  <h3>{trackingResult.orderNumber}</h3>
                  <p className="marketplace-price">{trackingResult.totalAmount}</p>
                  <p className="muted">Status: {trackingResult.status}</p>
                  <p className="muted">Payment: {trackingResult.paymentMethod} · {trackingResult.paymentStatus}</p>
                  <p className="muted">Delivery: {trackingResult.deliveryAddress}</p>
                  <p className="muted">Items: {trackingResult.lines.map((line) => `${line.quantity}x ${line.name}`).join(', ')}</p>
                </article>
              </div>
            ) : (
              <p className="muted">No order loaded yet.</p>
            )}
          </div>
        </section>
      </div>
    );
  }

  if (isMarketplacePage) {
    return (
      <div className="app-shell storefront-shell">
        <header className="storefront-header">
          <div className="storefront-brand-block">
            <img src="/src/logo.png" alt="HerdFlow Logo" className="logo" />
            <div>
              <p className="eyebrow storefront-eyebrow">HerdFlow Marketplace</p>
              <h1>Enterprise-grade ecommerce for livestock businesses</h1>
              <p>Buy feed, health products, and ranch essentials through a premium B2B storefront built for fast repeat ordering.</p>
            </div>
          </div>
          <div className="storefront-top-actions">
            <a className="hero-link" href="#checkout" onClick={() => trackCheckoutClick('header_link')}>Go to checkout</a>
            <a className="hero-link" href={TRACKING_PATH}>Track order</a>
            <span className={isOffline ? 'storefront-status offline' : 'storefront-status online'}>{isOffline ? 'Offline mode' : 'Live inventory'}</span>
          </div>
        </header>

        <section className="storefront-trust-strip">
          <article>
            <strong>Verified inventory</strong>
            <span>Stock synced with operations in real time.</span>
          </article>
          <article>
            <strong>Fast fulfilment</strong>
            <span>Orders reviewed quickly for dispatch readiness.</span>
          </article>
          <article>
            <strong>Commercial checkout</strong>
            <span>Supports delivery, order notes, and payment options.</span>
          </article>
        </section>

        <section className="storefront-executive-row">
          <article className="storefront-executive-card">
            <p className="eyebrow storefront-eyebrow">International Commerce</p>
            <h2>Built for serious procurement teams, regional distributors, and growth-focused livestock enterprises.</h2>
            <p>
              HerdFlow Marketplace is structured for business continuity. Your catalog, stock logic, and order pipeline are designed to support local and cross-border commerce with clear operational control.
            </p>
          </article>
          <div className="storefront-pillars-grid">
            {globalCommercePillars.map((pillar) => (
              <article key={pillar.title}>
                <strong>{pillar.title}</strong>
                <p>{pillar.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="storefront-hero">
          <div>
            <h2>Source essentials faster with procurement-grade shopping tools.</h2>
            <p>
              Browse the full catalog, compare pricing, add items to cart, and place orders in minutes.
              Inventory and order confirmations are synced with HerdFlow automatically.
            </p>
            <p className="storefront-region-note">Regional checkout preview: {userLocale} · {userCurrency}</p>
            <div className="storefront-category-chips">
              {storefrontCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={shopCategory === category ? 'storefront-chip active' : 'storefront-chip'}
                  onClick={() => setShopCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          <div className="storefront-hero-stats">
            <article>
              <strong>{customerVisibleItems.length}</strong>
              <span>Products available</span>
            </article>
            <article>
              <strong>{formatCurrency(averageProductPrice)}</strong>
              <span>Average item price</span>
            </article>
            <article>
              <strong>{formatCurrency(cartDetails.total)}</strong>
              <span>Cart total</span>
            </article>
            <article>
              <strong>{weeklyConfirmedOrders}</strong>
              <span>Orders placed this week</span>
            </article>
          </div>
        </section>

        <section className="storefront-proof-row">
          <article className="storefront-proof-card">
            <strong>{lowStockCount}</strong>
            <h3>Products running low</h3>
            <p>Inventory can move quickly on staple products. Secure quantities now for uninterrupted operations.</p>
          </article>
          <article className="storefront-proof-card">
            <strong>{mostReorderedProduct ? `${mostReorderedProduct.quantity} units` : 'No data yet'}</strong>
            <h3>Most reordered product</h3>
            <p>{mostReorderedProduct ? mostReorderedProduct.name : 'As orders come in, this area highlights repeat buyer demand.'}</p>
          </article>
        </section>

        <section className="storefront-standards-row">
          {enterpriseServiceStandards.map((standard) => (
            <article key={standard.title}>
              <h3>{standard.title}</h3>
              <p>{standard.detail}</p>
            </article>
          ))}
        </section>

        {syncMessage && <p className="status-message">{syncMessage}</p>}
        {error && <p className="error-message">{error}</p>}

        <section className="storefront-toolbar panel">
          <label>
            Search products
            <input
              value={shopQuery}
              onChange={(event) => setShopQuery(event.target.value)}
              placeholder="Search feed, minerals, medicine, tools..."
            />
          </label>
          <label>
            Category
            <select value={shopCategory} onChange={(event) => setShopCategory(event.target.value)}>
              {storefrontCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
          <label>
            Sort by
            <select value={shopSort} onChange={(event) => setShopSort(event.target.value as 'featured' | 'price-low' | 'price-high' | 'name')}>
              <option value="featured">Featured</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="name">Name A-Z</option>
            </select>
          </label>
          <button
            type="button"
            className="secondary storefront-clear"
            onClick={() => {
              setShopQuery('');
              setShopCategory('All');
              setShopSort('featured');
            }}
          >
            Reset filters
          </button>
        </section>

        {featuredStorefrontItems.length > 0 && (
          <section className="storefront-feature-row">
            {featuredStorefrontItems.map((item) => (
              <article key={`feature-${item.id}`} className="storefront-feature-card">
                <p className="eyebrow storefront-eyebrow">Top seller</p>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <div className="storefront-feature-meta">
                  <span>{item.price} {item.unit}</span>
                  <button type="button" className="primary" onClick={() => addItemToCart(item)}>Add now</button>
                </div>
              </article>
            ))}
          </section>
        )}

        <section className="storefront-layout">
          <div className="storefront-products">
            {storefrontItems.length > 0 ? (
              <div className="storefront-grid">
                {storefrontItems.map((item) => (
                  <article key={item.id} className="storefront-card">
                    {renderMarketplaceImage(item.name, item.imageUrl, 'marketplace-image storefront-image')}
                    <div className="storefront-card-body">
                      <p className="storefront-card-category">{classifyMarketplaceCategory(item)}</p>
                      <h3>{item.name}</h3>
                      <p className="marketplace-price">{item.price} <span>{item.unit}</span></p>
                      <p className="muted">{item.description}</p>
                      <p className={getItemStock(item) <= 5 ? 'stock-badge low' : 'stock-badge in'}>
                        {getItemStock(item) <= 5 ? `Low stock: ${getItemStock(item)}` : `In stock: ${getItemStock(item)}`}
                      </p>
                      <div className="storefront-card-cta-row">
                        <button type="button" className="primary" onClick={() => addItemToCart(item)}>
                          Add to cart
                        </button>
                        <a href="#checkout" className="storefront-quick-checkout-link" onClick={() => trackCheckoutClick('product_card_link')}>Checkout now</a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="panel">
                <h3>No products found</h3>
                <p className="muted">Try a different search term or check back after new stock is published.</p>
              </div>
            )}
          </div>

          <aside className="panel storefront-checkout" id="checkout">
            <h2>Cart and checkout</h2>
            <p className="muted">Secure order capture for commercial buyers. Confirmation arrives with your unique order number.</p>
            {lastOrderNumber && <p className="order-confirmation">Latest confirmation: {lastOrderNumber}</p>}

            <div className="storefront-assurance">
              {storefrontAssuranceBadges.map((badge) => (
                <span key={badge}>{badge}</span>
              ))}
            </div>

            {cartDetails.lines.length > 0 ? (
              <div className="cart-list">
                {cartDetails.lines.map((line) => (
                  <article key={line.item.id} className="cart-item">
                    <div>
                      <h3>{line.item.name}</h3>
                      <p className="muted">{line.item.price} {line.item.unit}</p>
                    </div>
                    <div className="cart-controls">
                      <button type="button" className="secondary" onClick={() => updateCartItemQuantity(line.item.id, line.quantity - 1)}>-</button>
                      <span>{line.quantity}</span>
                      <button type="button" className="secondary" onClick={() => updateCartItemQuantity(line.item.id, line.quantity + 1)}>+</button>
                      <button type="button" className="danger" onClick={() => removeItemFromCart(line.item.id)}>Remove</button>
                    </div>
                    <strong>{formatCurrency(line.lineTotal)}</strong>
                  </article>
                ))}
                <p className="cart-total">Estimated total: {formatCurrency(cartDetails.total)}</p>
              </div>
            ) : (
              <p className="muted">Your cart is empty. Add products to begin checkout.</p>
            )}

            <form className="record-form" onSubmit={submitMarketplaceOrder}>
              <label>
                Full Name
                <input value={checkoutForm.customerName} onChange={(event) => setCheckoutForm((current) => ({ ...current, customerName: event.target.value }))} placeholder="Customer full name" />
              </label>
              <label>
                Email
                <input value={checkoutForm.customerEmail} onChange={(event) => setCheckoutForm((current) => ({ ...current, customerEmail: event.target.value }))} placeholder="customer@example.com" />
              </label>
              <label>
                Phone
                <input value={checkoutForm.customerPhone} onChange={(event) => setCheckoutForm((current) => ({ ...current, customerPhone: event.target.value }))} placeholder="Phone number" />
              </label>
              <label>
                Delivery Address
                <textarea value={checkoutForm.deliveryAddress} onChange={(event) => setCheckoutForm((current) => ({ ...current, deliveryAddress: event.target.value }))} placeholder="Street, city, province, and postal code" />
              </label>
              <label>
                Payment Method
                <select value={checkoutForm.paymentMethod} onChange={(event) => setCheckoutForm((current) => ({ ...current, paymentMethod: event.target.value as 'PayOnDelivery' | 'Stripe' | 'PayFast' }))}>
                  <option value="PayOnDelivery">Pay on Delivery</option>
                  <option value="Stripe">Card (Stripe)</option>
                  <option value="PayFast">PayFast</option>
                </select>
              </label>
              <button type="submit" className="primary" onClick={() => trackCheckoutClick('checkout_submit_button')}>Place order</button>
            </form>
            <div className="storefront-checkout-notes">
              <p>Need to reorder quickly?</p>
              <ul>
                <li>Use search plus category filters to build your cart faster.</li>
                <li>Track fulfilment from the order tracking page after checkout.</li>
              </ul>
              <p>Service commitments:</p>
              <ul>
                {checkoutCommitments.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="storefront-locale-hint">Checkout total is displayed in {userCurrency} based on your locale ({userLocale}).</p>
            </div>
          </aside>
        </section>

        <a href="#checkout" className="storefront-mobile-checkout-cta" onClick={() => trackCheckoutClick('mobile_sticky_cta')}>
          {cartDetails.lines.length > 0
            ? `Checkout ${formatCurrency(cartDetails.total)} (${cartDetails.lines.length} items)`
            : 'Open checkout'}
        </a>
      </div>
    );
  }

  if (isHomePage) {
    return (
      <div className="app-shell">
        <header>
          <div>
            <div className="header-with-logo">
              <img src="/src/logo.png" alt="HerdFlow Logo" className="logo" />
              <div>
                <h1>HerdFlow</h1>
                <p>Run a modern livestock business with a website, marketplace, and partner onboarding in one place.</p>
              </div>
            </div>
          </div>
          <div className="status-pill">
            <span className={isOffline ? 'offline' : 'online'}>{isOffline ? 'Offline' : 'Online'}</span>
          </div>
        </header>

        <section className="hero-panel">
          <div className="hero-copy">
            <p className="eyebrow">Website first</p>
            <h2>Present HerdFlow as a polished business website before sending people to the marketplace or app.</h2>
            <p className="hero-description">
              This website gives your customers a clear place to learn what HerdFlow does, buy items from the store, and register as logistics partners or livestock sellers.
            </p>
            <div className="hero-actions">
              <button type="button" className="primary" onClick={() => window.location.assign(OPERATIONS_PATH)}>Open operations</button>
              <button type="button" className="secondary" onClick={() => window.location.assign(MARKETPLACE_PATH)}>Visit marketplace</button>
              <a className="hero-link" href={TRACKING_PATH}>Track order</a>
              {APP_DOWNLOAD_URL ? (
                <a className="hero-link" href={APP_DOWNLOAD_URL} target="_blank" rel="noreferrer">
                  Download app
                </a>
              ) : (
                <a className="hero-link" href="#contact">
                  Contact us
                </a>
              )}
            </div>
          </div>

          <div className="hero-highlights">
            {businessHighlights.map((highlight) => (
              <article key={highlight.title}>
                <h3>{highlight.title}</h3>
                <p>{highlight.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="summary-grid">
          <article>
            <h3>Managed cattle</h3>
            <strong>{summary.total}</strong>
          </article>
          <article>
            <h3>Marketplace items</h3>
            <strong>{marketplaceItems.length}</strong>
          </article>
          <article>
            <h3>Partner requests</h3>
            <strong>{marketplaceRegistrations.length}</strong>
          </article>
          <article>
            <h3>Live status</h3>
            <strong>{isOffline ? 'Offline' : 'Online'}</strong>
          </article>
        </section>

        <section className="dashboard-grid">
          <div className="panel">
            <h2>What HerdFlow gives your business</h2>
            <div className="marketplace-grid">
              {websiteBenefits.map((item) => (
                <article key={item}>
                  <h3>{item}</h3>
                  <p className="muted">Built to help customers, staff, and partners work from the same system.</p>
                </article>
              ))}
            </div>
          </div>
          <div className="panel">
            <h2>Featured items</h2>
            <p className="muted">These are the items currently visible in the HerdFlow marketplace.</p>
            <div className="marketplace-grid">
              {customerVisibleItems.slice(0, 4).map((item) => (
                <article key={item.id}>
                  {renderMarketplaceImage(item.name, item.imageUrl)}
                  <h3>{item.name}</h3>
                  <p className="marketplace-price">{item.price} <span>{item.unit}</span></p>
                  <p className={getItemStock(item) <= 0 ? 'stock-badge out' : getItemStock(item) <= 5 ? 'stock-badge low' : 'stock-badge in'}>
                    {getItemStock(item) <= 0 ? 'Out of stock' : getItemStock(item) <= 5 ? `Low stock: ${getItemStock(item)}` : `In stock: ${getItemStock(item)}`}
                  </p>
                  <p className="muted">{item.description}</p>
                  <div className="marketplace-actions">
                    <button type="button" className="primary" onClick={() => addItemToCart(item)} disabled={getItemStock(item) <= 0}>
                      Add to cart
                    </button>
                    <a className="marketplace-buy" href={MARKETPLACE_PATH}>
                      View store
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="panel" id="about">
            <p className="eyebrow eyebrow-light">About HerdFlow</p>
            <h2>Built for livestock businesses that need a clear website, a working marketplace, and a stronger customer journey.</h2>
            <p className="muted">
              HerdFlow is designed as the public face of your livestock business. The website introduces your company, the marketplace sells products, and the app handles day-to-day operations.
            </p>
            <div className="marketplace-actions">
              <a className="marketplace-link" href={MARKETPLACE_PATH}>
                Visit the store
              </a>
              <a className="marketplace-link" href={SITE_URL} target="_blank" rel="noreferrer">
                Open website
              </a>
              <button type="button" className="secondary" onClick={() => window.location.assign(OPERATIONS_PATH)}>
                View business tools
              </button>
            </div>
          </div>

          <div className="panel" id="services">
            <p className="eyebrow eyebrow-light">Services</p>
            <h2>Everything a customer or partner needs in one place</h2>
            <div className="marketplace-grid">
              {websiteServices.map((service) => (
                <article key={service.title}>
                  <h3>{service.title}</h3>
                  <p className="muted">{service.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="panel">
            <h2>How the website works</h2>
            <div className="marketplace-grid">
              {websiteSteps.map((step) => (
                <article key={step.title}>
                  <h3>{step.title}</h3>
                  <p className="muted">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="panel">
            <h2>Next places to connect</h2>
            <p className="muted">Point the buttons to your live shop, Android APK, or custom domain when you are ready.</p>
            <div className="marketplace-actions">
              <a className="marketplace-link" href={MARKETPLACE_PATH}>
                Open marketplace website
              </a>
              <a className="marketplace-link" href={SITE_URL} target="_blank" rel="noreferrer">
                Open public website
              </a>
              <button type="button" className="secondary" onClick={() => window.location.assign(OPERATIONS_PATH)}>
                Open business suite
              </button>
            </div>
          </div>
        </section>

        <section className="dashboard-grid" id="contact">
          <div className="panel">
            <p className="eyebrow eyebrow-light">Contact</p>
            <h2>Give visitors one clear place to reach you</h2>
            <div className="marketplace-grid contact-grid">
              {websiteContacts.map((item) => (
                <article key={item.title}>
                  <h3>{item.title}</h3>
                  <p className="contact-value">{item.detail}</p>
                  <p className="muted">{item.note}</p>
                  {item.href && (
                    <a className="marketplace-link" href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel={item.href.startsWith('http') ? 'noreferrer' : undefined}>
                      Contact us
                    </a>
                  )}
                </article>
              ))}
            </div>
          </div>

          <div className="panel">
            <h2>Customer signup</h2>
            <p className="muted">Capture leads for buyers, farmers, and business partners from the website.</p>
            <form className="record-form" onSubmit={saveCustomerSignup}>
              <label>
                Full Name
                <input value={customerForm.name} onChange={(event) => setCustomerForm((current) => ({ ...current, name: event.target.value }))} placeholder="Your name" />
              </label>
              <label>
                Email
                <input value={customerForm.email} onChange={(event) => setCustomerForm((current) => ({ ...current, email: event.target.value }))} placeholder="you@example.com" />
              </label>
              <label>
                Phone
                <input value={customerForm.phone} onChange={(event) => setCustomerForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone number" />
              </label>
              <label>
                What are you interested in?
                <textarea value={customerForm.interest} onChange={(event) => setCustomerForm((current) => ({ ...current, interest: event.target.value }))} placeholder="Marketplace products, herd tools, partner registration, or support." />
              </label>
              <button type="submit" className="primary">Request follow-up</button>
            </form>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="panel">
            <h2>Recent website signups</h2>
            {customerSignups.length > 0 ? (
              <div className="marketplace-grid">
                {customerSignups.map((entry) => (
                  <article key={entry.id}>
                    <h3>{entry.name}</h3>
                    <p className="muted">{entry.email}</p>
                    <p className="muted">{entry.phone}</p>
                    <p className="muted">{entry.interest}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted">No customer signups yet.</p>
            )}
          </div>

          <div className="panel footer-panel">
            <p className="eyebrow eyebrow-light">Branding</p>
            <h2>HerdFlow</h2>
            <p className="muted">
              A professional livestock business website with marketplace buying, partner registrations, desktop access, and Android support.
            </p>
            <div className="footer-links">
              <a href="#about">About</a>
              <a href="#services">Services</a>
              <a href="#contact">Contact</a>
              <a href={SITE_URL} target="_blank" rel="noreferrer">Custom domain ready</a>
              <a href={MARKETPLACE_PATH}>Marketplace</a>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header>
        <div>
          <div className="header-with-logo">
            <img src="/src/logo.png" alt="HerdFlow Logo" className="logo" />
            <div>
              <h1>HerdFlow</h1>
              <p>Manage livestock operations, marketplace sales, and partner onboarding from one business platform.</p>
            </div>
          </div>
        </div>
        <div className="status-pill">
          <span className={isOffline ? 'offline' : 'online'}>{isOffline ? 'Offline' : 'Online'}</span>
        </div>
      </header>

      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Business operations platform</p>
          <h2>Run your herd, sell inventory, and onboard partners with a polished customer-ready experience.</h2>
          <p className="hero-description">
            HerdFlow combines livestock tracking, a marketplace for products and services, and registration flows for logistics companies and farmers who want to sell on the app.
          </p>
          <div className="hero-actions">
            <button type="button" className="primary" onClick={() => window.location.assign(OPERATIONS_PATH)}>Open operations</button>
            <button type="button" className="secondary" onClick={() => window.location.assign(MARKETPLACE_PATH)}>Visit marketplace</button>
            {APP_DOWNLOAD_URL ? (
              <a className="hero-link" href={APP_DOWNLOAD_URL} target="_blank" rel="noreferrer">
                Download app
              </a>
            ) : (
              <span className="hero-note">Set VITE_APP_DOWNLOAD_URL or VITE_APK_DOWNLOAD_URL to publish a download link.</span>
            )}
          </div>
        </div>

        <div className="hero-highlights">
          {businessHighlights.map((highlight) => (
            <article key={highlight.title}>
              <h3>{highlight.title}</h3>
              <p>{highlight.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="nav-grid">
        {(['dashboard', 'cattle', 'camps', 'vaccines', 'counts', 'marketplace'] as ViewSection[]).map((item) => (
          <button
            key={item}
            className={section === item ? 'tab active' : 'tab'}
            onClick={() => setSection(item)}
          >
            {item === 'dashboard'
              ? 'Overview'
              : item === 'cattle'
                ? 'Herd'
                : item === 'vaccines'
                  ? 'Health'
                  : item === 'counts'
                    ? 'Reports'
                    : item === 'marketplace'
                      ? 'Marketplace Admin'
                      : 'Camps'}
          </button>
        ))}
        <button className="tab" onClick={() => window.location.assign(MARKETPLACE_PATH)}>
          Store
        </button>
      </section>

      {syncMessage && <p className="status-message">{syncMessage}</p>}

      {(section === 'dashboard' || section === 'marketplace') && (
        <>
          <section className="summary-grid">
            <article>
              <h3>Total Cattle</h3>
              <strong>{summary.total}</strong>
            </article>
            <article>
              <h3>Active</h3>
              <strong>{summary.active}</strong>
            </article>
            <article>
              <h3>Sold</h3>
              <strong>{summary.sold}</strong>
            </article>
            <article>
              <h3>Quarantined</h3>
              <strong>{summary.quarantined}</strong>
            </article>
            <article>
              <h3>Veterinary</h3>
              <strong>{summary.veterinary}</strong>
            </article>
          </section>

          <section className="analytics-admin-grid">
            <div className="panel analytics-admin-panel">
              <div className="table-header">
                <h2>Analytics Funnel</h2>
                <span className="analytics-source">Source: {analyticsSource}</span>
              </div>
              <div className="marketplace-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    void hydrateAnalyticsEvents();
                    void hydrateApiHealth();
                  }}
                >
                  Refresh events
                </button>
                <button type="button" onClick={exportAnalyticsCsv}>Export CSV</button>
                <button type="button" className="danger" onClick={() => void clearAnalyticsData()}>Clear events</button>
              </div>
              <div className="analytics-window-picker" role="group" aria-label="Analytics date windows">
                {analyticsWindows.map((days) => (
                  <button
                    key={days}
                    type="button"
                    className={analyticsWindowDays === days ? 'active' : ''}
                    onClick={() => setAnalyticsWindowDays(days)}
                  >
                    Last {days} days
                  </button>
                ))}
              </div>
              {analyticsAnomalies.length > 0 ? (
                <div className="analytics-alerts">
                  <h2>Anomaly Alerts</h2>
                  <ul>
                    {analyticsAnomalies.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="analytics-metrics">
                <article>
                  <h3>Product views</h3>
                  <strong>{analyticsSummary.counts.product_view}</strong>
                </article>
                <article>
                  <h3>Add to cart</h3>
                  <strong>{analyticsSummary.counts.add_to_cart}</strong>
                </article>
                <article>
                  <h3>Checkout clicks</h3>
                  <strong>{analyticsSummary.counts.checkout_click}</strong>
                </article>
                <article>
                  <h3>Orders placed</h3>
                  <strong>{analyticsSummary.counts.place_order_success}</strong>
                </article>
              </div>
              <div className="analytics-rates">
                <p>
                  <strong>View to cart:</strong> {formatPercent(analyticsSummary.viewToCartRate)}
                  {previousAnalyticsSummary.counts.product_view > 0
                    ? ` (${formatDelta(analyticsSummary.viewToCartRate - previousAnalyticsSummary.viewToCartRate)})`
                    : ''}
                </p>
                <p>
                  <strong>Cart to checkout:</strong> {formatPercent(analyticsSummary.cartToCheckoutRate)}
                  {previousAnalyticsSummary.counts.add_to_cart > 0
                    ? ` (${formatDelta(analyticsSummary.cartToCheckoutRate - previousAnalyticsSummary.cartToCheckoutRate)})`
                    : ''}
                </p>
                <p>
                  <strong>Checkout to order:</strong> {formatPercent(analyticsSummary.checkoutToOrderRate)}
                  {previousAnalyticsSummary.counts.checkout_click > 0
                    ? ` (${formatDelta(analyticsSummary.checkoutToOrderRate - previousAnalyticsSummary.checkoutToOrderRate)})`
                    : ''}
                </p>
              </div>
            </div>

            <div className="panel analytics-admin-panel">
              <h2>Top Products by Event Signal</h2>
              <div className="analytics-top-lists">
                <div>
                  <h3>Most viewed</h3>
                  {analyticsSummary.topViewed.length > 0 ? (
                    <ul>
                      {analyticsSummary.topViewed.map(([name, count]) => (
                        <li key={`view-${name}`}>
                          <span>{name}</span>
                          <strong>{count}</strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">No product view events yet.</p>
                  )}
                </div>
                <div>
                  <h3>Most added to cart</h3>
                  {analyticsSummary.topCarted.length > 0 ? (
                    <ul>
                      {analyticsSummary.topCarted.map(([name, count]) => (
                        <li key={`cart-${name}`}>
                          <span>{name}</span>
                          <strong>{count}</strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">No add-to-cart events yet.</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="analytics-diagnostics-grid">
            <div className="panel analytics-admin-panel">
              <h2>Source Conversion Segments</h2>
              {analyticsSummary.sourceSegments.length > 0 ? (
                <div className="analytics-table-wrap">
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>Source</th>
                        <th>Checkout clicks</th>
                        <th>Order attempts</th>
                        <th>Orders</th>
                        <th>Checkout to order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsSummary.sourceSegments.map((segment) => (
                        <tr key={segment.source}>
                          <td>{segment.source}</td>
                          <td>{segment.checkoutClicks}</td>
                          <td>{segment.orderAttempts}</td>
                          <td>{segment.orderSuccesses}</td>
                          <td>{formatPercent(segment.checkoutToOrderRate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="muted">No source-level events yet. Track more checkout interactions to populate this segment.</p>
              )}
            </div>

            <div className="panel analytics-admin-panel">
              <h2>Category Conversion Performance</h2>
              {analyticsSummary.categoryConversion.length > 0 ? (
                <div className="analytics-table-wrap">
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Views</th>
                        <th>Add to cart</th>
                        <th>View to cart rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsSummary.categoryConversion.map((category) => (
                        <tr key={category.category}>
                          <td>{category.category}</td>
                          <td>{category.views}</td>
                          <td>{category.adds}</td>
                          <td>{formatPercent(category.viewToCartRate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="muted">No category-level conversion events yet.</p>
              )}
            </div>

            <div className="panel analytics-admin-panel">
              <h2>Checkout Drop-off Diagnostics</h2>
              <div className="analytics-dropoff-list">
                {analyticsSummary.funnelDropOff.map((item) => (
                  <article key={item.stage}>
                    <h3>{item.stage}</h3>
                    <p>From: {item.from} · Next stage: {item.to}</p>
                    <p>Drop-off: {item.dropOff} ({formatPercent(item.dropOffRate)})</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="operations-health-grid">
            <div className="panel analytics-admin-panel">
              <h2>Operations Health</h2>
              <div className="ops-health-cards">
                <article>
                  <h3>Backend health</h3>
                  <strong>{apiHealth?.status === 'ok' ? 'Healthy' : 'Unknown'}</strong>
                  <p>
                    {apiHealthCheckedAt
                      ? `Checked ${formatDateTime(apiHealthCheckedAt)}${apiHealthLatencyMs !== null ? ` (${apiHealthLatencyMs} ms)` : ''}`
                      : 'No backend health check captured yet.'}
                  </p>
                </article>
                <article>
                  <h3>Analytics ingest (24h)</h3>
                  <strong>{analyticsEventsLast24h}</strong>
                  <p>{(analyticsEventsLast24h / 24).toFixed(1)} events/hour</p>
                </article>
                <article>
                  <h3>Transport error rate (24h)</h3>
                  <strong>{formatPercent(analyticsTransportLast24h.errorRate)}</strong>
                  <p>{analyticsTransportLast24h.failures} failures out of {analyticsTransportLast24h.total} sends</p>
                </article>
                <article>
                  <h3>Server uptime</h3>
                  <strong>{apiHealth ? `${Math.floor(apiHealth.uptimeSeconds / 60)} min` : 'N/A'}</strong>
                  <p>{apiHealth ? `${apiHealth.analyticsEvents} analytics events stored` : 'Waiting for /api/health payload.'}</p>
                </article>
                <article>
                  <h3>Checkout conversion</h3>
                  <strong>{formatPercent(analyticsSummary.checkoutToOrderRate)}</strong>
                  <p>Current window: last {analyticsWindowDays} days</p>
                </article>
                <article>
                  <h3>Catalog image coverage</h3>
                  <strong>{formatPercent(releaseReadinessChecks.imageCoverage)}</strong>
                  <p>Products with images published</p>
                </article>
              </div>
              <div className="ops-sparkline-grid">
                <article>
                  <h3>Checkout to Order Trend ({analyticsWindowDays}d)</h3>
                  <svg viewBox="0 0 220 52" aria-label="Checkout to order trend sparkline" role="img">
                    <path d={buildSparklinePath(conversionTrend.map((point) => point.value))} />
                  </svg>
                  <p>
                    Latest: {formatPercent(conversionTrend.length > 0 ? conversionTrend[conversionTrend.length - 1].value : 0)}
                  </p>
                </article>
                <article>
                  <h3>Transport Error Trend ({analyticsWindowDays}d)</h3>
                  <svg viewBox="0 0 220 52" aria-label="Transport error trend sparkline" role="img">
                    <path d={buildSparklinePath(errorTrend.map((point) => point.value))} />
                  </svg>
                  <p>
                    Latest: {formatPercent(errorTrend.length > 0 ? errorTrend[errorTrend.length - 1].value : 0)}
                  </p>
                </article>
              </div>
            </div>

            <div className="panel analytics-admin-panel">
              <h2>Release Readiness Checklist</h2>
              <p className="muted">{releaseReadinessChecks.passed}/{releaseReadinessChecks.total} checks passed</p>
              <div className="release-history-summary">
                <div className="release-history-actions">
                  <button type="button" className="secondary" onClick={exportReleaseReadinessHistoryCsv}>
                    Export Snapshot CSV
                  </button>
                </div>
                <p>
                  Snapshot history: {releaseReadinessHistory.length} records
                  {releaseReadinessHistory.length > 0
                    ? ` · Last saved ${formatDateTime(releaseReadinessHistory[releaseReadinessHistory.length - 1].at)}`
                    : ''}
                </p>
                {releaseReadinessDelta ? (
                  <p>
                    Score {formatDelta(releaseReadinessDelta.score)} · Conversion {formatDelta(releaseReadinessDelta.conversion)} · Error rate {formatDelta(releaseReadinessDelta.errorRate)}
                  </p>
                ) : (
                  <p>Need at least two snapshots to compare trends.</p>
                )}
              </div>
              {releaseReadinessHistory.length > 0 ? (
                <div className="analytics-table-wrap release-history-table-wrap">
                  <table className="analytics-table release-history-table">
                    <thead>
                      <tr>
                        <th>Captured</th>
                        <th>Window</th>
                        <th>Score</th>
                        <th>Conversion</th>
                        <th>Error Rate</th>
                        <th>API Latency</th>
                        <th>Anomalies</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...releaseReadinessHistory].slice(-12).reverse().map((snapshot) => (
                        <tr key={`${snapshot.at}-${snapshot.windowDays}`}>
                          <td>{formatDateTime(snapshot.at)}</td>
                          <td>{snapshot.windowDays}d</td>
                          <td>{snapshot.passed}/{snapshot.total} ({formatPercent(snapshot.scorePercent)})</td>
                          <td>{formatPercent(snapshot.checkoutToOrderRate)}</td>
                          <td>{formatPercent(snapshot.transportErrorRate)}</td>
                          <td>{snapshot.apiLatencyMs !== null ? `${snapshot.apiLatencyMs} ms` : 'N/A'}</td>
                          <td>{snapshot.anomalyCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              <ul className="release-checklist">
                {releaseReadinessChecks.checks.map((item) => (
                  <li key={item.label} className={item.pass ? 'pass' : 'warn'}>
                    <div>
                      <strong>{item.label}</strong>
                      <p>{item.detail}</p>
                    </div>
                    <span>{item.pass ? 'Pass' : 'Action needed'}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="dashboard-grid">
            <div className="panel">
              <h2>Latest Camp Count</h2>
              {summary.latestCount ? (
                <div>
                  <p className="muted">{getCampName(summary.latestCount.campId)} · {formatDate(summary.latestCount.countDate)}</p>
                  <div className="count-detail"><strong>{summary.latestCount.bulls}</strong> Bulls</div>
                  <div className="count-detail"><strong>{summary.latestCount.cows}</strong> Cows</div>
                  <div className="count-detail"><strong>{summary.latestCount.calves}</strong> Calves</div>
                </div>
              ) : (
                <p className="muted">No count records yet.</p>
              )}
            </div>

            <div className="panel">
              <h2>Upcoming Vaccine Schedules</h2>
              {vaccines.filter((v) => !v.givenDate).slice(0, 5).map((vaccine) => (
                <div key={vaccine.id} className="item-row">
                  <div>
                    <strong>{vaccine.vaccineName}</strong>
                    <div className="muted">{getCattleLabel(vaccine.cattleId)}</div>
                  </div>
                  <span>{formatDate(vaccine.scheduledDate)}</span>
                </div>
              ))}
              {!vaccines.some((v) => !v.givenDate) && <p className="muted">No upcoming vaccines scheduled.</p>}
            </div>

            <div className="panel">
              <h2>Data Backup</h2>
              <p className="muted">Export your herd data to a JSON file or import a previous backup.</p>
              <div className="backup-actions">
                <button type="button" className="secondary" onClick={exportBackup}>Export Backup</button>
                <button type="button" className="primary" onClick={openBackupPicker}>Import Backup</button>
              </div>
              <input
                ref={backupInputRef}
                className="backup-file-input"
                type="file"
                accept="application/json"
                aria-label="Import backup file"
                title="Import backup file"
                onChange={importBackupFile}
              />
            </div>

            {section === 'marketplace' && (
              <>
                <section className="marketplace-hero">
                  <div>
                    <p className="eyebrow">HerdFlow Store</p>
                    <h2>Buy farm essentials, register your business, and join the HerdFlow trade network.</h2>
                    <p className="hero-description">
                      Customers can browse the catalog, while logistics companies and farmers can submit partner requests to sell or move livestock through the platform.
                    </p>
                  </div>
                  <div className="marketplace-hero-actions">
                    {MARKETPLACE_URL ? (
                      <a className="marketplace-buy" href={MARKETPLACE_URL} target="_blank" rel="noreferrer">
                        Open buying channel
                      </a>
                    ) : (
                      <p className="hero-note">Set VITE_MARKETPLACE_URL to point buyers to a live store.</p>
                    )}
                    <a className="marketplace-buy" href={TRACKING_PATH}>Track my order</a>
                    <button type="button" className="secondary" onClick={() => setSection('dashboard')}>
                      Back to overview
                    </button>
                  </div>
                </section>

                <section className="dashboard-grid">
                <div className="panel">
                  <div className="table-header">
                    <h2>{editingMarketplaceId ? 'Edit Catalog Item' : 'New Catalog Item'}</h2>
                    {editingMarketplaceId && <button type="button" className="secondary" onClick={resetMarketplaceForm}>Cancel</button>}
                  </div>
                  {error && <p className="error-message">{error}</p>}
                  <form className="record-form" onSubmit={saveMarketplaceItem}>
                    <label>
                      Item Name
                      <input value={marketplaceForm.name} onChange={(event) => setMarketplaceForm((current) => ({ ...current, name: event.target.value }))} placeholder="Mineral Feed Mix" />
                    </label>
                    <label>
                      Price
                      <input value={marketplaceForm.price} onChange={(event) => setMarketplaceForm((current) => ({ ...current, price: event.target.value }))} placeholder="$24" />
                    </label>
                    <label>
                      Unit
                      <input value={marketplaceForm.unit} onChange={(event) => setMarketplaceForm((current) => ({ ...current, unit: event.target.value }))} placeholder="per bag" />
                    </label>
                    <label>
                      Stock Quantity
                      <input type="number" min={0} value={marketplaceForm.stock} onChange={(event) => setMarketplaceForm((current) => ({ ...current, stock: Number(event.target.value) || 0 }))} placeholder="0" />
                    </label>
                    <label>
                      Publish To Storefront
                      <select
                        value={marketplaceForm.isPublished ? 'yes' : 'no'}
                        onChange={(event) => setMarketplaceForm((current) => ({ ...current, isPublished: event.target.value === 'yes' }))}
                      >
                        <option value="no">Save as draft</option>
                        <option value="yes">Published</option>
                      </select>
                    </label>
                    <label>
                      Description
                      <textarea value={marketplaceForm.description} onChange={(event) => setMarketplaceForm((current) => ({ ...current, description: event.target.value }))} placeholder="Tell buyers what this item is for." />
                    </label>
                    <label>
                      Image URL
                      <input value={marketplaceForm.imageUrl} onChange={(event) => setMarketplaceForm((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="https://.../product-photo.jpg" />
                    </label>
                    <div
                      className={`marketplace-dropzone ${isMarketplaceDropActive ? 'active' : ''}`}
                      onDragOver={handleMarketplaceImageDragOver}
                      onDragLeave={handleMarketplaceImageDragLeave}
                      onDrop={handleMarketplaceImageDrop}
                    >
                      <p className="muted">Drag and drop a product photo here, or choose a file below.</p>
                      <input type="file" accept="image/*" onChange={handleMarketplaceImageUpload} aria-label="Upload product image" title="Upload product image" />
                      <p className="muted">Images are auto-compressed for faster loading.</p>
                    </div>
                    {isMarketplaceImageProcessing && <p className="muted">Optimizing image...</p>}
                    {marketplaceForm.imageUrl && (
                      <>
                        <img src={marketplaceForm.imageUrl} alt="Marketplace preview" className="marketplace-image" loading="lazy" />
                        <button type="button" className="secondary" onClick={() => setMarketplaceForm((current) => ({ ...current, imageUrl: '' }))}>
                          Remove image
                        </button>
                      </>
                    )}
                    <button type="submit" className="primary">{editingMarketplaceId ? 'Save Item' : 'Add Item'}</button>
                  </form>
                </div>
                <div className="panel">
                  <h2>Store Catalog</h2>
                  <p className="muted">Draft items stay hidden from clients until published. Published items appear on website and mobile storefront views.</p>
                  <label>
                    Catalog Filter
                    <select
                      value={adminCatalogFilter}
                      onChange={(event) => setAdminCatalogFilter(event.target.value as AdminCatalogFilter)}
                    >
                      <option value="all">All Items</option>
                      <option value="published">Published Only</option>
                      <option value="draft">Drafts Only</option>
                    </select>
                  </label>
                  <div className="marketplace-grid">
                    {adminCatalogItems.map((item) => (
                      <article key={item.id}>
                        {renderMarketplaceImage(item.name, item.imageUrl)}
                        <h3>{item.name}</h3>
                        <p className="marketplace-price">{item.price} <span>{item.unit}</span></p>
                        <p className={item.isPublished ? 'stock-badge in' : 'stock-badge out'}>
                          {item.isPublished ? 'Published' : 'Draft'}
                        </p>
                        <p className={getItemStock(item) <= 0 ? 'stock-badge out' : getItemStock(item) <= 5 ? 'stock-badge low' : 'stock-badge in'}>
                          {getItemStock(item) <= 0 ? 'Out of stock' : getItemStock(item) <= 5 ? `Low stock: ${getItemStock(item)}` : `In stock: ${getItemStock(item)}`}
                        </p>
                        <p className="muted">{item.description}</p>
                        <div className="marketplace-actions">
                          <button
                            type="button"
                            className="primary"
                            onClick={() => toggleMarketplaceItemPublish(item, !item.isPublished)}
                          >
                            {item.isPublished ? 'Unpublish' : 'Publish'}
                          </button>
                          <button type="button" className="secondary" onClick={() => editMarketplaceItem(item)}>Edit</button>
                          <button type="button" className="danger" onClick={() => removeMarketplaceItem(item)}>Delete</button>
                        </div>
                      </article>
                    ))}
                  </div>
                  {adminCatalogItems.length === 0 && <p className="muted">No items match this filter yet.</p>}
                  {MARKETPLACE_URL ? (
                    <a className="marketplace-link" href={MARKETPLACE_URL} target="_blank" rel="noreferrer">
                      Open configured store
                    </a>
                  ) : (
                    <p className="muted">Set VITE_MARKETPLACE_URL to connect item buy buttons to a live store.</p>
                  )}
                </div>
                </section>

                <section className="dashboard-grid">
                <div className="panel">
                  <h2>Cart and Checkout</h2>
                  <p className="muted">Build an order from the catalog and submit it for confirmation.</p>
                  {lastOrderNumber && <p className="order-confirmation">Latest confirmation: {lastOrderNumber}</p>}
                  {cartDetails.lines.length > 0 ? (
                    <div className="cart-list">
                      {cartDetails.lines.map((line) => (
                        <article key={line.item.id} className="cart-item">
                          <div>
                            <h3>{line.item.name}</h3>
                            <p className="muted">{line.item.price} {line.item.unit}</p>
                          </div>
                          <div className="cart-controls">
                            <button type="button" className="secondary" onClick={() => updateCartItemQuantity(line.item.id, line.quantity - 1)}>-</button>
                            <span>{line.quantity}</span>
                            <button type="button" className="secondary" onClick={() => updateCartItemQuantity(line.item.id, line.quantity + 1)}>+</button>
                            <button type="button" className="danger" onClick={() => removeItemFromCart(line.item.id)}>Remove</button>
                          </div>
                          <strong>{formatCurrency(line.lineTotal)}</strong>
                        </article>
                      ))}
                      <p className="cart-total">Estimated total: {formatCurrency(cartDetails.total)}</p>
                    </div>
                  ) : (
                    <p className="muted">Your cart is empty. Add items from the catalog above.</p>
                  )}

                  <form className="record-form" onSubmit={submitMarketplaceOrder}>
                    <label>
                      Customer Name
                      <input value={checkoutForm.customerName} onChange={(event) => setCheckoutForm((current) => ({ ...current, customerName: event.target.value }))} placeholder="Customer full name" />
                    </label>
                    <label>
                      Customer Email
                      <input value={checkoutForm.customerEmail} onChange={(event) => setCheckoutForm((current) => ({ ...current, customerEmail: event.target.value }))} placeholder="customer@example.com" />
                    </label>
                    <label>
                      Customer Phone
                      <input value={checkoutForm.customerPhone} onChange={(event) => setCheckoutForm((current) => ({ ...current, customerPhone: event.target.value }))} placeholder="Phone number" />
                    </label>
                    <label>
                      Delivery Address
                      <textarea value={checkoutForm.deliveryAddress} onChange={(event) => setCheckoutForm((current) => ({ ...current, deliveryAddress: event.target.value }))} placeholder="Street, city, province, and postal code" />
                    </label>
                    <label>
                      Order Notes
                      <textarea value={checkoutForm.notes} onChange={(event) => setCheckoutForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Optional delivery instructions" />
                    </label>
                    <label>
                      Payment Method
                      <select value={checkoutForm.paymentMethod} onChange={(event) => setCheckoutForm((current) => ({ ...current, paymentMethod: event.target.value as 'PayOnDelivery' | 'Stripe' | 'PayFast' }))}>
                        <option value="PayOnDelivery">Pay on Delivery</option>
                        <option value="Stripe">Card (Stripe)</option>
                        <option value="PayFast">PayFast</option>
                      </select>
                    </label>
                    <button type="submit" className="primary">Submit Order</button>
                    <a className="marketplace-link" href={TRACKING_PATH}>Track an existing order</a>
                  </form>
                </div>

                <div className="panel">
                  <h2>Incoming Orders</h2>
                  <p className="muted">Track all website orders and update status for the operations and app teams.</p>
                  {marketplaceOrders.length > 0 ? (
                    <div className="marketplace-grid">
                      {marketplaceOrders.slice(0, 12).map((order) => (
                        <article key={order.id}>
                          <h3>{order.customerName}</h3>
                          <p className="marketplace-price">{order.totalAmount}</p>
                          <p className="muted">{order.customerPhone} · {order.customerEmail}</p>
                          <p className="muted">{order.deliveryAddress}</p>
                          <p className="muted">Status: {order.status}</p>
                          <p className="muted">Confirmation: {order.orderNumber}</p>
                          <p className="muted">Payment: {order.paymentMethod} · {order.paymentStatus}</p>
                          <p className="muted">Placed: {formatDate(order.createdAt)}</p>
                          <p className="muted">Items: {order.lines.map((line) => `${line.quantity}x ${line.name}`).join(', ')}</p>
                          <div className="marketplace-actions">
                            <button type="button" className="secondary" onClick={() => updateMarketplaceOrder(order, 'Confirmed')}>Confirm</button>
                            <button type="button" className="secondary" onClick={() => updateMarketplaceOrder(order, 'Fulfilled')}>Fulfill</button>
                            <button type="button" className="secondary" onClick={() => updateMarketplaceOrder(order, 'Cancelled')}>Cancel</button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="muted">No orders submitted yet.</p>
                  )}
                </div>
                </section>

                <section className="dashboard-grid">
                <div className="panel">
                  <div className="table-header">
                    <h2>Partner Registration</h2>
                    <button type="button" className="secondary" onClick={resetRegistrationForm}>Reset</button>
                  </div>
                  {error && <p className="error-message">{error}</p>}
                  <form className="record-form" onSubmit={saveMarketplaceRegistration}>
                    <label>
                      Partner Type
                      <select value={registrationForm.certificationType} onChange={(event) => setRegistrationForm((current) => ({ ...current, certificationType: event.target.value as MarketplaceRegistration['certificationType'] }))}>
                        <option value="Logistics Certified Client">Logistics company</option>
                        <option value="Certified Livestock Seller">Farmer / livestock seller</option>
                      </select>
                    </label>
                    <label>
                      Full Name
                      <input value={registrationForm.name} onChange={(event) => setRegistrationForm((current) => ({ ...current, name: event.target.value }))} placeholder="Your name" />
                    </label>
                    <label>
                      Company / Ranch Name
                      <input value={registrationForm.companyName} onChange={(event) => setRegistrationForm((current) => ({ ...current, companyName: event.target.value }))} placeholder="Business, fleet, or ranch name" />
                    </label>
                    <label>
                      Phone
                      <input value={registrationForm.phone} onChange={(event) => setRegistrationForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone number" />
                    </label>
                    <label>
                      Email
                      <input value={registrationForm.email} onChange={(event) => setRegistrationForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email address" />
                    </label>
                    <label>
                      Region / Location
                      <input value={registrationForm.region} onChange={(event) => setRegistrationForm((current) => ({ ...current, region: event.target.value }))} placeholder="Town, county, or region" />
                    </label>
                    <label>
                      Notes
                      <textarea value={registrationForm.note} onChange={(event) => setRegistrationForm((current) => ({ ...current, note: event.target.value }))} placeholder="Share livestock volume, delivery coverage, or service details." />
                    </label>
                    <button type="submit" className="primary">Submit Partner Request</button>
                  </form>
                </div>

                <div className="panel">
                  <h2>Submitted Registrations</h2>
                  <p className="muted">These partner requests are stored in HerdFlow and can be reviewed later.</p>
                  <div className="marketplace-grid">
                    {marketplaceRegistrations.map((entry) => (
                      <article key={entry.id}>
                        <h3>{entry.name}</h3>
                        <p className="marketplace-price">{getRegistrationTypeLabel(entry.certificationType)}</p>
                        <p className="muted">{entry.companyName}</p>
                        <p className="muted">{entry.phone} · {entry.email}</p>
                        <p className="muted">{entry.region}</p>
                        {entry.note && <p className="muted">{entry.note}</p>}
                      </article>
                    ))}
                  </div>
                  {marketplaceRegistrations.length === 0 && <p className="muted">No registrations submitted yet.</p>}
                </div>
                </section>
              </>
            )}
          </section>
        </>
      )}

      {section === 'cattle' && (
        <div className="content-grid">
          <form className="record-form" onSubmit={saveCattle}>
            <div className="form-header">
              <h2>{editingCattleId ? 'Edit Animal' : 'Add Animal'}</h2>
              {editingCattleId && <button type="button" className="secondary" onClick={resetCattleForm}>Cancel</button>}
            </div>

            {error && <p className="error-message">{error}</p>}

            <label>
              Tag ID
              <input value={cattleForm.tag} onChange={(event) => handleFieldChange('tag', event.target.value)} placeholder="E.g. 7321-A" />
            </label>

            <label>
              Breed
              <input value={cattleForm.breed} onChange={(event) => handleFieldChange('breed', event.target.value)} placeholder="E.g. Angus" />
            </label>

            <div className="field-row">
              <label>
                Color ID
                <select value={cattleForm.colorId} onChange={(event) => handleFieldChange('colorId', event.target.value)}>
                  {colors.map((color) => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </label>

              <label>
                Camp
                <select value={cattleForm.campId ?? ''} onChange={(event) => handleFieldChange('campId', event.target.value ? Number(event.target.value) : null)}>
                  <option value="">Unassigned</option>
                  {camps.map((camp) => (
                    <option key={camp.id} value={camp.id}>{camp.name}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="field-row">
              <label>
                Gender
                <select value={cattleForm.gender} onChange={(event) => handleFieldChange('gender', event.target.value as Gender)}>
                  {genderOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>

              <label>
                Birth Date
                <input type="date" value={cattleForm.birthDate} onChange={(event) => handleFieldChange('birthDate', event.target.value)} />
              </label>
            </div>

            <div className="field-row">
              <label>
                Status
                <select value={cattleForm.status} onChange={(event) => handleFieldChange('status', event.target.value as Status)}>
                  {statusOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>

              <label>
                Weight (kg)
                <input type="number" min="0" value={cattleForm.weight} onChange={(event) => handleFieldChange('weight', Number(event.target.value))} />
              </label>
            </div>

            <label>
              Notes
              <textarea value={cattleForm.note} onChange={(event) => handleFieldChange('note', event.target.value)} placeholder="Health, breeding and location notes" />
            </label>

            <button type="submit" className="primary">{editingCattleId ? 'Save Animal' : 'Add Animal'}</button>
          </form>

          <section className="table-panel">
            <div className="table-header"><h2>Cattle Records</h2></div>
            <table>
              <thead>
                <tr>
                  <th>Tag</th>
                  <th>Breed</th>
                  <th>Camp</th>
                  <th>Status</th>
                  <th>Count</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cattle.map((record) => (
                  <tr key={record.id}>
                    <td><span className={getColorChipClass(record.colorId)} />{record.tag}</td>
                    <td>{record.breed}</td>
                    <td>{getCampName(record.campId)}</td>
                    <td>{record.status}</td>
                    <td>{record.weight} kg</td>
                    <td className="actions-cell">
                      <button type="button" className="secondary" onClick={() => editCattle(record)}>Edit</button>
                      <button type="button" className="danger" onClick={() => removeCattle(record)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {cattle.length === 0 && (
                  <tr><td colSpan={6} className="empty-state">No cattle records yet.</td></tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
      )}

      {section === 'camps' && (
        <div className="content-grid">
          <form className="record-form" onSubmit={saveCamp}>
            <div className="form-header">
              <h2>{editingCampId ? 'Edit Camp' : 'New Camp'}</h2>
              {editingCampId && <button type="button" className="secondary" onClick={resetCampForm}>Cancel</button>}
            </div>
            {error && <p className="error-message">{error}</p>}

            <label>
              Camp Name
              <input value={campForm.name} onChange={(event) => handleCampField('name', event.target.value)} placeholder="E.g. North Pasture" />
            </label>

            <label>
              Color ID
              <select value={campForm.colorId} onChange={(event) => handleCampField('colorId', event.target.value)}>
                {colors.map((color) => <option key={color} value={color}>{color}</option>)}
              </select>
            </label>

            <label>
              Description
              <textarea value={campForm.description} onChange={(event) => handleCampField('description', event.target.value)} placeholder="Location, fences, notes." />
            </label>

            <button type="submit" className="primary">{editingCampId ? 'Save Camp' : 'Add Camp'}</button>
          </form>

          <section className="table-panel">
            <div className="table-header"><h2>Camp Directory</h2></div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Color</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {camps.map((camp) => (
                  <tr key={camp.id}>
                    <td>{camp.name}</td>
                    <td><span className={getColorChipClass(camp.colorId)} />{camp.colorId}</td>
                    <td>{camp.description || '—'}</td>
                    <td className="actions-cell">
                      <button type="button" className="secondary" onClick={() => editCamp(camp)}>Edit</button>
                      <button type="button" className="danger" onClick={() => removeCamp(camp)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {camps.length === 0 && (
                  <tr><td colSpan={4} className="empty-state">No camps created yet.</td></tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
      )}

      {section === 'vaccines' && (
        <div className="content-grid">
          <form className="record-form" onSubmit={saveVaccine}>
            <div className="form-header">
              <h2>{editingVaccineId ? 'Edit Vaccine' : 'Schedule Vaccine'}</h2>
              {editingVaccineId && <button type="button" className="secondary" onClick={resetVaccineForm}>Cancel</button>}
            </div>
            {error && <p className="error-message">{error}</p>}

            <label>
              Animal
              <select value={vaccineForm.cattleId ?? ''} onChange={(event) => handleVaccineField('cattleId', event.target.value ? Number(event.target.value) : null)}>
                <option value="">Select animal</option>
                {cattle.map((item) => (
                  <option key={item.id} value={item.id}>{item.tag} — {item.breed}</option>
                ))}
              </select>
            </label>

            <label>
              Vaccine
              <input value={vaccineForm.vaccineName} onChange={(event) => handleVaccineField('vaccineName', event.target.value)} placeholder="E.g. BVD, Clostridial" />
            </label>

            <div className="field-row">
              <label>
                Scheduled Date
                <input type="date" value={vaccineForm.scheduledDate} onChange={(event) => handleVaccineField('scheduledDate', event.target.value)} />
              </label>
              <label>
                Completed Date
                <input type="date" value={vaccineForm.givenDate ?? ''} onChange={(event) => handleVaccineField('givenDate', event.target.value || null)} />
              </label>
            </div>

            <label>
              Notes
              <textarea value={vaccineForm.note} onChange={(event) => handleVaccineField('note', event.target.value)} placeholder="Dose, provider, or follow-up." />
            </label>

            <button type="submit" className="primary">{editingVaccineId ? 'Save Vaccine' : 'Add Vaccine'}</button>
          </form>

          <section className="table-panel">
            <div className="table-header"><h2>Vaccine & Health Schedule</h2></div>
            <table>
              <thead>
                <tr>
                  <th>Animal</th>
                  <th>Vaccine</th>
                  <th>Scheduled</th>
                  <th>Given</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vaccines.map((entry) => (
                  <tr key={entry.id}>
                    <td>{getCattleLabel(entry.cattleId)}</td>
                    <td>{entry.vaccineName}</td>
                    <td>{formatDate(entry.scheduledDate)}</td>
                    <td>{entry.givenDate ? formatDate(entry.givenDate) : 'Pending'}</td>
                    <td className="actions-cell">
                      <button type="button" className="secondary" onClick={() => editVaccine(entry)}>Edit</button>
                      <button type="button" className="danger" onClick={() => removeVaccine(entry)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {vaccines.length === 0 && (
                  <tr><td colSpan={5} className="empty-state">No vaccine records yet.</td></tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
      )}

      {section === 'counts' && (
        <div className="content-grid">
          <form className="record-form" onSubmit={saveCount}>
            <div className="form-header">
              <h2>Count Camp Inventory</h2>
            </div>
            {error && <p className="error-message">{error}</p>}

            <label>
              Camp
              <select value={countForm.campId ?? ''} onChange={(event) => handleCountField('campId', event.target.value ? Number(event.target.value) : null)}>
                <option value="">Select camp</option>
                {camps.map((camp) => (
                  <option key={camp.id} value={camp.id}>{camp.name}</option>
                ))}
              </select>
            </label>

            <label>
              Count Date
              <input type="date" value={countForm.countDate} onChange={(event) => handleCountField('countDate', event.target.value)} />
            </label>

            <div className="field-row">
              <label>
                Bulls
                <input type="number" min="0" value={countForm.bulls} onChange={(event) => handleCountField('bulls', Number(event.target.value))} />
              </label>
              <label>
                Cows
                <input type="number" min="0" value={countForm.cows} onChange={(event) => handleCountField('cows', Number(event.target.value))} />
              </label>
              <label>
                Calves
                <input type="number" min="0" value={countForm.calves} onChange={(event) => handleCountField('calves', Number(event.target.value))} />
              </label>
            </div>

            <label>
              Notes
              <textarea value={countForm.note} onChange={(event) => handleCountField('note', event.target.value)} placeholder="Record keeper name or field notes." />
            </label>

            <button type="submit" className="primary">Save Count</button>
          </form>

          <section className="table-panel">
            <div className="table-header"><h2>Camp Count Records</h2></div>
            <table>
              <thead>
                <tr>
                  <th>Camp</th>
                  <th>Date</th>
                  <th>Bulls</th>
                  <th>Cows</th>
                  <th>Calves</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {counts.map((log) => (
                  <tr key={log.id}>
                    <td>{getCampName(log.campId)}</td>
                    <td>{formatDate(log.countDate)}</td>
                    <td>{log.bulls}</td>
                    <td>{log.cows}</td>
                    <td>{log.calves}</td>
                    <td className="actions-cell">
                      <button type="button" className="danger" onClick={() => removeCount(log)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {counts.length === 0 && (
                  <tr><td colSpan={6} className="empty-state">No camp counts recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
