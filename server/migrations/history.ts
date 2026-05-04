import history202605040 from './history-202605040.ts';

export default function migrateHistory(input: unknown): unknown {
  let history = input;

  history = history202605040(history);

  return history;
}
