import history20260504 from './history-20260504.ts';

export default function migrateHistory(input: unknown): unknown {
  let history = input;

  history = history20260504(history);

  return history;
}
