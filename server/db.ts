import fs from "fs";
import path from "path";
import {
  Camp,
  CommerceAnalyticsEvent,
  CountLog,
  CattleRecord,
  CustomerSignup,
  MarketplaceItem,
  MarketplaceOrder,
  MarketplaceRegistration,
  VaccineRecord,
} from "./types";

const MAX_ANALYTICS_EVENTS = 2000;

const dataFile = process.env.DATA_FILE
  ? path.resolve(process.cwd(), process.env.DATA_FILE)
  : path.join(process.cwd(), "server", "data", "herdflow.json");
const dataDir = path.dirname(dataFile);

interface DatabaseState {
  cattle: CattleRecord[];
  camps: Camp[];
  vaccines: VaccineRecord[];
  counts: CountLog[];
  marketplace: MarketplaceItem[];
  registrations: MarketplaceRegistration[];
  customerSignups: CustomerSignup[];
  orders: MarketplaceOrder[];
  analyticsEvents: CommerceAnalyticsEvent[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasDatabaseArrays(value: unknown): value is DatabaseState {
  if (!isObject(value)) return false;
  return (
    Array.isArray(value.cattle) &&
    Array.isArray(value.camps) &&
    Array.isArray(value.vaccines) &&
    Array.isArray(value.counts)
  );
}

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const state: DatabaseState = loadState();

function loadState(): DatabaseState {
  if (fs.existsSync(dataFile)) {
    try {
      const file = fs.readFileSync(dataFile, "utf-8");
      const parsed = JSON.parse(file) as Partial<DatabaseState>;
      const seed = getSeedData();
      return {
        cattle: parsed.cattle ?? seed.cattle,
        camps: parsed.camps ?? seed.camps,
        vaccines: parsed.vaccines ?? seed.vaccines,
        counts: parsed.counts ?? seed.counts,
        marketplace: (parsed.marketplace ?? seed.marketplace).map((item) =>
          normalizeMarketplaceItem(item as MarketplaceItem),
        ),
        registrations: parsed.registrations ?? seed.registrations,
        customerSignups: parsed.customerSignups ?? seed.customerSignups,
        orders: parsed.orders ?? seed.orders,
        analyticsEvents: Array.isArray(parsed.analyticsEvents)
          ? parsed.analyticsEvents
          : seed.analyticsEvents,
      };
    } catch {
      return getSeedData();
    }
  }
  return getSeedData();
}

function getSeedData(): DatabaseState {
  const now = new Date().toISOString();
  return {
    cattle: [
      {
        id: 1,
        tag: "A001",
        breed: "Angus",
        colorId: "#2563eb",
        gender: "Female",
        birthDate: "2023-03-15",
        status: "Active",
        weight: 450,
        campId: 1,
        note: "Healthy cow, good milk production",
        createdAt: now,
      },
      {
        id: 2,
        tag: "B002",
        breed: "Hereford",
        colorId: "#16a34a",
        gender: "Male",
        birthDate: "2022-08-20",
        status: "Active",
        weight: 600,
        campId: 1,
        note: "Strong bull for breeding",
        createdAt: now,
      },
      {
        id: 3,
        tag: "C003",
        breed: "Angus",
        colorId: "#c2410c",
        gender: "Female",
        birthDate: "2024-01-10",
        status: "Active",
        weight: 280,
        campId: 2,
        note: "Young calf, watch growth",
        createdAt: now,
      },
    ],
    camps: [
      {
        id: 1,
        name: "North Pasture",
        colorId: "#2563eb",
        description: "Main grazing area with water access",
        createdAt: now,
      },
      {
        id: 2,
        name: "South Barn",
        colorId: "#16a34a",
        description: "Sheltered area for young calves",
        createdAt: now,
      },
    ],
    vaccines: [
      {
        id: 1,
        cattleId: 1,
        vaccineName: "BVD",
        scheduledDate: "2026-05-01",
        givenDate: null,
        note: "Annual booster due",
        createdAt: now,
      },
      {
        id: 2,
        cattleId: 2,
        vaccineName: "IBR",
        scheduledDate: "2026-04-15",
        givenDate: "2026-04-10",
        note: "Completed successfully",
        createdAt: now,
      },
      {
        id: 3,
        cattleId: 3,
        vaccineName: "Clostridial",
        scheduledDate: "2026-06-01",
        givenDate: null,
        note: "First vaccination for calf",
        createdAt: now,
      },
    ],
    counts: [
      {
        id: 1,
        campId: 1,
        countDate: "2026-04-01",
        bulls: 5,
        cows: 12,
        calves: 8,
        note: "Spring count - good numbers",
        createdAt: now,
      },
      {
        id: 2,
        campId: 2,
        countDate: "2026-04-01",
        bulls: 0,
        cows: 3,
        calves: 6,
        note: "Barn area - calves doing well",
        createdAt: now,
      },
    ],
    marketplace: [
      {
        id: 1,
        name: "Mineral Feed Mix",
        price: "$24",
        unit: "per bag",
        description: "Balanced feed support for grazing cattle and camp use.",
        stock: 40,
        isPublished: true,
        publishedAt: now,
        createdAt: now,
      },
      {
        id: 2,
        name: "Veterinary Syringe Pack",
        price: "$18",
        unit: "per pack",
        description: "Reusable syringes and dosing supplies for medicine work.",
        stock: 25,
        isPublished: true,
        publishedAt: now,
        createdAt: now,
      },
      {
        id: 3,
        name: "Ear Tag Kit",
        price: "$35",
        unit: "per kit",
        description: "Numbered tags, applicator, and replacement fasteners.",
        stock: 30,
        isPublished: true,
        publishedAt: now,
        createdAt: now,
      },
      {
        id: 4,
        name: "Water Trough Cleaner",
        price: "$12",
        unit: "per bottle",
        description: "Helps keep camp water systems clean and safe.",
        stock: 18,
        isPublished: true,
        publishedAt: now,
        createdAt: now,
      },
    ],
    registrations: [],
    customerSignups: [],
    orders: [],
    analyticsEvents: [],
  };
}

function saveState() {
  fs.writeFileSync(dataFile, JSON.stringify(state, null, 2), "utf-8");
}

function nextId<T extends { id: number }>(items: T[]) {
  return items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1;
}

function normalizeMarketplaceItem(item: MarketplaceItem): MarketplaceItem {
  const stock = Number.isFinite(Number(item.stock)) ? Math.max(0, Number(item.stock)) : 10;
  const isPublished = typeof item.isPublished === "boolean" ? item.isPublished : true;
  const publishedAt = isPublished
    ? item.publishedAt || item.createdAt || new Date().toISOString()
    : null;

  return {
    ...item,
    stock,
    isPublished,
    publishedAt,
  };
}

function buildOrderNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const serial = Math.floor(Math.random() * 9000 + 1000);
  return `HF-${stamp}-${serial}`;
}

export function getAllCattle(): CattleRecord[] {
  return [...state.cattle].sort((a, b) => b.id - a.id);
}

export function getCattleById(id: number): CattleRecord | undefined {
  return state.cattle.find((item) => item.id === id);
}

export function createCattle(record: Omit<CattleRecord, "id" | "createdAt">): CattleRecord {
  const createdAt = new Date().toISOString();
  const newRecord: CattleRecord = { id: nextId(state.cattle), createdAt, ...record };
  state.cattle.unshift(newRecord);
  saveState();
  return newRecord;
}

export function updateCattle(
  id: number,
  record: Omit<CattleRecord, "id" | "createdAt">,
): CattleRecord {
  const index = state.cattle.findIndex((item) => item.id === id);
  if (index === -1) throw new Error("Cattle not found");
  state.cattle[index] = { id, createdAt: state.cattle[index].createdAt, ...record };
  saveState();
  return state.cattle[index];
}

export function deleteCattle(id: number): void {
  state.cattle = state.cattle.filter((item) => item.id !== id);
  saveState();
}

export function getAllCamps(): Camp[] {
  return [...state.camps].sort((a, b) => b.id - a.id);
}

export function createCamp(camp: Omit<Camp, "id" | "createdAt">): Camp {
  const createdAt = new Date().toISOString();
  const newCamp: Camp = { id: nextId(state.camps), createdAt, ...camp };
  state.camps.unshift(newCamp);
  saveState();
  return newCamp;
}

export function updateCamp(id: number, camp: Omit<Camp, "id" | "createdAt">): Camp {
  const index = state.camps.findIndex((item) => item.id === id);
  if (index === -1) throw new Error("Camp not found");
  state.camps[index] = { id, createdAt: state.camps[index].createdAt, ...camp };
  saveState();
  return state.camps[index];
}

export function deleteCamp(id: number): void {
  state.camps = state.camps.filter((item) => item.id !== id);
  state.cattle = state.cattle.map((record) =>
    record.campId === id ? { ...record, campId: null } : record,
  );
  saveState();
}

export function getAllVaccineRecords(): VaccineRecord[] {
  return [...state.vaccines].sort((a, b) => {
    const aDate = new Date(a.nextDueAt || a.scheduledDate).getTime();
    const bDate = new Date(b.nextDueAt || b.scheduledDate).getTime();
    return aDate - bDate || b.id - a.id;
  });
}

export function createVaccineRecord(
  record: Omit<VaccineRecord, "id" | "createdAt">,
): VaccineRecord {
  const createdAt = new Date().toISOString();
  const newRecord: VaccineRecord = { id: nextId(state.vaccines), createdAt, ...record };
  state.vaccines.unshift(newRecord);
  saveState();
  return newRecord;
}

export function updateVaccineRecord(
  id: number,
  record: Omit<VaccineRecord, "id" | "createdAt">,
): VaccineRecord {
  const index = state.vaccines.findIndex((item) => item.id === id);
  if (index === -1) throw new Error("Vaccine record not found");
  state.vaccines[index] = { id, createdAt: state.vaccines[index].createdAt, ...record };
  saveState();
  return state.vaccines[index];
}

export function deleteVaccineRecord(id: number): void {
  state.vaccines = state.vaccines.filter((item) => item.id !== id);
  saveState();
}

export function getAllCountLogs(): CountLog[] {
  return [...state.counts].sort(
    (a, b) => new Date(b.countDate).getTime() - new Date(a.countDate).getTime() || b.id - a.id,
  );
}

export function getAllMarketplaceItems(): MarketplaceItem[] {
  return [...state.marketplace].sort((a, b) => b.id - a.id);
}

export function getAllMarketplaceRegistrations(): MarketplaceRegistration[] {
  return [...state.registrations].sort((a, b) => b.id - a.id);
}

export function getAllCustomerSignups(): CustomerSignup[] {
  return [...state.customerSignups].sort((a, b) => b.id - a.id);
}

export function getAllMarketplaceOrders(): MarketplaceOrder[] {
  return [...state.orders].sort((a, b) => b.id - a.id);
}

export function getAllAnalyticsEvents(): CommerceAnalyticsEvent[] {
  return [...state.analyticsEvents].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime() || b.id - a.id,
  );
}

