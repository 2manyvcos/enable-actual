import { type output } from 'zod';
import type EnableBankingSourceState from '../../../shared/schema/EnableBankingSourceState.ts';
import type ImportReport from '../../../shared/schema/ImportReport.ts';
import type ScheduleImportState from '../../../shared/schema/ScheduleImportState.ts';
import type ScheduleState from '../../../shared/schema/ScheduleState.ts';
import type Transaction from '../../../shared/schema/Transaction.ts';
import type TransactionBundle from '../../../shared/schema/TransactionBundle.ts';
import {
  addToDateString,
  startOfDate,
  stringifyError,
} from '../../../shared/utils.ts';
import { ENABLEBANKING_API } from '../../config.ts';
import type { EBAccountIdentification, EBTransaction } from './EBClient.ts';
import EBClient from './EBClient.ts';
import maskAccountIdentification from './maskAccountIdentification.ts';

function convertTransaction(
  sourceID: string,
  sourceAccountID: string,
  report: output<typeof ImportReport>,
  transaction: EBTransaction,
  appendPayeeID: boolean,
): output<typeof Transaction> | undefined {
  const rawDate =
    transaction.booking_date ||
    transaction.value_date ||
    transaction.transaction_date;

  let amount = Math.round(
    parseFloat(transaction.transaction_amount.amount) * 100 || 0,
  );
  if (transaction.credit_debit_indicator === 'DBIT') amount *= -1;

  let payee: string | undefined;
  let payeeID: EBAccountIdentification | undefined;
  if (transaction.credit_debit_indicator === 'DBIT') {
    payee = transaction.creditor?.name ?? undefined;
    payeeID = transaction.creditor_account;
  } else {
    payee = transaction.debtor?.name ?? undefined;
    payeeID = transaction.debtor_account;
  }
  if (appendPayeeID && payee && payeeID) {
    if (payeeID.iban) {
      payee += ` (${maskAccountIdentification(payeeID.iban, 'IBAN')})`;
    } else if (payeeID.other) {
      payee += ` (${maskAccountIdentification(payeeID.other.identification, payeeID.other.scheme_name)})`;
    }
  }

  const notes =
    [transaction.remittance_information, transaction.note]
      .flat(1)
      .filter(Boolean)
      .join(' | ') || undefined;

  const result: Partial<output<typeof Transaction>> = {
    id: transaction.entry_reference ?? undefined,
    date: rawDate ? new Date(rawDate) : undefined,
    amount,
    currency: transaction.transaction_amount.currency,
    payee,
    notes,
  };

  let rejectionReason: string | undefined;
  if (!result.date) rejectionReason = 'Missing date';

  if (rejectionReason) {
    report.rejectedTransactions.push({
      sourceID,
      sourceAccountID,
      reason: rejectionReason,
      details: result,
    });
    return undefined;
  }

  return result as output<typeof Transaction>;
}

export async function resolveEnableBankingTransactions({
  schedule: { initialDays, overscanDays, offsetDays, appendPayeeID },
  report,
  sourceID,
  source: { appID, privateKey },
  sourceAccountIDs,
  state: { accounts },
}: {
  scheduleID: string;
  schedule: output<typeof ScheduleState>;
  report: output<typeof ImportReport>;
  sourceID: string;
  source: output<typeof EnableBankingSourceState>;
  sourceAccountIDs: string[];
  state: output<typeof ScheduleImportState>;
}): Promise<output<typeof TransactionBundle>[]> {
  const client = new EBClient({
    api: ENABLEBANKING_API,
    appID: appID,
    privateKey: privateKey,
  });

  const today = startOfDate(new Date());
  const dateTo = addToDateString(today, -offsetDays);

  const results = await Promise.all(
    sourceAccountIDs.map(
      async (
        sourceAccountID: string,
      ): Promise<output<typeof TransactionBundle> | undefined> => {
        let { initial, checkpoint: dateFrom } = accounts[sourceAccountID] ?? {};
        if (!initial) initial = addToDateString(today, -initialDays);
        if (!dateFrom) dateFrom = initial;
        else {
          dateFrom = addToDateString(dateFrom, -overscanDays);
          if (new Date(dateFrom) < new Date(initial)) dateFrom = initial;
        }

        const resolvedTransactions: EBTransaction[] = [];
        if (new Date(dateFrom) <= new Date(dateTo)) {
          try {
            let { transactions, next } = await client.getTransactions({
              accountUID: sourceAccountID,
              dateFrom,
              dateTo,
              transactionStatus: 'BOOK',
            });
            resolvedTransactions.push(...transactions);
            while (next) {
              ({ transactions, next } = await next());
              resolvedTransactions.push(...transactions);
            }
          } catch (error) {
            report.errors.push(
              `Error fetching transactions for source "${sourceID}", account "${sourceAccountID}": ${stringifyError(
                error,
              )}`,
            );
            return undefined;
          }
        }

        return {
          sourceAccountID,
          transactions: resolvedTransactions
            .map((transaction) =>
              convertTransaction(
                sourceID,
                sourceAccountID,
                report,
                transaction,
                appendPayeeID,
              ),
            )
            .filter((entry) => entry != null),
          state: { initial, checkpoint: dateTo },
        };
      },
    ),
  );

  return results.filter((entry) => entry != null);
}
