import type { Request, Response } from 'express';
import { removeIn, setIn } from 'immutable';
import { v7 as uuid } from 'uuid';
import type { output } from 'zod';
import IDResponse from '../../shared/schema/IDResponse.ts';
import type Issue from '../../shared/schema/Issue.ts';
import type SourceAccount from '../../shared/schema/SourceAccount.ts';
import SourceRequest from '../../shared/schema/SourceRequest.ts';
import type SourceResponse from '../../shared/schema/SourceResponse.ts';
import type SourceState from '../../shared/schema/SourceState.ts';
import SourceUpdate from '../../shared/schema/SourceUpdate.ts';
import type State from '../../shared/schema/State.ts';
import {
  applyEnableBankingSourceRequest,
  applyEnableBankingSourceUpdate,
  getEnableBankingSourceAccounts,
  getEnableBankingSourceIssues,
  getEnableBankingSourceResponse,
} from '../integrations/enablebanking/sources.ts';
import { loadState, putState } from '../state.ts';
import APIError from './APIError.ts';
import { publishEvent } from './events.ts';

export async function getSourceResponse(
  id: string,
  source: output<typeof SourceState>,
): Promise<output<typeof SourceResponse>> {
  switch (source.type) {
    case 'enablebanking':
      return await getEnableBankingSourceResponse(id, source);
  }
}

export async function applySourceRequest(
  request: output<typeof SourceRequest>,
): Promise<output<typeof SourceState>> {
  switch (request.type) {
    case 'enablebanking':
      return await applyEnableBankingSourceRequest(request);
  }
}

export async function applySourceUpdate(
  source: output<typeof SourceState>,
  update: output<typeof SourceUpdate>,
): Promise<output<typeof SourceState>> {
  if (source.type !== update.type) throw new APIError('Type mismatch', 400);

  switch (update.type) {
    case 'enablebanking':
      return await applyEnableBankingSourceUpdate(source, update);
  }
}

export async function getSourceIssues(
  id: string,
  source: output<typeof SourceState>,
  state: output<typeof State>,
): Promise<output<typeof Issue>[]> {
  switch (source.type) {
    case 'enablebanking':
      return await getEnableBankingSourceIssues(id, source, state);
  }
}

export async function getSourceAccounts(
  id: string,
  source: output<typeof SourceState>,
): Promise<output<typeof SourceAccount>[]> {
  switch (source.type) {
    case 'enablebanking':
      return await getEnableBankingSourceAccounts(id, source);
  }
}

export async function getSources(_req: Request, res: Response): Promise<void> {
  const { sources } = loadState();

  const response: output<typeof SourceResponse>[] = await Promise.all(
    Object.entries(sources)
      .filter(([, source]) => source)
      .map(async ([sourceID, source]) => getSourceResponse(sourceID, source!)),
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
  const source = await applySourceRequest(request);

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

  const source = sources[sourceID];
  if (!Object.hasOwn(sources, sourceID) || !source) {
    throw new APIError(`Source "${sourceID}" not found`, 404);
  }

  const response = await getSourceResponse(sourceID, source);

  res.send(response);
}

export async function putSourcesByID(
  req: Request,
  res: Response,
): Promise<void> {
  const sourceID = req.params.sourceID.toString();

  const { sources } = loadState();

  const source = sources[sourceID];
  if (!Object.hasOwn(sources, sourceID) || !source) {
    throw new APIError(`Source "${sourceID}" not found`, 404);
  }

  let update: output<typeof SourceUpdate>;
  try {
    update = SourceUpdate.parse(req.body);
  } catch (error) {
    throw new APIError(error, 400, 'Schema violation');
  }

  const nextSource = await applySourceUpdate(source, update);

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

  const source = sources[sourceID];
  if (!Object.hasOwn(sources, sourceID) || !source) {
    throw new APIError(`Source "${sourceID}" not found`, 404);
  }

  const response = await getSourceAccounts(sourceID, source);

  res.send(response);
}
