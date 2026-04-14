import { createHash } from 'crypto';
import { mkdirSync } from 'fs';
import path from 'path';
import { parentPort } from 'worker_threads';
import api from '@actual-app/api';
import { ACTUAL_DATA_DIR } from '../../config.ts';
import {
  ABError,
  type ABConfig,
  type ABFnAuth,
  type ABFnDownloadBudget,
  type ABFnGetBudgets,
} from './ABClient.types.ts';

import '../../applyLogLevel.ts';

process.on('unhandledRejection', (error) => {
  console.debug('Unhandled promise rejection:', error);
});

async function init({ serverURL, password }: ABConfig): Promise<void> {
  const serverHash = createHash('sha256').update(serverURL).digest('hex');
  const dataDir = path.join(ACTUAL_DATA_DIR, serverHash);

  mkdirSync(dataDir, { recursive: true });

  await api.init({ dataDir, serverURL, password });
}

const auth: ABFnAuth = async (config) => {
  await init(config);
};

const getBudgets: ABFnGetBudgets = async (config) => {
  await init(config);

  return api.getBudgets();
};

const downloadBudget: ABFnDownloadBudget = async (
  config,
  { budgetID, budgetPassword },
) => {
  await init(config);

  await api.downloadBudget(budgetID, { password: budgetPassword });
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const methods: { [method: string]: Function } = {
  auth,
  getBudgets,
  downloadBudget,
};

let queue = Promise.resolve();

parentPort!.addListener(
  'message',
  ({ id, method, args }: { id: string; method: string; args: unknown[] }) => {
    queue = queue.then(async () => {
      try {
        const result = await methods[method](...args);
        parentPort!.postMessage({ id, result });
      } catch (error) {
        parentPort!.postMessage({
          id,
          error:
            ((error as Error)?.message ?? error?.toString()) ||
            'Unexpected error',
          responsible: error instanceof ABError ? error.responsible : 'server',
        });
      }
    });
  },
);
