import { merge, update, updateIn } from 'immutable';
import { v7 as uuid } from 'uuid';
import { type output } from 'zod';
import ImportReport from '../../shared/schema/ImportReport.ts';
import type RejectedTransaction from '../../shared/schema/RejectedTransaction.ts';
import type ResolvedTransaction from '../../shared/schema/ResolvedTransaction.ts';
import type ScheduleImportAccountState from '../../shared/schema/ScheduleImportAccountState.ts';
import ScheduleImportState from '../../shared/schema/ScheduleImportState.ts';
import type Transaction from '../../shared/schema/Transaction.ts';
import type TransactionBundle from '../../shared/schema/TransactionBundle.ts';
import { stringifyError } from '../../shared/utils.ts';
import { publishEvent } from '../api/events.ts';
import { getScheduleResponse } from '../api/schedules.ts';
import { getSourceAccounts, getSourceResponse } from '../api/sources.ts';
import { getTargetAccounts, getTargetResponse } from '../api/targets.ts';
import { HISTORY_LENGTH, PUBLIC_URL } from '../config.ts';
import { putHistory } from '../history.ts';
import { importActualBudgetTransactions } from '../integrations/actualbudget/transactions.ts';
import { resolveEnableBankingTransactions } from '../integrations/enablebanking/transactions.ts';
import notify from '../notify.ts';
import { loadState, putState } from '../state.ts';
import { parseTemplate } from '../templates.ts';

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

    const report = ImportReport.decode({
      id: uuid(),
      time: new Date(),
      scheduleID,
      scheduleName: (await getScheduleResponse(scheduleID, schedule)).name,
      sources: Object.fromEntries(
        await Promise.all(
          Object.entries(
            Object.groupBy(schedule.accounts, ({ sourceID }) => sourceID),
          )
            .filter(
              ([sourceID]) =>
                Object.hasOwn(sources, sourceID) && sources[sourceID],
            )
            .map(async ([sourceID, accounts]) => {
              const source = sources[sourceID]!;
              const accountNames = Object.fromEntries(
                (await getSourceAccounts(sourceID, source))?.map(
                  ({ id, name }) => [id, name],
                ) ?? [],
              );

              return [
                sourceID,
                {
                  name: (await getSourceResponse(sourceID, source)).name,
                  accounts: Object.fromEntries(
                    Object.keys(
                      Object.groupBy(
                        accounts ?? [],
                        ({ sourceAccountID }) => sourceAccountID,
                      ),
                    )
                      .filter(
                        (sourceAccountID) =>
                          Object.hasOwn(accountNames, sourceAccountID) &&
                          accountNames[sourceAccountID],
                      )
                      .map((sourceAccountID) => [
                        sourceAccountID,
                        { name: accountNames[sourceAccountID] },
                      ]),
                  ),
                },
              ];
            }),
        ),
      ),
      targets: Object.fromEntries(
        await Promise.all(
          Object.entries(
            Object.groupBy(schedule.accounts, ({ targetID }) => targetID),
          )
            .filter(
              ([targetID]) =>
                Object.hasOwn(targets, targetID) && targets[targetID],
            )
            .map(async ([targetID, accounts]) => {
              const target = targets[targetID]!;
              const accountNames = Object.fromEntries(
                (await getTargetAccounts(targetID, target))?.map(
                  ({ id, name }) => [id, name],
                ) ?? [],
              );

              return [
                targetID,
                {
                  name: (await getTargetResponse(targetID, target)).name,
                  accounts: Object.fromEntries(
                    Object.keys(
                      Object.groupBy(
                        accounts ?? [],
                        ({ targetAccountID }) => targetAccountID,
                      ),
                    )
                      .filter(
                        (targetAccountID) =>
                          Object.hasOwn(accountNames, targetAccountID) &&
                          accountNames[targetAccountID],
                      )
                      .map((targetAccountID) => [
                        targetAccountID,
                        { name: accountNames[targetAccountID] },
                      ]),
                  ),
                },
              ];
            }),
        ),
      ),
    });

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
        const source = sources[sourceID];
        if (!Object.hasOwn(sources, sourceID) || !source) {
          report.errors.push({ message: `Source "${sourceID}" not found` });
          return;
        }

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
          report.errors.push({
            message: `Error fetching transactions: ${stringifyError(error)}`,
            sourceID,
          });
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
        const target = targets[targetID];
        if (!Object.hasOwn(targets, targetID) || !target) {
          report.errors.push({ message: `Target "${targetID}" not found` });
          return;
        }

        let success = true;

        const targetAccounts = (
          await Promise.all(
            Object.entries(
              Object.groupBy(
                accounts!,
                ({ targetAccountID }) => targetAccountID,
              ),
            ).map(async ([targetAccountID, accounts]) => ({
              targetAccountID,
              transactions: await Promise.all(
                accounts!.flatMap(
                  ({ sourceID, sourceAccountID, templates }) =>
                    bundles[sourceID]?.[sourceAccountID]?.map(
                      async (
                        details,
                      ): Promise<output<typeof ResolvedTransaction>> => {
                        const transaction = {
                          sourceID,
                          sourceAccountID,
                          targetID,
                          targetAccountID,
                          details,
                        };

                        try {
                          await Promise.all<void>([
                            (async () => {
                              if (!templates?.id) return;
                              transaction.details.id =
                                (await parseTemplate(templates.id, {
                                  data: JSON.parse(transaction.details.raw),
                                  default: transaction.details.id ?? null,
                                })) || undefined;
                            })(),

                            (async () => {
                              if (!templates?.payee) return;
                              transaction.details.payee =
                                (await parseTemplate(templates.payee, {
                                  data: JSON.parse(transaction.details.raw),
                                  default: transaction.details.payee ?? null,
                                })) || undefined;
                            })(),

                            (async () => {
                              if (!templates?.notes) return;
                              transaction.details.notes =
                                (await parseTemplate(templates.notes, {
                                  data: JSON.parse(transaction.details.raw),
                                  default: transaction.details.notes ?? null,
                                })) || undefined;
                            })(),
                          ]);
                        } catch (error) {
                          success = false;
                          report.rejectedTransactions.push({
                            sourceID: transaction.sourceID,
                            sourceAccountID: transaction.sourceAccountID,
                            reason: `Error applying template: ${stringifyError(error)}`,
                            details: transaction.details,
                          } satisfies output<typeof RejectedTransaction>);
                        }

                        return transaction;
                      },
                    ) ?? [],
                ),
              ),
            })),
          )
        ).filter(({ transactions }) => transactions.length);

        if (!targetAccounts.length) return;

        if (success) {
          report.resolvedTransactions.push(
            ...targetAccounts.flatMap(({ transactions }) => transactions),
          );

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
            success = false;
            report.errors.push({
              message: `Error importing transactions: ${stringifyError(error)}`,
              targetID,
            });
          }
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

    publishEvent();

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
          `?${new URLSearchParams({ preview: `report:${encodeURIComponent(report.id)}` })}#reports`,
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
          `?${new URLSearchParams({ preview: `report:${encodeURIComponent(report.id)}` })}#reports`,
          PUBLIC_URL,
        ).href,
      });
    }
  };
}
