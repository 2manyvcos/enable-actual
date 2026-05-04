import type { Request, Response } from 'express';
import type { output } from 'zod';
import type ActualBudgetBudget from '../../../shared/schema/ActualBudgetBudget.ts';
import APIError from '../../api/APIError.ts';
import { loadState } from '../../state.ts';
import ABClient, { closeABWorker } from './ABClient.ts';
import { ABError } from './ABClient.types.ts';

export async function postTargetsByIDActualBudgetConnection(
  req: Request,
  res: Response,
): Promise<void> {
  const targetID = req.params.targetID.toString();

  const { targets } = loadState();

  if (!Object.hasOwn(targets, targetID)) {
    throw new APIError(`Target "${targetID}" not found`, 404);
  }

  const target = targets[targetID];

  if (target?.type !== 'actualbudget') {
    throw new APIError('Type mismatch', 400);
  }

  try {
    await closeABWorker(target.url);

    const client = new ABClient({ url: target.url, password: target.password });

    await client.auth();

    res.sendStatus(200);
  } catch (error) {
    throw new APIError(
      error,
      (error as ABError)?.responsible === 'client' ? 400 : 500,
    );
  }
}

export async function getTargetsByIDActualBudgetBudgets(
  req: Request,
  res: Response,
): Promise<void> {
  const targetID = req.params.targetID.toString();

  const { targets } = loadState();

  if (!Object.hasOwn(targets, targetID)) {
    throw new APIError(`Target "${targetID}" not found`, 404);
  }

  const target = targets[targetID];

  if (target?.type !== 'actualbudget') {
    throw new APIError('Type mismatch', 400);
  }

  try {
    const client = new ABClient({ url: target.url, password: target.password });

    const budgets = await client.getBudgets();

    res.send(
      budgets
        .filter(({ state }) => state === 'remote')
        .map(
          ({ groupId, name, encryptKeyId }) =>
            ({ id: groupId, name, encrypted: !!encryptKeyId }) satisfies output<
              typeof ActualBudgetBudget
            >,
        ) satisfies output<typeof ActualBudgetBudget>[],
    );
  } catch (error) {
    throw new APIError(
      error,
      (error as ABError)?.responsible === 'client' ? 400 : 500,
    );
  }
}
