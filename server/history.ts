import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { type output } from 'zod';
import History from '../shared/schema/History.ts';
import { stringifyError } from '../shared/utils.ts';
import { DATA_DIR, HISTORY_FILE } from './config.ts';
import migrateHistory from './migrations/history.ts';

export function loadHistory(migrate?: boolean): output<typeof History> {
  let raw: unknown = {};
  let exists = false;

  if (existsSync(HISTORY_FILE)) {
    try {
      raw = JSON.parse(readFileSync(HISTORY_FILE, 'utf8'));
      exists = true;
    } catch (error) {
      console.debug('Error loading existing history:', stringifyError(error));
    }
  }

  if (exists && migrate) {
    try {
      raw = migrateHistory(raw);
    } catch (error) {
      throw new Error(`Error migrating history: ${stringifyError(error)}`);
    }
  }

  return History.parse(raw);
}

export function putHistory(
  nextHistory:
    | Partial<output<typeof History>>
    | ((history: output<typeof History>) => output<typeof History>),
): void {
  const currentHistory = loadHistory();

  writeHistory(
    typeof nextHistory === 'function'
      ? nextHistory(currentHistory)
      : { ...currentHistory, ...nextHistory },
  );
}

export function writeHistory(nextHistory: output<typeof History>): void {
  mkdirSync(DATA_DIR, { recursive: true });

  writeFileSync(HISTORY_FILE, JSON.stringify(nextHistory, null, 2));
}
