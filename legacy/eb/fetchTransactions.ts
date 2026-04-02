import type { Transaction, TransactionBundle } from '../common.ts';
import {
  EB_API,
  EB_APP_ID,
  EB_PRIVATE_KEY,
  EB_PRIVATE_KEY_FILE,
  SYNC_INITIAL_DAYS,
  SYNC_OVERSCAN_DAYS,
} from '../config.ts';
import type { SyncState } from '../state.ts';
import EBClient from './EBClient.ts';

function getDate(date: Date): string {
  return date.toISOString().split('T', 1)[0];
}

function addDate(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return getDate(d);
}

export default async function fetchTransactions(
  accountUID: string,
  syncState: SyncState,
): Promise<TransactionBundle> {
  const client = new EBClient({
    api: EB_API,
    appID: EB_APP_ID,
    privateKey: EB_PRIVATE_KEY,
    privateKeyFile: EB_PRIVATE_KEY_FILE,
  });

  const dateTo = getDate(new Date());
  let { initial, date: dateFrom } = syncState;
  if (!initial) initial = addDate(dateTo, -SYNC_INITIAL_DAYS);
  if (!dateFrom) dateFrom = initial;
  else {
    dateFrom = addDate(dateFrom, -SYNC_OVERSCAN_DAYS);
    if (new Date(dateFrom) < new Date(initial)) dateFrom = initial;
  }

  const allTransactions = [];
  let { transactions, next } = await client.getTransactions({
    accountUID,
    dateFrom,
    dateTo,
    transactionStatus: 'BOOK',
  });
  allTransactions.push(...transactions);
  while (next) {
    ({ transactions, next } = await next());
    allTransactions.push(...transactions);
  }

  return {
    state: { initial, date: dateTo },
    transactions: allTransactions.map((transaction) => {
      let amount = Math.round(
        parseFloat(transaction.transaction_amount.amount) * 100 || 0,
      );
      if (transaction.credit_debit_indicator === 'DBIT') amount *= -1;

      const payee =
        transaction.credit_debit_indicator === 'DBIT'
          ? transaction.creditor?.name
          : transaction.debtor?.name;

      const notes =
        [transaction.remittance_information, transaction.note]
          .flat(1)
          .filter(Boolean)
          .join(' | ') || undefined;

      return {
        id: transaction.entry_reference,
        date: (transaction.booking_date ||
          transaction.value_date ||
          transaction.transaction_date)!,
        amount,
        currency: transaction.transaction_amount.currency,
        payee,
        notes,
      } satisfies Transaction;
    }),
  };
}
