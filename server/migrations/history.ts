import history202605040 from './history-202605040.ts';
import history202605050 from './history-202605050.ts';

export default function migrateHistory(input: unknown): unknown {
  let history = input;

  history = history202605040(history);
  history = history202605050(history);

  return history;
}
