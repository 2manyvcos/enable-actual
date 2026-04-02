import fs from 'fs';
import path from 'path';

export const APP_NAME = process.env.APP_NAME ?? 'Enable Actual';

export const PORT = process.env.PORT ?? '3000';

export const SYNC_SCHEDULE = process.env.SYNC_SCHEDULE ?? '0 0 * * *';

export const SYNC_INITIAL_DAYS = Math.max(
  0,
  +(process.env.SYNC_INITIAL_DAYS || 30),
);

export const SYNC_OVERSCAN_DAYS = Math.max(
  0,
  +(process.env.SYNC_OVERSCAN_DAYS || 7),
);

export const SESSION_EXPIRY_WARNING = Math.max(
  0,
  +(process.env.SESSION_EXPIRY_WARNING || 7 * 24 * 60 * 60 * 1000),
);

export const DATA_DIR =
  process.env.DATA_DIR ?? path.join(import.meta.dirname, '../data');

export const STATE_FILE = path.join(DATA_DIR, 'state.json');

export const PUBLIC_URL = (
  process.env.PUBLIC_URL ?? `http://localhost:${PORT}`
).replace(/\/*$/, '/');

export const NTFY_URL = process.env.NTFY_URL;

export const NTFY_USERNAME = process.env.NTFY_USERNAME;

export const NTFY_PASSWORD = process.env.NTFY_PASSWORD;

export const EB_API = process.env.EB_API ?? 'https://api.enablebanking.com';

export const EB_APP_ID = process.env.EB_APP_ID!;
if (!EB_APP_ID) {
  console.error(
    'Error: Enable Banking Application ID is missing, please check that EB_APP_ID is set.',
  );
  process.exit(1);
}

export const EB_PRIVATE_KEY = process.env.EB_PRIVATE_KEY;
export const EB_PRIVATE_KEY_FILE =
  process.env.EB_PRIVATE_KEY_FILE ??
  path.join(import.meta.dirname, '../private.pem');
if (!EB_PRIVATE_KEY && !fs.existsSync(EB_PRIVATE_KEY_FILE)) {
  console.error(
    'Error: Enable Banking Private key is missing, please check that either EB_PRIVATE_KEY or EB_PRIVATE_KEY_FILE is set.',
  );
  process.exit(1);
}

export const EB_TOKEN_VALIDITY = Math.max(
  0,
  +(process.env.EB_TOKEN_VALIDITY || 180 * 24 * 60 * 60 * 1000),
);

export const EB_BANK_NAME = process.env.EB_BANK_NAME!;
if (!EB_BANK_NAME) {
  console.error(
    'Error: Enable Banking Bank Name is missing, please check that EB_BANK_NAME is set.',
  );
  process.exit(1);
}

export const EB_BANK_COUNTRY = process.env.EB_BANK_COUNTRY!;
if (!EB_BANK_COUNTRY) {
  console.error(
    'Error: Enable Banking Bank Country is missing, please check that EB_BANK_COUNTRY is set.',
  );
  process.exit(1);
}

export const EB_PSU_TYPE = process.env.EB_PSU_TYPE ?? 'personal';

export const ACTUAL_DATA_DIR = path.join(DATA_DIR, 'actual');

export const ACTUAL_URL = process.env.ACTUAL_URL!;
if (!ACTUAL_URL) {
  console.error(
    'Error: Actual Budget URL is missing, please check that ACTUAL_URL is set.',
  );
  process.exit(1);
}

export const ACTUAL_PASSWORD = process.env.ACTUAL_PASSWORD!;
if (!ACTUAL_PASSWORD) {
  console.error(
    'Error: Actual Budget Server Password is missing, please check that ACTUAL_PASSWORD is set.',
  );
  process.exit(1);
}

export const ACTUAL_BUDGET_ID = process.env.ACTUAL_BUDGET_ID!;
if (!ACTUAL_BUDGET_ID) {
  console.error(
    'Error: Actual Budget Sync ID is missing, please check that ACTUAL_BUDGET_ID is set.',
  );
  process.exit(1);
}

export const ACTUAL_BUDGET_PASSWORD = process.env.ACTUAL_BUDGET_PASSWORD;

export const ACTUAL_ACCOUNT_ID = process.env.ACTUAL_ACCOUNT_ID!;
if (!ACTUAL_ACCOUNT_ID) {
  console.error(
    'Error: Actual Budget Account ID is missing, please check that ACTUAL_ACCOUNT_ID is set.',
  );
  process.exit(1);
}
