import state202605040 from './state-202605040.ts';

export default function migrateState(input: unknown): unknown {
  let state = input;

  state = state202605040(state);

  return state;
}
