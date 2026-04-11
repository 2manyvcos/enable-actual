import type { Request, Response } from 'express';
import { removeIn, setIn } from 'immutable';
import { v7 as uuid } from 'uuid';
import type { output } from 'zod';
import IDResponse from '../../shared/schema/IDResponse.ts';
import SourceRequest from '../../shared/schema/SourceRequest.ts';
import type SourceResponse from '../../shared/schema/SourceResponse.ts';
import type SourceState from '../../shared/schema/SourceState.ts';
import SourceUpdate from '../../shared/schema/SourceUpdate.ts';
import {
  applyEnableBankingSourceRequest,
  applyEnableBankingSourceUpdate,
  getEnableBankingSourceResponse,
} from '../integrations/enablebanking/api/sources.ts';
import { loadState, putState } from '../state.ts';

export async function getSources(_req: Request, res: Response): Promise<void> {
  const { sources } = loadState();

  let response: output<typeof SourceResponse>[];
  try {
    response = await Promise.all(
      Object.entries(sources)
        .filter(([, value]) => value)
        .map(async ([sourceID, source]) => {
          switch (source!.type) {
            case 'enablebanking':
              return await getEnableBankingSourceResponse(sourceID, source!);
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

export async function postSources(req: Request, res: Response): Promise<void> {
  let request: output<typeof SourceRequest>;
  try {
    request = SourceRequest.parse(req.body);
  } catch (error) {
    console.debug('Schema violation:', error);
    res.sendStatus(400);
    return;
  }

  const sourceID = uuid();

  let source: output<typeof SourceState>;
  try {
    switch (request.type) {
      case 'enablebanking':
        source = await applyEnableBankingSourceRequest(request);
        break;
    }
  } catch (error) {
    console.debug('Implementation rejection:', error);
    res.sendStatus(400);
    return;
  }

  putState((prev) => setIn(prev, ['sources', sourceID], source));

  res.send({ id: sourceID } satisfies output<typeof IDResponse>);
}

export async function getSourcesByID(
  req: Request,
  res: Response,
): Promise<void> {
  const sourceID = req.params.sourceID.toString();

  const { sources } = loadState();

  if (!Object.hasOwn(sources, sourceID)) {
    res.sendStatus(404);
    return;
  }

  const source = sources[sourceID]!;

  let response: output<typeof SourceResponse>;
  try {
    switch (source.type) {
      case 'enablebanking':
        response = await getEnableBankingSourceResponse(sourceID, source);
        break;
    }
  } catch (error) {
    console.debug('Implementation rejection:', error);
    res.sendStatus(400);
    return;
  }

  res.send(response);
}

export async function putSourcesByID(
  req: Request,
  res: Response,
): Promise<void> {
  const sourceID = req.params.sourceID.toString();

  const { sources } = loadState();

  if (!Object.hasOwn(sources, sourceID)) {
    res.sendStatus(404);
    return;
  }

  const source = sources[sourceID]!;

  let update: output<typeof SourceUpdate>;
  try {
    update = SourceUpdate.parse(req.body);
    if (source.type !== update.type) throw new Error('type mismatch');
  } catch (error) {
    console.debug('Schema violation:', error);
    res.sendStatus(400);
    return;
  }

  let nextSource: output<typeof SourceState>;
  try {
    switch (update.type) {
      case 'enablebanking':
        nextSource = await applyEnableBankingSourceUpdate(source, update);
        break;
    }
  } catch (error) {
    console.debug('Implementation rejection:', error);
    res.sendStatus(400);
    return;
  }

  putState((prev) => setIn(prev, ['sources', sourceID], nextSource));

  res.sendStatus(200);
}

export function deleteSourcesByID(req: Request, res: Response): void {
  const sourceID = req.params.sourceID.toString();

  const { sources } = loadState();

  if (!Object.hasOwn(sources, sourceID)) {
    res.sendStatus(404);
    return;
  }

  putState((prev) => removeIn(prev, ['sources', sourceID]));

  res.sendStatus(200);
}
