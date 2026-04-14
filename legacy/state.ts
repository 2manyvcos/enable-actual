import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { DATA_DIR, STATE_FILE } from './config.ts';

export type SourceState = {
  type: 'eb';
  sessionID: string;
  sessionExpiry: string;
  accountUIDs: string[];
};

export type SyncState = {
  initial?: string;
  date?: string;
};

export type State = {
  source?: SourceState;
  sync?: { [accountUID: string]: SyncState | undefined };
};

export function loadState(): State {
  if (existsSync(STATE_FILE)) {
    try {
      return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
    } catch (error) {
      console.error(
        `Error loading existing state: ${(error as Error).message ?? error}`,
      );
    }
  }

  return {};
}

export function putState(
  data: Partial<State> | ((prevState: State) => State),
): void {
  mkdirSync(DATA_DIR, { recursive: true });

  const currentState = loadState();

  writeFileSync(
    STATE_FILE,
    JSON.stringify(
      typeof data === 'function'
        ? data(currentState)
        : { ...currentState, ...data },
      null,
      2,
    ),
  );
}
