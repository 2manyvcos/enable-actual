const fs = require("fs");
const api = require("@actual-app/api");
const {
  ACTUAL_DATA_DIR,
  ACTUAL_BUDGET_ID,
  ACTUAL_BUDGET_PASSWORD,
  ACTUAL_PASSWORD,
  ACTUAL_URL,
  ACTUAL_ACCOUNT_ID,
} = require("../config");
const notify = require("../notify");

async function importTransactions(transactions) {
  fs.mkdirSync(ACTUAL_DATA_DIR, { recursive: true });

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
    transactions.map((transaction) => {
      let amount = Math.round(
        parseFloat(transaction.transaction_amount?.amount) * 100 || 0,
      );
      if (transaction.credit_debit_indicator === "DBIT") {
        amount *= -1;
      }

      const payee =
        transaction.credit_debit_indicator === "DBIT"
          ? transaction.creditor?.name
          : transaction.debtor?.name;

      const notes = [transaction.remittance_information, transaction.note]
        .flat(1)
        .filter(Boolean)
        .join(" | ");

      return {
        date:
          transaction.booking_date ||
          transaction.value_date ||
          transaction.transaction_date,
        amount,
        payee_name: payee,
        imported_payee: payee,
        notes,
        imported_id: transaction.entry_reference,
      };
    }),
    {
      reimportDeleted: false,
      defaultCleared: true,
    },
  );

  console.log(
    `Added ${added.length} and updated ${updated.length} transactions`,
  );

  errors?.forEach((err) => {
    notify(`Importing transactions failed: ${err.message ?? err}`);
  });

  await api.shutdown();
}

module.exports = importTransactions;
