import fs from 'fs';
import { type output } from 'zod';
import State from '../shared/schema/State.ts';
import { DATA_DIR, STATE_FILE } from './config.ts';

export function loadState(): output<typeof State> {
  let raw: unknown = {};

  if (fs.existsSync(STATE_FILE)) {
    try {
      raw = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch (error) {
      console.debug(
        `Error loading existing state: ${(error as Error).message ?? error}`,
      );
    }
  }

  return State.parse(raw);
}

export function putState(
  nextState:
    | Partial<output<typeof State>>
    | ((state: output<typeof State>) => output<typeof State>),
): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const currentState = loadState();

  fs.writeFileSync(
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
