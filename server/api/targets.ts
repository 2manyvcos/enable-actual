import type { Request, Response } from 'express';
import { removeIn, setIn } from 'immutable';
import { v7 as uuid } from 'uuid';
import type { output } from 'zod';
import IDResponse from '../../shared/schema/IDResponse.ts';
import TargetRequest from '../../shared/schema/TargetRequest.ts';
import type TargetResponse from '../../shared/schema/TargetResponse.ts';
import type TargetState from '../../shared/schema/TargetState.ts';
import TargetUpdate from '../../shared/schema/TargetUpdate.ts';
import {
  applyActualBudgetTargetRequest,
  applyActualBudgetTargetUpdate,
  getActualBudgetTargetResponse,
} from '../integrations/actualbudget/api/targets.ts';
import { loadState, putState } from '../state.ts';

export async function getTargets(_req: Request, res: Response): Promise<void> {
  const { targets } = loadState();

  let response: output<typeof TargetResponse>[];
  try {
    response = await Promise.all(
      Object.entries(targets)
        .filter(([, value]) => value)
        .map(async ([targetID, target]) => {
          switch (target!.type) {
            case 'actualbudget':
              return await getActualBudgetTargetResponse(targetID, target!);
          }
        }),
    );
  } catch (error) {
    console.debug('Implementation rejection:', error);
    res.sendStatus(500);
    return;
  }

  res.send(response);
}

export async function postTargets(req: Request, res: Response): Promise<void> {
  let request: output<typeof TargetRequest>;
  try {
    request = TargetRequest.parse(req.body);
  } catch (error) {
    console.debug('Schema violation:', error);
    res.sendStatus(400);
    return;
  }

  const targetID = uuid();

  let target: output<typeof TargetState>;
  try {
    switch (request.type) {
      case 'actualbudget':
        target = await applyActualBudgetTargetRequest(request);
        break;
    }
  } catch (error) {
    console.debug('Implementation rejection:', error);
    res.sendStatus(400);
    return;
  }

  putState((prev) => setIn(prev, ['targets', targetID], target));

  res.send({ id: targetID } satisfies output<typeof IDResponse>);
}

export async function getTargetsByID(
  req: Request,
  res: Response,
): Promise<void> {
  const targetID = req.params.targetID.toString();

  const { targets } = loadState();

  if (!Object.hasOwn(targets, targetID)) {
    res.sendStatus(404);
    return;
  }

  const target = targets[targetID]!;

  let response: output<typeof TargetResponse>;
  try {
    switch (target.type) {
      case 'actualbudget':
        response = await getActualBudgetTargetResponse(targetID, target);
        break;
    }
  } catch (error) {
    console.debug('Implementation rejection:', error);
    res.sendStatus(400);
    return;
  }

  res.send(response);
}

export async function putTargetsByID(
  req: Request,
  res: Response,
): Promise<void> {
  const targetID = req.params.targetID.toString();

  const { targets } = loadState();

  if (!Object.hasOwn(targets, targetID)) {
    res.sendStatus(404);
    return;
  }

  const target = targets[targetID]!;

  let update: output<typeof TargetUpdate>;
  try {
    update = TargetUpdate.parse(req.body);
    if (target.type !== update.type) throw new Error('type mismatch');
  } catch (error) {
    console.debug('Schema violation:', error);
    res.sendStatus(400);
    return;
  }

  let nextTarget: output<typeof TargetState>;
  try {
    switch (update.type) {
      case 'actualbudget':
        nextTarget = await applyActualBudgetTargetUpdate(target, update);
        break;
    }
  } catch (error) {
    console.debug('Implementation rejection:', error);
    res.sendStatus(400);
    return;
  }

  putState((prev) => setIn(prev, ['targets', targetID], nextTarget));

  res.sendStatus(200);
}

export function deleteTargetsByID(req: Request, res: Response): void {
  const targetID = req.params.targetID.toString();

  const { targets } = loadState();

  if (!Object.hasOwn(targets, targetID)) {
    res.sendStatus(404);
    return;
  }

  putState((prev) => removeIn(prev, ['targets', targetID]));

  res.sendStatus(200);
}
