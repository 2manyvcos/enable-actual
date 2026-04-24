import type { Request, Response } from 'express';
import { removeIn, setIn } from 'immutable';
import { v7 as uuid } from 'uuid';
import type { output } from 'zod';
import IDResponse from '../../shared/schema/IDResponse.ts';
import type SourceAccount from '../../shared/schema/SourceAccount.ts';
import SourceRequest from '../../shared/schema/SourceRequest.ts';
import type SourceResponse from '../../shared/schema/SourceResponse.ts';
import type SourceState from '../../shared/schema/SourceState.ts';
import SourceUpdate from '../../shared/schema/SourceUpdate.ts';
import {
  applyEnableBankingSourceRequest,
  applyEnableBankingSourceUpdate,
  getEnableBankingSourceAccounts,
  getEnableBankingSourceResponse,
} from '../integrations/enablebanking/sources.ts';
import { loadState, putState } from '../state.ts';
import APIError from './APIError.ts';
import { publishEvent } from './events.ts';

export async function getSources(_req: Request, res: Response): Promise<void> {
  const { sources } = loadState();

  const response: output<typeof SourceResponse>[] = await Promise.all(
    Object.entries(sources)
      .filter(([, value]) => value)
      .map(async ([sourceID, source]) => {
        switch (source!.type) {
          case 'enablebanking':
            return await getEnableBankingSourceResponse(sourceID, source!);
        }
      }),
  );

  res.send(response);
}

export async function postSources(req: Request, res: Response): Promise<void> {
  let request: output<typeof SourceRequest>;
  try {
    request = SourceRequest.parse(req.body);
  } catch (error) {
    throw new APIError(error, 400, 'Schema violation');
  }

  const sourceID = uuid();

  let source: output<typeof SourceState>;
  switch (request.type) {
    case 'enablebanking':
      source = await applyEnableBankingSourceRequest(request);
      break;
  }

  putState((prev) => setIn(prev, ['sources', sourceID], source));

  publishEvent();

  res.send({ id: sourceID } satisfies output<typeof IDResponse>);
}

export async function getSourcesByID(
  req: Request,
  res: Response,
): Promise<void> {
  const sourceID = req.params.sourceID.toString();

  const { sources } = loadState();

  if (!Object.hasOwn(sources, sourceID)) {
    throw new APIError(`Source "${sourceID}" not found`, 404);
  }

  const source = sources[sourceID]!;

  let response: output<typeof SourceResponse>;
  switch (source.type) {
    case 'enablebanking':
      response = await getEnableBankingSourceResponse(sourceID, source);
      break;
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
    throw new APIError(`Source "${sourceID}" not found`, 404);
  }

  const source = sources[sourceID]!;

  let update: output<typeof SourceUpdate>;
  try {
    update = SourceUpdate.parse(req.body);
  } catch (error) {
    throw new APIError(error, 400, 'Schema violation');
  }

  if (source.type !== update.type) throw new APIError('Type mismatch', 400);

  let nextSource: output<typeof SourceState>;
  switch (update.type) {
    case 'enablebanking':
      nextSource = await applyEnableBankingSourceUpdate(source, update);
      break;
  }

  putState((prev) => setIn(prev, ['sources', sourceID], nextSource));

  publishEvent();

  res.sendStatus(200);
}

export function deleteSourcesByID(req: Request, res: Response): void {
  const sourceID = req.params.sourceID.toString();

  const { sources } = loadState();

  if (!Object.hasOwn(sources, sourceID)) {
    throw new APIError(`Source "${sourceID}" not found`, 404);
  }

  putState((prev) => removeIn(prev, ['sources', sourceID]));

  publishEvent();

  res.sendStatus(200);
}

export async function getSourcesByIDAccounts(
  req: Request,
  res: Response,
): Promise<void> {
  const sourceID = req.params.sourceID.toString();

  const { sources } = loadState();

  if (!Object.hasOwn(sources, sourceID)) {
    throw new APIError(`Source "${sourceID}" not found`, 404);
  }

  const source = sources[sourceID]!;

  let response: output<typeof SourceAccount>[];
  switch (source.type) {
    case 'enablebanking':
      response = await getEnableBankingSourceAccounts(sourceID, source!);
      break;
  }

  res.send(response);
}
