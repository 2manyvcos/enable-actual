import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { type output } from 'zod';
import History from '../shared/schema/History.ts';
import { DATA_DIR, HISTORY_FILE } from './config.ts';

export function loadHistory(): output<typeof History> {
  let raw: unknown = {};

  if (existsSync(HISTORY_FILE)) {
    try {
      raw = JSON.parse(readFileSync(HISTORY_FILE, 'utf8'));
    } catch (error) {
      console.debug('Error loading existing history:', error);
    }
  }

  return History.parse(raw);
}

export function putHistory(
  nextHistory:
    | Partial<output<typeof History>>
    | ((history: output<typeof History>) => output<typeof History>),
): void {
  mkdirSync(DATA_DIR, { recursive: true });

  const currentHistory = loadHistory();

  writeFileSync(
    HISTORY_FILE,
    JSON.stringify(
      typeof nextHistory === 'function'
        ? nextHistory(currentHistory)
        : { ...currentHistory, ...nextHistory },
      null,
      2,
    ),
  );
}
