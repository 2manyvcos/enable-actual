import { merge, update, updateIn } from 'immutable';
import { v7 as uuid } from 'uuid';
import { type output } from 'zod';
import ImportReport from '../../shared/schema/ImportReport.ts';
import type ResolvedTransaction from '../../shared/schema/ResolvedTransaction.ts';
import type ScheduleImportAccountState from '../../shared/schema/ScheduleImportAccountState.ts';
import ScheduleImportState from '../../shared/schema/ScheduleImportState.ts';
import type Transaction from '../../shared/schema/Transaction.ts';
import type TransactionBundle from '../../shared/schema/TransactionBundle.ts';
import { stringifyError } from '../../shared/utils.ts';
import { HISTORY_LENGTH, PUBLIC_URL } from '../config.ts';
import { putHistory } from '../history.ts';
import { importActualBudgetTransactions } from '../integrations/actualbudget/transactions.ts';
import { resolveEnableBankingTransactions } from '../integrations/enablebanking/transactions.ts';
import notify from '../notify.ts';
import { loadState, putState } from '../state.ts';

export default function createImportJob(
  scheduleID: string,
): () => Promise<void> {
  return async () => {
    console.debug(`Running import job for ${scheduleID}`);

    const {
      sources,
      targets,
      schedules,
      notifications: { alerts },
    } = loadState();

    const schedule = schedules[scheduleID];
    if (!schedule) {
      console.debug(`Schedule "${scheduleID}" not found`);
      return;
    }

    const report = ImportReport.decode({ id: uuid(), time: new Date() });

    const bundles: {
      [sourceID: string]:
        | {
            [sourceAccountID: string]: output<typeof Transaction>[] | undefined;
          }
        | undefined;
    } = {};

    const stateUpdates: {
      [sourceID: string]:
        | {
            [sourceAccountID: string]:
              | output<typeof ScheduleImportAccountState>
              | undefined;
          }
        | undefined;
    } = {};

    await Promise.all(
      Object.entries(
        Object.groupBy(schedule.accounts, ({ sourceID }) => sourceID),
      ).map(async ([sourceID, accounts]): Promise<void> => {
        if (!Object.hasOwn(sources, sourceID)) {
          report.errors.push(`Source "${sourceID}" not found`);
          return;
        }

        const source = sources[sourceID]!;
        const sourceAccountIDs = Object.keys(
          Object.groupBy(accounts!, ({ sourceAccountID }) => sourceAccountID),
        );

        let results: output<typeof TransactionBundle>[];
        try {
          switch (source.type) {
            case 'enablebanking':
              results = await resolveEnableBankingTransactions({
                scheduleID,
                schedule,
                report,
                sourceID,
                source,
                sourceAccountIDs,
                state:
                  schedule.state[sourceID] ?? ScheduleImportState.decode({}),
              });
              break;
          }
        } catch (error) {
          report.errors.push(
            `Error fetching transactions for source "${sourceID}": ${stringifyError(
              error,
            )}`,
          );
          return;
        }

        results.forEach(({ sourceAccountID, transactions, state }) => {
          if (!Object.hasOwn(stateUpdates, sourceID))
            stateUpdates[sourceID] = {};
          stateUpdates[sourceID]![sourceAccountID] = state;

          if (!transactions.length) return;

          if (!Object.hasOwn(bundles, sourceID)) bundles[sourceID] = {};
          bundles[sourceID]![sourceAccountID] = transactions;
        });
      }),
    );

    await Promise.all(
      Object.entries(
        Object.groupBy(schedule.accounts, ({ targetID }) => targetID),
      ).map(async ([targetID, accounts]): Promise<void> => {
        if (!Object.hasOwn(targets, targetID)) {
          report.errors.push(`Target "${targetID}" not found`);
          return;
        }

        const target = targets[targetID]!;
        const targetAccounts = Object.entries(
          Object.groupBy(accounts!, ({ targetAccountID }) => targetAccountID),
        )
          .map(([targetAccountID, accounts]) => ({
            targetAccountID,
            transactions: accounts!.flatMap(
              ({ sourceID, sourceAccountID }) =>
                bundles[sourceID]?.[sourceAccountID]?.map(
                  (transaction): output<typeof ResolvedTransaction> => ({
                    sourceID,
                    sourceAccountID,
                    targetID,
                    targetAccountID,
                    details: transaction,
                  }),
                ) ?? [],
            ),
          }))
          .filter(({ transactions }) => transactions.length);

        if (!targetAccounts.length) return;

        report.resolvedTransactions.push(
          ...targetAccounts.flatMap(({ transactions }) => transactions),
        );

        let success = false;
        try {
          switch (target.type) {
            case 'actualbudget':
              success = await importActualBudgetTransactions({
                scheduleID,
                schedule,
                report,
                targetID,
                target,
                targetAccounts,
              });
              break;
          }
        } catch (error) {
          report.errors.push(
            `Error importing transactions into target "${targetID}": ${stringifyError(
              error,
            )}`,
          );
          return;
        }

        if (!success) {
          targetAccounts.forEach(({ transactions }) => {
            transactions.forEach(({ sourceID, sourceAccountID }) => {
              if (!Object.hasOwn(stateUpdates, sourceID)) return;
              delete stateUpdates[sourceID]![sourceAccountID];
            });
          });
        }
      }),
    );

    console.debug(
      'Done importing transactions:',
      JSON.stringify(report, null, 2),
    );

    putState((prev) =>
      Object.entries(stateUpdates).reduce(
        (nextState, [sourceID, accounts]) =>
          updateIn(
            nextState,
            ['schedules', scheduleID, 'state', sourceID, 'accounts'],
            (prevAccounts) => merge(prevAccounts ?? {}, accounts!),
          ),
        prev,
      ),
    );

    putHistory((prev) =>
      update(prev, 'entries', (prevEntries) =>
        [report, ...prevEntries].slice(0, HISTORY_LENGTH),
      ),
    );

    if (
      (report.importedTransactions || report.updatedTransactions) &&
      alerts.successfulImports
    ) {
      notify({
        message: report.updatedTransactions
          ? report.importedTransactions
            ? `${report.importedTransactions.toLocaleString()} new transactions have been successfully imported and ${report.updatedTransactions.toLocaleString()} have been updated.`
            : `${report.updatedTransactions.toLocaleString()} transactions have been successfully updated.`
          : `${report.importedTransactions.toLocaleString()} new transactions have been successfully imported.`,
        action: new URL(
          `?${new URLSearchParams({ preview: report.id })}#history`,
          PUBLIC_URL,
        ).href,
      });
    }

    if (
      (report.errors.length || report.rejectedTransactions.length) &&
      alerts.unsuccessfulImports
    ) {
      notify({
        message: 'Issues occurred while importing transactions.',
        action: new URL(
          `?${new URLSearchParams({ preview: report.id })}#history`,
          PUBLIC_URL,
        ).href,
      });
    }
  };
}
