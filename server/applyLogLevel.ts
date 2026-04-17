import { LOG_LEVEL } from './config.ts';

if (['debug', 'info'].includes(LOG_LEVEL)) {
  const base = console.info;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.info = (...data: any[]) => {
    base('[INFO]', new Date().toLocaleString(), '-', ...data);
  };
} else {
  console.info = () => {};
}

if (['debug'].includes(LOG_LEVEL)) {
  const base = console.debug;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.debug = (...data: any[]) => {
    base('[DEBUG]', new Date().toLocaleString(), '-', ...data);
  };
} else {
  console.debug = () => {};
}
