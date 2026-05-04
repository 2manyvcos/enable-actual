/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * A bug caused accounts to sometimes have `id` and / or `payee` to be set to null which isn't allowed by the schema.
 */
export default function history20260504(history: any): unknown {
  if (Array.isArray(history?.entries)) {
    history.entries = history.entries.map((entry: any) => {
      if (Array.isArray(entry?.rejectedTransactions)) {
        entry.rejectedTransactions = entry.rejectedTransactions.map(
          (transaction: any) => {
            if (transaction?.details) {
              if (transaction.details.id === null)
                delete transaction.details.id;

              if (transaction.details.payee === null)
                delete transaction.details.payee;
            }

            return transaction;
          },
        );
      }

      if (Array.isArray(entry?.resolvedTransactions)) {
        entry.resolvedTransactions = entry.resolvedTransactions.map(
          (transaction: any) => {
            if (transaction?.details) {
              if (transaction.details.id === null)
                delete transaction.details.id;

              if (transaction.details.payee === null)
                delete transaction.details.payee;
            }

            return transaction;
          },
        );
      }

      return entry;
    });
  }

  return history;
}