export function createAnalyticsEvent(
  event: Omit<CommerceAnalyticsEvent, "id">,
): CommerceAnalyticsEvent {
  const record: CommerceAnalyticsEvent = {
    id: nextId(state.analyticsEvents),
    ...event,
  };
  state.analyticsEvents.unshift(record);
  if (state.analyticsEvents.length > MAX_ANALYTICS_EVENTS) {
    state.analyticsEvents = state.analyticsEvents.slice(0, MAX_ANALYTICS_EVENTS);
  }
  saveState();
  return record;
}

export function clearAnalyticsEvents(): void {
  state.analyticsEvents = [];
  saveState();
}

export function updateMarketplaceRegistrationStatus(
  id: number,
  status: MarketplaceRegistration["status"],
): MarketplaceRegistration {
  const index = state.registrations.findIndex((entry) => entry.id === id);
  if (index === -1) throw new Error("Marketplace registration not found");
  state.registrations[index] = { ...state.registrations[index], status };
  saveState();
  return state.registrations[index];
}

export function createMarketplaceItem(
  item: Omit<MarketplaceItem, "id" | "createdAt">,
): MarketplaceItem {
  const createdAt = new Date().toISOString();
  const newItem: MarketplaceItem = normalizeMarketplaceItem({
    id: nextId(state.marketplace),
    createdAt,
    ...item,
    publishedAt: item.isPublished ? item.publishedAt || createdAt : null,
  });
  state.marketplace.unshift(newItem);
  saveState();
  return newItem;
}

