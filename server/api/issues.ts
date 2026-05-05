import type { Request, Response } from 'express';
import type { output } from 'zod';
import type Issue from '../../shared/schema/Issue.ts';
import { stringifyError } from '../../shared/utils.ts';
import { loadState } from '../state.ts';
import { getScheduleIssues } from './schedules.ts';
import { getSourceIssues } from './sources.ts';
import { getTargetIssues } from './targets.ts';

export async function getIssues(_req: Request, res: Response): Promise<void> {
  const state = loadState();

  const issues: output<typeof Issue>[] = [];

  if (!Object.values(state.sources).filter(Boolean).length) {
    issues.push({
      description: 'You have no sources configured yet!',
      action: 'create',
      actionLabel: 'Setup your first source',
      resource: 'sources',
    });
  }

  issues.push(
    ...(
      await Promise.all(
        Object.entries(state.sources)
          .filter(([, source]) => source)
          .map(async ([sourceID, source]) => {
            try {
              return await getSourceIssues(sourceID, source!, state);
            } catch (error) {
              console.debug(`Error resolving issues: ${stringifyError(error)}`);
              return [];
            }
          }),
      )
    ).flat(1),
  );

  if (!Object.values(state.targets).filter(Boolean).length) {
    issues.push({
      description: 'You have no targets configured yet!',
      action: 'create',
      actionLabel: 'Setup your first target',
      resource: 'targets',
    });
  }

  issues.push(
    ...(
      await Promise.all(
        Object.entries(state.targets)
          .filter(([, target]) => target)
          .map(async ([targetID, target]) => {
            try {
              return await getTargetIssues(targetID, target!, state);
            } catch (error) {
              console.debug(`Error resolving issues: ${stringifyError(error)}`);
              return [];
            }
          }),
      )
    ).flat(1),
  );

  if (!Object.values(state.schedules).filter(Boolean).length) {
    issues.push({
      description: 'You have no schedules configured yet!',
      action: 'create',
      actionLabel: 'Setup your first schedule',
      resource: 'schedules',
    });
  }

  issues.push(
    ...(
      await Promise.all(
        Object.entries(state.schedules)
          .filter(([, schedule]) => schedule)
          .map(async ([scheduleID, schedule]) => {
            try {
              return await getScheduleIssues(scheduleID, schedule!, state);
            } catch (error) {
              console.debug(`Error resolving issues: ${stringifyError(error)}`);
              return [];
            }
          }),
      )
    ).flat(1),
  );

  res.send(issues);
}
