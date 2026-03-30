const { PUBLIC_URL, SESSION_EXPIRY_WARNING } = require("./config");
const fetchTransactions = require("./eb/fetchTransactions");
const importTransactions = require("./actual/importTransactions");
const notify = require("./notify");
const { loadState, putState } = require("./state");

async function sync() {
  console.log(`Starting sync at ${new Date().toLocaleString()}…`);

  const { source, sync } = loadState();

  if (!source) {
    notify(
      "There is no account session configured yet. Please authenticate.",
      new URL("auth", PUBLIC_URL).href,
    );
    return;
  }

  if (source.expiry && SESSION_EXPIRY_WARNING > 0) {
    const now = Date.now();
    const expiry = new Date(source.expiry);
    const warning = expiry.getTime() - SESSION_EXPIRY_WARNING;
    if (now >= warning) {
      const remainingDays = Math.floor(
        Math.max(0, expiry.getTime() - now) / (24 * 60 * 60 * 1000),
      );

      notify(
        `Your account session expires in ${remainingDays} days. Please don't forget to reauthenticate in time.`,
        new URL("auth", PUBLIC_URL).href,
      );
    }
  }

  const results = await Promise.all(
    source.accountUIDs?.map(async (accountUID) => {
      const syncState = sync?.[accountUID] ?? {};
      try {
        console.log(`Fetching transactions for account ${accountUID}…`);
        const { state, transactions } = await fetchTransactions(
          accountUID,
          syncState,
        );
        return { accountUID, state, transactions };
      } catch (err) {
        notify(`Syncing account ${accountUID} failed: ${err.message ?? err}`);
        return { accountUID, state: syncState, transactions: [] };
      }
    }) ?? [],
  );

  const transactions = results.flatMap((result) => result.transactions);
  if (!transactions.length) {
    console.log("No new transactions found to be imported");
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

module.exports = sync;