export function updateMarketplaceItem(
  id: number,
  item: Omit<MarketplaceItem, "id" | "createdAt">,
): MarketplaceItem {
  const index = state.marketplace.findIndex((entry) => entry.id === id);
  if (index === -1) throw new Error("Marketplace item not found");
  const existing = state.marketplace[index];
  const nextPublishedAt = item.isPublished
    ? existing.publishedAt || item.publishedAt || new Date().toISOString()
    : null;

  state.marketplace[index] = normalizeMarketplaceItem({
    id,
    createdAt: existing.createdAt,
    ...item,
    publishedAt: nextPublishedAt,
  });
  saveState();
  return state.marketplace[index];
}

export function deleteMarketplaceItem(id: number): void {
  state.marketplace = state.marketplace.filter((item) => item.id !== id);
  saveState();
}

export function createMarketplaceRegistration(
  registration: Omit<MarketplaceRegistration, "id" | "createdAt">,
): MarketplaceRegistration {
  const createdAt = new Date().toISOString();
  const newRegistration: MarketplaceRegistration = {
    id: nextId(state.registrations),
    createdAt,
    ...registration,
  };
  state.registrations.unshift(newRegistration);
  saveState();
  return newRegistration;
}

export function createCustomerSignup(
  signup: Omit<CustomerSignup, "id" | "createdAt">,
): CustomerSignup {
  const createdAt = new Date().toISOString();
  const newSignup: CustomerSignup = { id: nextId(state.customerSignups), createdAt, ...signup };
  state.customerSignups.unshift(newSignup);
  saveState();
  return newSignup;
}

