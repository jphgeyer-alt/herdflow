import 'dotenv/config';

process.env.PORT = process.env.APP_API_PORT || '4175';
process.env.DATA_FILE = process.env.DATA_FILE || process.env.APP_DATA_FILE || 'server/data/herdflow-app.json';
process.env.DISABLE_STATIC = process.env.DISABLE_STATIC || process.env.APP_DISABLE_STATIC || 'true';

await import('./index');
