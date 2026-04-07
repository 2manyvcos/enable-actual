import fs from 'fs';
import { DATA_DIR, STATE_FILE } from './config.ts';

export type NotificationState = {
  ntfy?: {
    url?: string;
    username?: string;
    password?: string;
  };
};

export type State = {
  notifications?: NotificationState;
};

export function loadState(): State {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      err: any
    ) {
      console.error(`Error loading existing state: ${err.message ?? err}`);
    }
  }

  return {};
}

export function putState(
  nextState: Partial<State> | ((state: State) => State),
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
