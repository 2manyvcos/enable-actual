import { createHash } from 'crypto';
import { mkdirSync } from 'fs';
import path from 'path';
import { parentPort } from 'worker_threads';
import api from '@actual-app/api';
import { stringifyError } from '../../../shared/utils.ts';
import { ACTUAL_DATA_DIR } from '../../config.ts';
import {
  ABError,
  type ABAccount,
  type ABConfig,
  type ABFnAuth,
  type ABFnDownloadBudget,
  type ABFnGetAccounts,
  type ABFnGetBudgets,
  type ABFnImportTransactions,
  type ABImportResult,
} from './ABClient.types.ts';

import '../../applyLogLevel.ts';

process.on('unhandledRejection', (error) => {
  console.debug('Unhandled promise rejection:', error);
});

async function init({ serverURL, password }: ABConfig): Promise<void> {
  const serverHash = createHash('sha256').update(serverURL).digest('hex');
  const dataDir = path.join(ACTUAL_DATA_DIR, serverHash);

  mkdirSync(dataDir, { recursive: true });

  try {
    await api.init({ dataDir, serverURL, password });
  } catch (error) {
    throw new ABError(
      `Authentication failed: ${stringifyError(error)}`,
      'client',
    );
  }
}

const auth: ABFnAuth = async (config) => {
  try {
    await init(config);
  } finally {
    await api.shutdown();
  }
};

const getBudgets: ABFnGetBudgets = async (config) => {
  try {
    await init(config);

    return api.getBudgets();
  } finally {
    await api.shutdown();
  }
};

const downloadBudget: ABFnDownloadBudget = async (
  config,
  { budgetID, budgetPassword },
) => {
  try {
    await init(config);

    try {
      await api.downloadBudget(budgetID, { password: budgetPassword });
    } catch (error) {
      throw new ABError(
        `Downloading budget file failed: ${stringifyError(error)}`,
        'client',
      );
    }
  } finally {
    await api.shutdown();
  }
};

const getAccounts: ABFnGetAccounts = async (
  config,
  { budgetID, budgetPassword },
) => {
  try {
    await init(config);

    await api.downloadBudget(budgetID, { password: budgetPassword });

    return api.getAccounts();
  } finally {
    await api.shutdown();
  }
};

const importTransactions: ABFnImportTransactions = async (
  config,
  { budgetID, budgetPassword },
  bundles,
) => {
  try {
    await init(config);

    await api.downloadBudget(budgetID, { password: budgetPassword });

    const accounts = (await api.getAccounts()) as ABAccount[];
    const accountUIDs = Object.fromEntries(
      accounts.filter(({ id }) => id).map(({ id }) => [id!, true]),
    );

    const result: ABImportResult = { added: 0, updated: 0, errors: [] };

    await api.batchBudgetUpdates(async () => {
      for (const { accountUID, transactions } of bundles) {
        if (!Object.hasOwn(accountUIDs, accountUID)) {
          result.errors.push(`Account "${accountUID}" not found`);
          continue;
        }

        const { added, updated, errors } = await api.importTransactions(
          accountUID,
          transactions.map((transaction) => ({
            account: transaction.account,
            date: transaction.date,
            amount: transaction.amount,
            payee_name: transaction.payeeName,
            imported_payee: transaction.importedPayee,
            notes: transaction.notes,
            imported_id: transaction.importedID,
          })),
          { reimportDeleted: false, defaultCleared: true },
        );

        result.added += added.length;
        result.updated += updated.length;
        result.errors.push(...errors);
      }
    });

    return result;
  } finally {
    await api.shutdown();
  }
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const methods: { [method: string]: Function } = {
  auth,
  getBudgets,
  downloadBudget,
  getAccounts,
  importTransactions,
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
          error: stringifyError(error),
          responsible: error instanceof ABError ? error.responsible : 'server',
        });
      }
    });
  },
);
