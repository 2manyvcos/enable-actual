const fs = require("fs");
const {
  EB_API,
  EB_APP_ID,
  EB_PRIVATE_KEY_FILE,
  SYNC_INITIAL_DAYS,
  SYNC_OVERSCAN_DAYS,
} = require("../config");
const EBClient = require("./client");

function getDate(date) {
  return date.toISOString().split("T", 1)[0];
}

function addDate(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return getDate(d);
}

async function fetchTransactions(accountUID, syncState) {
  const client = new EBClient({
    api: EB_API,
    appID: EB_APP_ID,
    privateKey: fs.readFileSync(EB_PRIVATE_KEY_FILE, "utf8"),
  });

  const dateTo = getDate(new Date());
  let { date: dateFrom } = syncState;
  if (dateFrom) dateFrom = addDate(dateFrom, -SYNC_OVERSCAN_DAYS);
  else dateFrom = addDate(dateTo, -SYNC_INITIAL_DAYS);

  let { transactions, next } = await client.getTransactions({
    uid: accountUID,
    dateFrom,
    dateTo,
    transactionStatus: "BOOK",
  });
  while (next) {
    let nextTransactions;
    ({ transactions: nextTransactions, next } = await next());
    transactions.push(...nextTransactions);
  }

  return { state: { date: dateTo }, transactions };
}

module.exports = fetchTransactions;
