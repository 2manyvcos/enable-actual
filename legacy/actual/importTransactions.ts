import api, { type ImportTransactionsOpts } from '@actual-app/api';
import type { ImportTransactionEntity } from '@actual-app/api/@types/loot-core/src/types/models';
import { mkdirSync } from 'fs';
import type { Transaction } from '../common.ts';
import {
  ACTUAL_ACCOUNT_ID,
  ACTUAL_BUDGET_ID,
  ACTUAL_BUDGET_PASSWORD,
  ACTUAL_DATA_DIR,
  ACTUAL_PASSWORD,
  ACTUAL_URL,
} from '../config.ts';
import notify from '../notify.ts';

export default async function importTransactions(
  transactions: Transaction[],
): Promise<void> {
  mkdirSync(ACTUAL_DATA_DIR, { recursive: true });

  await api.init({
    dataDir: ACTUAL_DATA_DIR,
    serverURL: ACTUAL_URL,
    password: ACTUAL_PASSWORD,
  });

  await api.downloadBudget(ACTUAL_BUDGET_ID, {
    password: ACTUAL_BUDGET_PASSWORD,
  });

  const { added, updated, errors } = await api.importTransactions(
    ACTUAL_ACCOUNT_ID,
    transactions.map(
      (transaction) =>
        ({
          account: ACTUAL_ACCOUNT_ID,
          date: transaction.date,
          amount: transaction.amount,
          payee_name: transaction.payee,
          imported_payee: transaction.payee,
          notes: transaction.notes,
          imported_id: transaction.id,
        }) satisfies ImportTransactionEntity,
    ),
    {
      reimportDeleted: false, // this is mentioned in the documentation but is missing from the TypeScript definition and doesn't seem to have an effect - it is left here for the future nonetheless
      defaultCleared: true,
    } as ImportTransactionsOpts,
  );

  console.log(
    `Added ${added.length} and updated ${updated.length} transactions`,
  );

  errors?.forEach((error: Error) => {
    notify(`Importing transactions failed: ${error.message ?? error}`);
  });

  await api.shutdown();
}
