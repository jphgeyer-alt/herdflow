require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
client.connect()
  .then(() => client.query("SELECT COUNT(*) FROM \"User\""))
  .then(r => { console.log('CONNECTED - Users:', r.rows[0].count); client.end(); })
  .catch(e => { console.log('FAILED:', e.message); try { client.end(); } catch {} });
