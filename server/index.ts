import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { CattleRecord, Camp, VaccineRecord, CountLog } from './types.ts';
import {
  createCamp,
  createCattle,
  createCountLog,
  createVaccineRecord,
  deleteCamp,
  deleteCattle,
  deleteCountLog,
  deleteVaccineRecord,
  getAllCamps,
  getAllCattle,
  getAllCountLogs,
  getAllVaccineRecords,
  getCattleById,
  getSummary,
  updateCamp,
  updateCattle,
  updateVaccineRecord
} from './db.ts';

const app = express();
const port = Number(process.env.PORT) || 4174;
const staticDir = process.env.STATIC_DIR
  ? path.resolve(process.cwd(), process.env.STATIC_DIR)
  : path.resolve(process.cwd(), 'dist');

app.use(cors());
app.use(express.json());

app.get('/api/cattle', (_req, res) => {
  res.json(getAllCattle());
});

app.get('/api/cattle/:id', (req, res) => {
  const record = getCattleById(Number(req.params.id));
  if (!record) {
    return res.status(404).json({ error: 'Cattle record not found' });
  }
  res.json(record);
});

app.post('/api/cattle', (req, res) => {
  const payload = req.body as Omit<CattleRecord, 'id' | 'createdAt'>;
  if (!payload.tag || !payload.breed || !payload.birthDate || !payload.weight || !payload.colorId) {
    return res.status(400).json({ error: 'Tag, breed, birth date, weight and color are required.' });
  }

  const created = createCattle(payload);
  res.status(201).json(created);
});

app.put('/api/cattle/:id', (req, res) => {
  const id = Number(req.params.id);
  const payload = req.body as Omit<CattleRecord, 'id' | 'createdAt'>;
  const existing = getCattleById(id);
  if (!existing) {
    return res.status(404).json({ error: 'Cattle record not found' });
  }

  const updated = updateCattle(id, payload);
  res.json(updated);
});

app.delete('/api/cattle/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = getCattleById(id);
  if (!existing) {
    return res.status(404).json({ error: 'Cattle record not found' });
  }

  deleteCattle(id);
  res.status(204).send();
});

app.get('/api/camps', (_req, res) => {
  res.json(getAllCamps());
});

app.post('/api/camps', (req, res) => {
  const payload = req.body as Omit<Camp, 'id' | 'createdAt'>;
  if (!payload.name || !payload.colorId) {
    return res.status(400).json({ error: 'Camp name and color are required.' });
  }

  const created = createCamp(payload);
  res.status(201).json(created);
});

app.put('/api/camps/:id', (req, res) => {
  const id = Number(req.params.id);
  const payload = req.body as Omit<Camp, 'id' | 'createdAt'>;
  const updated = updateCamp(id, payload);
  res.json(updated);
});

app.delete('/api/camps/:id', (req, res) => {
  deleteCamp(Number(req.params.id));
  res.status(204).send();
});

app.get('/api/vaccines', (_req, res) => {
  res.json(getAllVaccineRecords());
});

app.post('/api/vaccines', (req, res) => {
  const payload = req.body as Omit<VaccineRecord, 'id' | 'createdAt'>;
  if (!payload.cattleId || !payload.vaccineName || !payload.scheduledDate) {
    return res.status(400).json({ error: 'Cattle, vaccine name and scheduled date are required.' });
  }

  const created = createVaccineRecord(payload);
  res.status(201).json(created);
});

app.put('/api/vaccines/:id', (req, res) => {
  const id = Number(req.params.id);
  const payload = req.body as Omit<VaccineRecord, 'id' | 'createdAt'>;
  const updated = updateVaccineRecord(id, payload);
  res.json(updated);
});

app.delete('/api/vaccines/:id', (req, res) => {
  deleteVaccineRecord(Number(req.params.id));
  res.status(204).send();
});

app.get('/api/counts', (_req, res) => {
  res.json(getAllCountLogs());
});

app.post('/api/counts', (req, res) => {
  const payload = req.body as Omit<CountLog, 'id' | 'createdAt'>;
  if (!payload.campId || !payload.countDate) {
    return res.status(400).json({ error: 'Camp and count date are required.' });
  }

  const created = createCountLog(payload);
  res.status(201).json(created);
});

app.delete('/api/counts/:id', (req, res) => {
  deleteCountLog(Number(req.params.id));
  res.status(204).send();
});

app.get('/api/summary', (_req, res) => {
  res.json(getSummary());
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`HerdFlow API server started on http://localhost:${port}`);
  if (fs.existsSync(staticDir)) {
    console.log(`Serving static files from ${staticDir}`);
  }
});
