/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * For better debugging possibilities, reports now contain the original source transaction dataset.
 * Also errors contain more details and the names of sources, targets and corresponding accounts are added for better readability.
 * This migration function applies these specified changes.
 * This migration step updates history version to 2.
 */
export default function history202605050(history: any): unknown {
  if (history.version !== 1) return history;

  history.version = 2;

  if (Array.isArray(history?.entries)) {
    history.entries = history.entries.map((entry: any) => {
      if (!entry) return entry;

      entry.sources = {};
      entry.targets = {};

      if (Array.isArray(entry.errors)) {
        entry.errors = entry.errors.map((message: any) => ({ message }));
      }

      if (Array.isArray(entry.rejectedTransactions)) {
        entry.rejectedTransactions = entry.rejectedTransactions.map(
          (transaction: any) => {
            if (transaction?.details && !transaction.details.raw) {
              transaction.details.raw = '';
            }

            return transaction;
          },
        );
      }

      if (Array.isArray(entry.resolvedTransactions)) {
        entry.resolvedTransactions = entry.resolvedTransactions.map(
          (transaction: any) => {
            if (transaction?.details && !transaction.details.raw) {
              transaction.details.raw = '';
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
