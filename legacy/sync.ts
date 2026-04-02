import importTransactions from './actual/importTransactions.ts';
import checkSession from './checkSession.ts';
import fetchTransactions from './eb/fetchTransactions.ts';
import notify from './notify.ts';
import { loadState, putState } from './state.ts';

export default async function sync() {
  console.log(`Starting sync at ${new Date().toLocaleString()}…`);

  const { source, sync } = loadState();

  if (!checkSession(source) || !source) return;

  const results = await Promise.all(
    source.accountUIDs.map(async (accountUID) => {
      const syncState = sync?.[accountUID] ?? {};
      try {
        console.log(`Fetching transactions for account ${accountUID}…`);
        const { state, transactions } = await fetchTransactions(
          accountUID,
          syncState,
        );
        return { accountUID, state, transactions };
      } catch (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        err: any
      ) {
        notify(`Syncing account ${accountUID} failed: ${err.message ?? err}`);
        return { accountUID, state: syncState, transactions: [] };
      }
    }) ?? [],
  );

  const transactions = results.flatMap((result) => result.transactions);
  if (!transactions.length) {
    console.log('No new transactions found to be imported');
  } else {
    console.log(
      `Importing ${transactions.length} transactions to Actual Budget…`,
    );
    await importTransactions(transactions);
  }

  putState({
    sync: Object.fromEntries(
      results.map((result) => [result.accountUID, result.state]),
    ),
  });

  console.log(`Done syncing ${source.accountUIDs?.length ?? 0} accounts`);
}
