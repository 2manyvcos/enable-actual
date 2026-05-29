import state202605040 from './state-202605040.ts';
import state202605290 from './state-202605290.ts';

export default function migrateState(input: unknown): unknown {
  let state = input;

  state = state202605040(state);
  state = state202605290(state);

  return state;
}
