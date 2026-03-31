import fs from 'fs';
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
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch (err: any) {
      console.error(`Error loading existing state: ${err.message ?? err}`);
    }
  }

  return {};
}

export function putState(
  data: Partial<State> | ((prevState: State) => State),
): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const currentState = loadState();

  fs.writeFileSync(
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
