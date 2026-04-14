import { LOG_LEVEL } from './config.ts';

if (['debug', 'info'].includes(LOG_LEVEL)) {
  console.info = console.info.bind(console, '[INFO]');
} else {
  console.info = () => {};
}

if (['debug'].includes(LOG_LEVEL)) {
  console.debug = console.debug.bind(console, '[DEBUG]');
} else {
  console.debug = () => {};
}
