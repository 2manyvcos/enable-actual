import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { type output } from 'zod';
import State from '../shared/schema/State.ts';
import { stringifyError } from '../shared/utils.ts';
import { DATA_DIR, STATE_FILE } from './config.ts';
import migrateState from './migrations/state.ts';

export function loadState(): output<typeof State> {
  let raw: unknown = {};
  let exists = false;

  if (existsSync(STATE_FILE)) {
    try {
      raw = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
      exists = true;
    } catch (error) {
      console.debug('Error loading existing state:', stringifyError(error));
    }
  }

  if (exists) {
    try {
      raw = migrateState(raw);
    } catch (error) {
      throw new Error(`Error migrating state: ${stringifyError(error)}`);
    }
  }

  return State.parse(raw);
}

export function putState(
  nextState:
    | Partial<output<typeof State>>
    | ((state: output<typeof State>) => output<typeof State>),
): void {
  mkdirSync(DATA_DIR, { recursive: true });

  const currentState = loadState();

  writeFileSync(
    STATE_FILE,
    JSON.stringify(
      typeof nextState === 'function'
        ? nextState(currentState)
        : { ...currentState, ...nextState },
      null,
      2,
    ),
  );
}
