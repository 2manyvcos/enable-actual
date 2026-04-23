import type { Request, Response } from 'express';
import type { output } from 'zod';
import type QuickAction from '../../shared/schema/QuickAction.ts';
import { stringifyError } from '../../shared/utils.ts';
import { getActualBudgetTargetQuickActions } from '../integrations/actualbudget/targets.ts';
import { getEnableBankingSourceQuickActions } from '../integrations/enablebanking/sources.ts';
import { loadState } from '../state.ts';
import { getScheduleQuickActions } from './schedules.ts';

export async function getQuickActions(
  _req: Request,
  res: Response,
): Promise<void> {
  const { sources, targets, schedules } = loadState();

  const quickActions: output<typeof QuickAction>[] = [];

  if (!Object.values(sources).filter(Boolean).length) {
    quickActions.push({
      description: 'You have no sources configured yet!',
      action: 'Setup your first source',
      resource: 'sources',
    });
  }

  quickActions.push(
    ...(
      await Promise.all(
        Object.entries(sources)
          .filter(([, value]) => value)
          .map(async ([sourceID, source]) => {
            switch (source!.type) {
              case 'enablebanking':
                try {
                  return await getEnableBankingSourceQuickActions(
                    sourceID,
                    source!,
                  );
                } catch (error) {
                  console.debug(
                    `Error resolving quick actions: ${stringifyError(error)}`,
                  );
                  return [];
                }
            }
          }),
      )
    ).flat(1),
  );

  if (!Object.values(targets).filter(Boolean).length) {
    quickActions.push({
      description: 'You have no targets configured yet!',
      action: 'Setup your first target',
      resource: 'targets',
    });
  }

  quickActions.push(
    ...(
      await Promise.all(
        Object.entries(targets)
          .filter(([, value]) => value)
          .map(async ([targetID, target]) => {
            switch (target!.type) {
              case 'actualbudget':
                try {
                  return await getActualBudgetTargetQuickActions(
                    targetID,
                    target!,
                  );
                } catch (error) {
                  console.debug(
                    `Error resolving quick actions: ${stringifyError(error)}`,
                  );
                  return [];
                }
            }
          }),
      )
    ).flat(1),
  );

  if (!Object.values(schedules).filter(Boolean).length) {
    quickActions.push({
      description: 'You have no schedules configured yet!',
      action: 'Setup your first schedule',
      resource: 'schedules',
    });
  }

  quickActions.push(
    ...(
      await Promise.all(
        Object.entries(schedules)
          .filter(([, value]) => value)
          .map(async ([scheduleID, schedule]) => {
            try {
              return await getScheduleQuickActions(scheduleID, schedule!);
            } catch (error) {
              console.debug(
                `Error resolving quick actions: ${stringifyError(error)}`,
              );
              return [];
            }
          }),
      )
    ).flat(1),
  );

  res.send(quickActions);
}
