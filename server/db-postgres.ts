import { Pool } from 'pg';
import { CattleRecord, Camp, VaccineRecord, CountLog } from './types';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
});

export async function getAllCattle(): Promise<CattleRecord[]> {
  const result = await pool.query(`
    SELECT id,
           tag,
           breed,
           colorid AS "colorId",
           gender,
           birthdate AS "birthDate",
           status,
           weight,
           campid AS "campId",
           note,
           createdat AS "createdAt"
    FROM cattle
    ORDER BY id DESC
  `);
  return result.rows as CattleRecord[];
}

export async function getCattleById(id: number): Promise<CattleRecord | undefined> {
  const result = await pool.query(
    `SELECT id,
            tag,
            breed,
            colorid AS "colorId",
            gender,
            birthdate AS "birthDate",
            status,
            weight,
            campid AS "campId",
            note,
            createdat AS "createdAt"
     FROM cattle
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] as CattleRecord | undefined;
}

export async function createCattle(record: Omit<CattleRecord, 'id' | 'createdAt'>): Promise<CattleRecord> {
  const result = await pool.query(
    `INSERT INTO cattle (tag, breed, colorid, gender, birthdate, status, weight, campid, note, createdat)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
     RETURNING id,
               tag,
               breed,
               colorid AS "colorId",
               gender,
               birthdate AS "birthDate",
               status,
               weight,
               campid AS "campId",
               note,
               createdat AS "createdAt"`,
    [record.tag, record.breed, record.colorId, record.gender, record.birthDate, record.status, record.weight, record.campId, record.note]
  );
  return result.rows[0] as CattleRecord;
}

export async function updateCattle(id: number, record: Omit<CattleRecord, 'id' | 'createdAt'>): Promise<CattleRecord> {
  const result = await pool.query(
    `UPDATE cattle
     SET tag=$1,
         breed=$2,
         colorid=$3,
         gender=$4,
         birthdate=$5,
         status=$6,
         weight=$7,
         campid=$8,
         note=$9
     WHERE id=$10
     RETURNING id,
               tag,
               breed,
               colorid AS "colorId",
               gender,
               birthdate AS "birthDate",
               status,
               weight,
               campid AS "campId",
               note,
               createdat AS "createdAt"`,
    [record.tag, record.breed, record.colorId, record.gender, record.birthDate, record.status, record.weight, record.campId, record.note, id]
  );
  return result.rows[0] as CattleRecord;
}

export async function deleteCattle(id: number): Promise<void> {
  await pool.query('DELETE FROM cattle WHERE id = $1', [id]);
}

export async function getAllCamps(): Promise<Camp[]> {
  const result = await pool.query('SELECT * FROM camps ORDER BY id DESC');
  return result.rows;
}

export async function createCamp(camp: Omit<Camp, 'id' | 'createdAt'>): Promise<Camp> {
  const result = await pool.query(
    `INSERT INTO camps (name, colorid, description, createdat)
     VALUES ($1, $2, $3, NOW()) RETURNING *`,
    [camp.name, camp.colorId, camp.description]
  );
  return result.rows[0];
}

export async function updateCamp(id: number, camp: Omit<Camp, 'id' | 'createdAt'>): Promise<Camp> {
  const result = await pool.query(
    `UPDATE camps SET name=$1, colorid=$2, description=$3 WHERE id=$4 RETURNING *`,
    [camp.name, camp.colorId, camp.description, id]
  );
  return result.rows[0];
}

export async function deleteCamp(id: number): Promise<void> {
  await pool.query('DELETE FROM camps WHERE id = $1', [id]);
  await pool.query('UPDATE cattle SET campid = NULL WHERE campid = $1', [id]);
}

export async function getAllVaccineRecords(): Promise<VaccineRecord[]> {
  const result = await pool.query(`
    SELECT id,
           cattleid AS "cattleId",
           vaccinenname AS "vaccineName",
           scheduleddate AS "scheduledDate",
           givendate AS "givenDate",
           note,
           createdat AS "createdAt"
    FROM vaccines
    ORDER BY scheduleddate ASC, id DESC
  `);
  return result.rows as VaccineRecord[];
}

export async function createVaccineRecord(record: Omit<VaccineRecord, 'id' | 'createdAt'>): Promise<VaccineRecord> {
  const result = await pool.query(
    `INSERT INTO vaccines (cattleid, vaccinenname, scheduleddate, givendate, note, createdat)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING id,
               cattleid AS "cattleId",
               vaccinenname AS "vaccineName",
               scheduleddate AS "scheduledDate",
               givendate AS "givenDate",
               note,
               createdat AS "createdAt"`,
    [record.cattleId, record.vaccineName, record.scheduledDate, record.givenDate, record.note]
  );
  return result.rows[0] as VaccineRecord;
}

export async function updateVaccineRecord(id: number, record: Omit<VaccineRecord, 'id' | 'createdAt'>): Promise<VaccineRecord> {
  const result = await pool.query(
    `UPDATE vaccines
     SET cattleid=$1,
         vaccinenname=$2,
         scheduleddate=$3,
         givendate=$4,
         note=$5
     WHERE id=$6
     RETURNING id,
               cattleid AS "cattleId",
               vaccinenname AS "vaccineName",
               scheduleddate AS "scheduledDate",
               givendate AS "givenDate",
               note,
               createdat AS "createdAt"`,
    [record.cattleId, record.vaccineName, record.scheduledDate, record.givenDate, record.note, id]
  );
  return result.rows[0] as VaccineRecord;
}

export async function deleteVaccineRecord(id: number): Promise<void> {
  await pool.query('DELETE FROM vaccines WHERE id = $1', [id]);
}

export async function getAllCountLogs(): Promise<CountLog[]> {
  const result = await pool.query('SELECT * FROM counts ORDER BY countdate DESC, id DESC');
  return result.rows;
}

export async function createCountLog(log: Omit<CountLog, 'id' | 'createdAt'>): Promise<CountLog> {
  const result = await pool.query(
    `INSERT INTO counts (campid, countdate, bulls, cows, calves, note, createdat)
     VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
    [log.campId, log.countDate, log.bulls, log.cows, log.calves, log.note]
  );
  return result.rows[0];
}

