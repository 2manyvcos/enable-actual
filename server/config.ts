import path from 'path';

export const APP_NAME = process.env.APP_NAME ?? 'Enable Actual';

export const LISTEN_ADDRESS = process.env.LISTEN_ADDRESS ?? '0.0.0.0';

export const PORT = process.env.PORT ?? '3000';

export const SSL_PRIVATE_KEY_FILE = process.env.SSL_PRIVATE_KEY_FILE;

export const SSL_CERTIFICATE_FILE = process.env.SSL_CERTIFICATE_FILE;

export const PUBLIC_URL = (
  process.env.PUBLIC_URL ?? `http://localhost:${PORT}`
).replace(/\/*$/, '/');

export const DATA_DIR =
  process.env.DATA_DIR ?? path.join(import.meta.dirname, '../data');

export const STATE_FILE = path.join(DATA_DIR, 'enable-actual.json');

export const HISTORY_FILE = path.join(DATA_DIR, 'enable-actual.history.json');

export const HISTORY_LENGTH = Math.max(1, +(process.env.HISTORY_LENGTH || 10));

export const ENABLEBANKING_API =
  process.env.ENABLEBANKING_API ?? 'https://api.enablebanking.com';

export const ACTUAL_DATA_DIR = path.join(DATA_DIR, 'actual');

export const LOG_LEVEL = process.env.LOG_LEVEL ?? 'info';
