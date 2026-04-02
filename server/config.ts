import path from 'path';

export const APP_NAME = process.env.APP_NAME ?? 'Enable Actual';

export const PORT = process.env.PORT ?? '3000';

export const PUBLIC_URL = (
  process.env.PUBLIC_URL ?? `http://localhost:${PORT}`
).replace(/\/*$/, '/');

export const DATA_DIR =
  process.env.DATA_DIR ?? path.join(import.meta.dirname, '../data');

export const STATE_FILE = path.join(DATA_DIR, 'enable-actual.json');

export const ENABLEBANKING_API =
  process.env.ENABLEBANKING_API ?? 'https://api.enablebanking.com';

export const ACTUAL_DATA_DIR = path.join(DATA_DIR, 'actual');