export function createMarketplaceOrder(
  order: Omit<MarketplaceOrder, "id" | "createdAt" | "status" | "orderNumber">,
): MarketplaceOrder {
  const createdAt = new Date().toISOString();

  for (const line of order.lines) {
    const itemIndex = state.marketplace.findIndex((entry) => entry.id === line.itemId);
    if (itemIndex >= 0) {
      const currentStock = Number.isFinite(Number(state.marketplace[itemIndex].stock))
        ? Number(state.marketplace[itemIndex].stock)
        : 0;
      state.marketplace[itemIndex] = {
        ...state.marketplace[itemIndex],
        stock: Math.max(0, currentStock - line.quantity),
      };
    }
  }

  const newOrder: MarketplaceOrder = {
    id: nextId(state.orders),
    orderNumber: buildOrderNumber(),
    createdAt,
    status: "Pending",
    ...order,
  };
  state.orders.unshift(newOrder);
  saveState();
  return newOrder;
}

export function updateMarketplaceOrderStatus(
  id: number,
  status: MarketplaceOrder["status"],
): MarketplaceOrder {
  const index = state.orders.findIndex((entry) => entry.id === id);
  if (index === -1) throw new Error("Marketplace order not found");
  state.orders[index] = { ...state.orders[index], status };
  saveState();
  return state.orders[index];
}

export function deleteMarketplaceRegistration(id: number): void {
  state.registrations = state.registrations.filter((item) => item.id !== id);
  saveState();
}

export function createCountLog(log: Omit<CountLog, "id" | "createdAt">): CountLog {
  const createdAt = new Date().toISOString();
  const newLog: CountLog = { id: nextId(state.counts), createdAt, ...log };
  state.counts.unshift(newLog);
  saveState();
  return newLog;
}

export function deleteCountLog(id: number): void {
  state.counts = state.counts.filter((item) => item.id !== id);
  saveState();
}

export function getSummary() {
  const total = state.cattle.length;
  const active = state.cattle.filter((item) => item.status === "Active").length;
  const sold = state.cattle.filter((item) => item.status === "Sold").length;
  const quarantined = state.cattle.filter((item) => item.status === "Quarantined").length;
  const veterinary = state.cattle.filter((item) => item.status === "Veterinary").length;
  return { total, active, sold, quarantined, veterinary };
}

export function getDatabaseSnapshot(): DatabaseState {
  return {
    cattle: [...state.cattle],
    camps: [...state.camps],
    vaccines: [...state.vaccines],
    counts: [...state.counts],
    marketplace: [...state.marketplace],
    registrations: [...state.registrations],
    customerSignups: [...state.customerSignups],
    orders: [...state.orders],
    analyticsEvents: [...state.analyticsEvents],
  };
}

export function importDatabaseSnapshot(payload: unknown): DatabaseState {
  const source = isObject(payload) && isObject(payload.data) ? payload.data : payload;
  if (!hasDatabaseArrays(source)) {
    throw new Error("Invalid backup format. Expected cattle, camps, vaccines, and counts arrays.");
  }

  const seed = getSeedData();
  state.cattle = [...source.cattle];
  state.camps = [...source.camps];
  state.vaccines = [...source.vaccines];
  state.counts = [...source.counts];
  state.marketplace = Array.isArray((source as Partial<DatabaseState>).marketplace)
    ? [...((source as Partial<DatabaseState>).marketplace as MarketplaceItem[])].map((item) =>
        normalizeMarketplaceItem(item),
      )
    : seed.marketplace;
  state.registrations = Array.isArray((source as Partial<DatabaseState>).registrations)
    ? [...((source as Partial<DatabaseState>).registrations as MarketplaceRegistration[])]
    : seed.registrations;
  state.customerSignups = Array.isArray((source as Partial<DatabaseState>).customerSignups)
    ? [...((source as Partial<DatabaseState>).customerSignups as CustomerSignup[])]
    : seed.customerSignups;
  state.orders = Array.isArray((source as Partial<DatabaseState>).orders)
    ? [...((source as Partial<DatabaseState>).orders as MarketplaceOrder[])]
    : seed.orders;
  state.analyticsEvents = Array.isArray((source as Partial<DatabaseState>).analyticsEvents)
    ? [...((source as Partial<DatabaseState>).analyticsEvents as CommerceAnalyticsEvent[])].slice(
        -MAX_ANALYTICS_EVENTS,
      )
    : seed.analyticsEvents;
  saveState();

  return getDatabaseSnapshot();
}
