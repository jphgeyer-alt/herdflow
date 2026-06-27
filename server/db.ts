import fs from 'fs';
import path from 'path';
import { Camp, CountLog, CattleRecord, VaccineRecord } from './types.ts';

const dataDir = path.join(process.cwd(), 'server', 'data');
const dataFile = path.join(dataDir, 'herdflow.json');

interface DatabaseState {
  cattle: CattleRecord[];
  camps: Camp[];
  vaccines: VaccineRecord[];
  counts: CountLog[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
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
      const file = fs.readFileSync(dataFile, 'utf-8');
      return JSON.parse(file) as DatabaseState;
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
        tag: 'A001',
        breed: 'Angus',
        colorId: '#2563eb',
        gender: 'Female',
        birthDate: '2023-03-15',
        status: 'Active',
        weight: 450,
        campId: 1,
        note: 'Healthy cow, good milk production',
        createdAt: now
      },
      {
        id: 2,
        tag: 'B002',
        breed: 'Hereford',
        colorId: '#16a34a',
        gender: 'Male',
        birthDate: '2022-08-20',
        status: 'Active',
        weight: 600,
        campId: 1,
        note: 'Strong bull for breeding',
        createdAt: now
      },
      {
        id: 3,
        tag: 'C003',
        breed: 'Angus',
        colorId: '#c2410c',
        gender: 'Female',
        birthDate: '2024-01-10',
        status: 'Active',
        weight: 280,
        campId: 2,
        note: 'Young calf, watch growth',
        createdAt: now
      }
    ],
    camps: [
      {
        id: 1,
        name: 'North Pasture',
        colorId: '#2563eb',
        description: 'Main grazing area with water access',
        createdAt: now
      },
      {
        id: 2,
        name: 'South Barn',
        colorId: '#16a34a',
        description: 'Sheltered area for young calves',
        createdAt: now
      }
    ],
    vaccines: [
      {
        id: 1,
        cattleId: 1,
        vaccineName: 'BVD',
        scheduledDate: '2026-05-01',
        givenDate: null,
        note: 'Annual booster due',
        createdAt: now
      },
      {
        id: 2,
        cattleId: 2,
        vaccineName: 'IBR',
        scheduledDate: '2026-04-15',
        givenDate: '2026-04-10',
        note: 'Completed successfully',
        createdAt: now
      },
      {
        id: 3,
        cattleId: 3,
        vaccineName: 'Clostridial',
        scheduledDate: '2026-06-01',
        givenDate: null,
        note: 'First vaccination for calf',
        createdAt: now
      }
    ],
    counts: [
      {
        id: 1,
        campId: 1,
        countDate: '2026-04-01',
        bulls: 5,
        cows: 12,
        calves: 8,
        note: 'Spring count - good numbers',
        createdAt: now
      },
      {
        id: 2,
        campId: 2,
        countDate: '2026-04-01',
        bulls: 0,
        cows: 3,
        calves: 6,
        note: 'Barn area - calves doing well',
        createdAt: now
      }
    ]
  };
}

function saveState() {
  fs.writeFileSync(dataFile, JSON.stringify(state, null, 2), 'utf-8');
}

function nextId<T extends { id: number }>(items: T[]) {
  return items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1;
}

export function getAllCattle(): CattleRecord[] {
  return [...state.cattle].sort((a, b) => b.id - a.id);
}

export function getCattleById(id: number): CattleRecord | undefined {
  return state.cattle.find((item) => item.id === id);
}

export function createCattle(record: Omit<CattleRecord, 'id' | 'createdAt'>): CattleRecord {
  const createdAt = new Date().toISOString();
  const newRecord: CattleRecord = { id: nextId(state.cattle), createdAt, ...record };
  state.cattle.unshift(newRecord);
  saveState();
  return newRecord;
}

export function updateCattle(id: number, record: Omit<CattleRecord, 'id' | 'createdAt'>): CattleRecord {
  const index = state.cattle.findIndex((item) => item.id === id);
  if (index === -1) throw new Error('Cattle not found');
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

export function createCamp(camp: Omit<Camp, 'id' | 'createdAt'>): Camp {
  const createdAt = new Date().toISOString();
  const newCamp: Camp = { id: nextId(state.camps), createdAt, ...camp };
  state.camps.unshift(newCamp);
  saveState();
  return newCamp;
}

export function updateCamp(id: number, camp: Omit<Camp, 'id' | 'createdAt'>): Camp {
  const index = state.camps.findIndex((item) => item.id === id);
  if (index === -1) throw new Error('Camp not found');
  state.camps[index] = { id, createdAt: state.camps[index].createdAt, ...camp };
  saveState();
  return state.camps[index];
}

export function deleteCamp(id: number): void {
  state.camps = state.camps.filter((item) => item.id !== id);
  state.cattle = state.cattle.map((record) => (record.campId === id ? { ...record, campId: null } : record));
  saveState();
}

export function getAllVaccineRecords(): VaccineRecord[] {
  return [...state.vaccines].sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime() || b.id - a.id);
}

export function createVaccineRecord(record: Omit<VaccineRecord, 'id' | 'createdAt'>): VaccineRecord {
  const createdAt = new Date().toISOString();
  const newRecord: VaccineRecord = { id: nextId(state.vaccines), createdAt, ...record };
  state.vaccines.unshift(newRecord);
  saveState();
  return newRecord;
}

export function updateVaccineRecord(id: number, record: Omit<VaccineRecord, 'id' | 'createdAt'>): VaccineRecord {
  const index = state.vaccines.findIndex((item) => item.id === id);
  if (index === -1) throw new Error('Vaccine record not found');
  state.vaccines[index] = { id, createdAt: state.vaccines[index].createdAt, ...record };
  saveState();
  return state.vaccines[index];
}

export function deleteVaccineRecord(id: number): void {
  state.vaccines = state.vaccines.filter((item) => item.id !== id);
  saveState();
}

export function getAllCountLogs(): CountLog[] {
  return [...state.counts].sort((a, b) => new Date(b.countDate).getTime() - new Date(a.countDate).getTime() || b.id - a.id);
}

export function createCountLog(log: Omit<CountLog, 'id' | 'createdAt'>): CountLog {
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
  const active = state.cattle.filter((item) => item.status === 'Active').length;
  const sold = state.cattle.filter((item) => item.status === 'Sold').length;
  const quarantined = state.cattle.filter((item) => item.status === 'Quarantined').length;
  const veterinary = state.cattle.filter((item) => item.status === 'Veterinary').length;
  return { total, active, sold, quarantined, veterinary };
}

export function getDatabaseSnapshot(): DatabaseState {
  return {
    cattle: [...state.cattle],
    camps: [...state.camps],
    vaccines: [...state.vaccines],
    counts: [...state.counts]
  };
}

export function importDatabaseSnapshot(payload: unknown): DatabaseState {
  const source = isObject(payload) && isObject(payload.data) ? payload.data : payload;
  if (!hasDatabaseArrays(source)) {
    throw new Error('Invalid backup format. Expected cattle, camps, vaccines, and counts arrays.');
  }

  state.cattle = [...source.cattle];
  state.camps = [...source.camps];
  state.vaccines = [...source.vaccines];
  state.counts = [...source.counts];
  saveState();

  return getDatabaseSnapshot();
}
