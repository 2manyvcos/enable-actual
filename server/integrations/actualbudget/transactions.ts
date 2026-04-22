import type { output } from 'zod';
import type ActualBudgetTargetState from '../../../shared/schema/ActualBudgetTargetState';
import type ImportReport from '../../../shared/schema/ImportReport';
import type ResolvedTransaction from '../../../shared/schema/ResolvedTransaction';
import type ScheduleState from '../../../shared/schema/ScheduleState';
import type TransactionImportBundle from '../../../shared/schema/TransactionImportBundle';
import { toDateString } from '../../../shared/utils.ts';
import ABClient from './ABClient.ts';
import type { ABTransaction } from './ABClient.types';

function convertResolvedTransaction(
  transaction: output<typeof ResolvedTransaction>,
): ABTransaction {
  return {
    account: transaction.targetAccountID,
    date: toDateString(transaction.details.date),
    amount: transaction.details.amount,
    payeeName: transaction.details.payee,
    importedPayee: transaction.details.payee,
    notes: transaction.details.notes,
    importedID: transaction.details.id,
  };
}

export async function importActualBudgetTransactions({
  report,
  targetID,
  target: { url, password, budgetID, budgetPassword },
  targetAccounts,
}: {
  scheduleID: string;
  schedule: output<typeof ScheduleState>;
  report: output<typeof ImportReport>;
  targetID: string;
  target: output<typeof ActualBudgetTargetState>;
  targetAccounts: output<typeof TransactionImportBundle>[];
}): Promise<boolean> {
  if (!budgetID) throw new Error('Setup required');

  const client = new ABClient({ url, password });

  const { added, updated, errors } = await client.importTransactions(
    { budgetID, budgetPassword },
    targetAccounts.map(({ targetAccountID, transactions }) => ({
      accountUID: targetAccountID,
      transactions: transactions.map(convertResolvedTransaction),
    })),
  );

  report.importedTransactions += added;
  report.updatedTransactions += updated;

  report.errors.push(
    ...errors.map(
      (error) =>
        `Error importing transactions into target "${targetID}": ${
          ((error as Error)?.message ?? error) || 'Unexpected error'
        }`,
    ),
  );

  return !report.errors.length;
}
