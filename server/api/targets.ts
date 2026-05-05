import type { Request, Response } from 'express';
import { removeIn, setIn } from 'immutable';
import { v7 as uuid } from 'uuid';
import type { output } from 'zod';
import IDResponse from '../../shared/schema/IDResponse.ts';
import type Issue from '../../shared/schema/Issue.ts';
import type State from '../../shared/schema/State.ts';
import type TargetAccount from '../../shared/schema/TargetAccount.ts';
import TargetRequest from '../../shared/schema/TargetRequest.ts';
import type TargetResponse from '../../shared/schema/TargetResponse.ts';
import type TargetState from '../../shared/schema/TargetState.ts';
import TargetUpdate from '../../shared/schema/TargetUpdate.ts';
import {
  applyActualBudgetTargetRequest,
  applyActualBudgetTargetUpdate,
  getActualBudgetTargetAccounts,
  getActualBudgetTargetIssues,
  getActualBudgetTargetResponse,
} from '../integrations/actualbudget/targets.ts';
import { loadState, putState } from '../state.ts';
import APIError from './APIError.ts';
import { publishEvent } from './events.ts';

export async function getTargetResponse(
  id: string,
  target: output<typeof TargetState>,
): Promise<output<typeof TargetResponse>> {
  switch (target.type) {
    case 'actualbudget':
      return await getActualBudgetTargetResponse(id, target);
  }
}

export async function applyTargetRequest(
  request: output<typeof TargetRequest>,
): Promise<output<typeof TargetState>> {
  switch (request.type) {
    case 'actualbudget':
      return await applyActualBudgetTargetRequest(request);
  }
}

export async function applyTargetUpdate(
  target: output<typeof TargetState>,
  update: output<typeof TargetUpdate>,
): Promise<output<typeof TargetState>> {
  if (target.type !== update.type) throw new APIError('Type mismatch', 400);

  switch (update.type) {
    case 'actualbudget':
      return await applyActualBudgetTargetUpdate(target, update);
  }
}

export async function getTargetIssues(
  id: string,
  target: output<typeof TargetState>,
  state: output<typeof State>,
): Promise<output<typeof Issue>[]> {
  switch (target.type) {
    case 'actualbudget':
      return await getActualBudgetTargetIssues(id, target, state);
  }
}

export async function getTargetAccounts(
  id: string,
  target: output<typeof TargetState>,
): Promise<output<typeof TargetAccount>[]> {
  switch (target.type) {
    case 'actualbudget':
      return await getActualBudgetTargetAccounts(id, target);
  }
}

export async function getTargets(_req: Request, res: Response): Promise<void> {
  const { targets } = loadState();

  const response: output<typeof TargetResponse>[] = await Promise.all(
    Object.entries(targets)
      .filter(([, target]) => target)
      .map(async ([targetID, target]) => getTargetResponse(targetID, target!)),
  );

  res.send(response);
}

export async function postTargets(req: Request, res: Response): Promise<void> {
  let request: output<typeof TargetRequest>;
  try {
    request = TargetRequest.parse(req.body);
  } catch (error) {
    throw new APIError(error, 400, 'Schema violation');
  }

  const targetID = uuid();
  const target = await applyTargetRequest(request);

  putState((prev) => setIn(prev, ['targets', targetID], target));

  publishEvent();

  res.send({ id: targetID } satisfies output<typeof IDResponse>);
}

export async function getTargetsByID(
  req: Request,
  res: Response,
): Promise<void> {
  const targetID = req.params.targetID.toString();

  const { targets } = loadState();

  const target = targets[targetID];
  if (!Object.hasOwn(targets, targetID) || !target) {
    throw new APIError(`Target "${targetID}" not found`, 404);
  }

  const response = await getTargetResponse(targetID, target);

  res.send(response);
}

export async function putTargetsByID(
  req: Request,
  res: Response,
): Promise<void> {
  const targetID = req.params.targetID.toString();

  const { targets } = loadState();

  const target = targets[targetID];
  if (!Object.hasOwn(targets, targetID) || !target) {
    throw new APIError(`Target "${targetID}" not found`, 404);
  }

  let update: output<typeof TargetUpdate>;
  try {
    update = TargetUpdate.parse(req.body);
  } catch (error) {
    throw new APIError(error, 400, 'Schema violation');
  }

  if (target.type !== update.type) throw new APIError('Type mismatch', 400);

  const nextTarget = await applyTargetUpdate(target, update);

  putState((prev) => setIn(prev, ['targets', targetID], nextTarget));

  publishEvent();

  res.sendStatus(200);
}

export function deleteTargetsByID(req: Request, res: Response): void {
  const targetID = req.params.targetID.toString();

  const { targets } = loadState();

  if (!Object.hasOwn(targets, targetID)) {
    throw new APIError(`Target "${targetID}" not found`, 404);
  }

  putState((prev) => removeIn(prev, ['targets', targetID]));

  publishEvent();

  res.sendStatus(200);
}

export async function getTargetsByIDAccounts(
  req: Request,
  res: Response,
): Promise<void> {
  const targetID = req.params.targetID.toString();

  const { targets } = loadState();

  const target = targets[targetID];
  if (!Object.hasOwn(targets, targetID) || !target) {
    throw new APIError(`Target "${targetID}" not found`, 404);
  }

  const response = await getTargetAccounts(targetID, target);

  res.send(response);
}
