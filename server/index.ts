import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { CattleRecord, Camp, VaccineRecord, CountLog } from './types.ts';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4174);
const staticDir = process.env.STATIC_DIR || 'client/dist';

app.use(cors());
app.use(express.json());
app.use(express.static(staticDir));
app.get('/', (_req, res) => res.sendFile('index.html', { root: staticDir }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

type DbModule = {
  getAllCattle: () => Promise<CattleRecord[]> | CattleRecord[];
  getCattleById: (id: number) => Promise<CattleRecord | undefined> | CattleRecord | undefined;
  createCattle: (record: Omit<CattleRecord, 'id' | 'createdAt'>) => Promise<CattleRecord> | CattleRecord;
  updateCattle: (id: number, record: Omit<CattleRecord, 'id' | 'createdAt'>) => Promise<CattleRecord> | CattleRecord;
  deleteCattle: (id: number) => Promise<void> | void;
  getAllCamps: () => Promise<Camp[]> | Camp[];
  createCamp: (camp: Omit<Camp, 'id' | 'createdAt'>) => Promise<Camp> | Camp;
  updateCamp: (id: number, camp: Omit<Camp, 'id' | 'createdAt'>) => Promise<Camp> | Camp;
  deleteCamp: (id: number) => Promise<void> | void;
  getAllVaccineRecords: () => Promise<VaccineRecord[]> | VaccineRecord[];
  createVaccineRecord: (record: Omit<VaccineRecord, 'id' | 'createdAt'>) => Promise<VaccineRecord> | VaccineRecord;
  updateVaccineRecord: (id: number, record: Omit<VaccineRecord, 'id' | 'createdAt'>) => Promise<VaccineRecord> | VaccineRecord;
  deleteVaccineRecord: (id: number) => Promise<void> | void;
  getAllCountLogs: () => Promise<CountLog[]> | CountLog[];
  createCountLog: (log: Omit<CountLog, 'id' | 'createdAt'>) => Promise<CountLog> | CountLog;
  deleteCountLog: (id: number) => Promise<void> | void;
  getSummary: () => Promise<unknown> | unknown;
  initializeDatabase?: () => Promise<void> | void;
};

let db: DbModule;

function asyncHandler(fn: (req: express.Request, res: express.Response) => Promise<void>) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    fn(req, res).catch(next);
  };
}

async function loadDatabase(): Promise<DbModule> {
  const usePostgres = Boolean(process.env.DATABASE_URL);
  const module = usePostgres ? await import('./db-postgres.ts') : await import('./db.ts');
  return module as DbModule;
}

async function startApp() {
  db = await loadDatabase();

  if (db.initializeDatabase) {
    await db.initializeDatabase();
  }

  app.get('/api/cattle', asyncHandler(async (_req, res) => {
    res.json(await db.getAllCattle());
  }));

  app.get('/api/cattle/:id', asyncHandler(async (req, res) => {
    const record = await db.getCattleById(Number(req.params.id));
    if (!record) return res.status(404).json({ error: 'Cattle record not found' });
    res.json(record);
  }));

  app.post('/api/cattle', asyncHandler(async (req, res) => {
    const payload = req.body as Omit<CattleRecord, 'id' | 'createdAt'>;
    if (!payload.tag || !payload.breed || !payload.birthDate || !payload.weight || !payload.colorId) {
      return res.status(400).json({ error: 'Tag, breed, birth date, weight and color are required.' });
    }
    const created = await db.createCattle(payload);
    res.status(201).json(created);
  }));

  app.put('/api/cattle/:id', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const payload = req.body as Omit<CattleRecord, 'id' | 'createdAt'>;
    const existing = await db.getCattleById(id);
    if (!existing) return res.status(404).json({ error: 'Cattle record not found' });
    const updated = await db.updateCattle(id, payload);
    res.json(updated);
  }));

  app.delete('/api/cattle/:id', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const existing = await db.getCattleById(id);
    if (!existing) return res.status(404).json({ error: 'Cattle record not found' });
    await db.deleteCattle(id);
    res.status(204).send();
  }));

  app.get('/api/camps', asyncHandler(async (_req, res) => {
    res.json(await db.getAllCamps());
  }));

  app.post('/api/camps', asyncHandler(async (req, res) => {
    const payload = req.body as Omit<Camp, 'id' | 'createdAt'>;
    if (!payload.name || !payload.colorId) {
      return res.status(400).json({ error: 'Camp name and color are required.' });
    }
    const created = await db.createCamp(payload);
    res.status(201).json(created);
  }));

  app.put('/api/camps/:id', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const payload = req.body as Omit<Camp, 'id' | 'createdAt'>;
    const updated = await db.updateCamp(id, payload);
    res.json(updated);
  }));

  app.delete('/api/camps/:id', asyncHandler(async (req, res) => {
    await db.deleteCamp(Number(req.params.id));
    res.status(204).send();
  }));

  app.get('/api/vaccines', asyncHandler(async (_req, res) => {
    res.json(await db.getAllVaccineRecords());
  }));

  app.post('/api/vaccines', asyncHandler(async (req, res) => {
    const payload = req.body as Omit<VaccineRecord, 'id' | 'createdAt'>;
    if (!payload.cattleId || !payload.vaccineName || !payload.scheduledDate) {
      return res.status(400).json({ error: 'Cattle, vaccine name and scheduled date are required.' });
    }
    const created = await db.createVaccineRecord(payload);
    res.status(201).json(created);
  }));

  app.put('/api/vaccines/:id', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const payload = req.body as Omit<VaccineRecord, 'id' | 'createdAt'>;
    const updated = await db.updateVaccineRecord(id, payload);
    res.json(updated);
  }));

  app.delete('/api/vaccines/:id', asyncHandler(async (req, res) => {
    await db.deleteVaccineRecord(Number(req.params.id));
    res.status(204).send();
  }));

  app.get('/api/counts', asyncHandler(async (_req, res) => {
    res.json(await db.getAllCountLogs());
  }));

  app.post('/api/counts', asyncHandler(async (req, res) => {
    const payload = req.body as Omit<CountLog, 'id' | 'createdAt'>;
    if (!payload.campId || !payload.countDate) {
      return res.status(400).json({ error: 'Camp and count date are required.' });
    }
    const created = await db.createCountLog(payload);
    res.status(201).json(created);
  }));

  app.delete('/api/counts/:id', asyncHandler(async (req, res) => {
    await db.deleteCountLog(Number(req.params.id));
    res.status(204).send();
  }));

  app.get('/api/summary', asyncHandler(async (_req, res) => {
    res.json(await db.getSummary());
  }));

  app.get('*', (_req, res) => {
    res.sendFile('index.html', { root: staticDir });
  });

  app.listen(port, () => {
    console.log(`HerdFlow API server started on http://localhost:${port}`);
  });
}

startApp().catch((error) => {
  console.error('Failed to start HerdFlow server:', error);
  process.exit(1);
});