export async function deleteCountLog(id: number): Promise<void> {
  await pool.query('DELETE FROM counts WHERE id = $1', [id]);
}

export async function getSummary() {
  const totalResult = await pool.query('SELECT COUNT(*) FROM cattle');
  const activeResult = await pool.query("SELECT COUNT(*) FROM cattle WHERE status = 'Active'");
  const soldResult = await pool.query("SELECT COUNT(*) FROM cattle WHERE status = 'Sold'");
  const quarantinedResult = await pool.query("SELECT COUNT(*) FROM cattle WHERE status = 'Quarantined'");
  const veterinaryResult = await pool.query("SELECT COUNT(*) FROM cattle WHERE status = 'Veterinary'");

  return {
    total: Number(totalResult.rows[0].count),
    active: Number(activeResult.rows[0].count),
    sold: Number(soldResult.rows[0].count),
    quarantined: Number(quarantinedResult.rows[0].count),
    veterinary: Number(veterinaryResult.rows[0].count)
  };
}

export async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS camps (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      colorid TEXT NOT NULL,
      description TEXT,
      createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS cattle (
      id SERIAL PRIMARY KEY,
      tag TEXT NOT NULL,
      breed TEXT NOT NULL,
      colorid TEXT NOT NULL,
      gender TEXT NOT NULL,
      birthdate DATE NOT NULL,
      status TEXT NOT NULL,
      weight INTEGER NOT NULL,
      campid INTEGER REFERENCES camps(id) ON DELETE SET NULL,
      note TEXT,
      createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS vaccines (
      id SERIAL PRIMARY KEY,
      cattleid INTEGER REFERENCES cattle(id) ON DELETE CASCADE,
      vaccinenname TEXT NOT NULL,
      scheduleddate DATE NOT NULL,
      givendate DATE,
      note TEXT,
      createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS counts (
      id SERIAL PRIMARY KEY,
      campid INTEGER REFERENCES camps(id) ON DELETE CASCADE,
      countdate DATE NOT NULL,
      bulls INTEGER NOT NULL,
      cows INTEGER NOT NULL,
      calves INTEGER NOT NULL,
      note TEXT,
      createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}
