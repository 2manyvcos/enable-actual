import type { Request, Response } from 'express';
import { v7 as uuid } from 'uuid';
import type { output } from 'zod';
import IDResponse from '../../shared/schema/IDResponse.ts';
import Source from '../../shared/schema/Source.ts';
import SourceWithID from '../../shared/schema/SourceWithID.ts';
import { loadState, putState } from '../state.ts';

export function getSources(_req: Request, res: Response): void {
  res.send(
    Object.entries(loadState().sources)
      .filter(([, value]) => value != null)
      .map(
        ([id, source]) =>
          ({
            id,
            ...source!,
          }) satisfies output<typeof SourceWithID>,
      ) satisfies output<typeof SourceWithID>[],
  );
}

export function postSources(req: Request, res: Response): void {
  let source: output<typeof Source>;
  try {
    source = Source.parse(req.body);
  } catch (error) {
    console.debug('Schema violation:', error);
    res.sendStatus(400);
    return;
  }

  if (!source.name) {
    switch (source.type) {
      case 'enablebanking':
        source.name = [
          source.enablebanking?.bankName,
          source.enablebanking?.bankCountry
            ? `(${source.enablebanking.bankCountry})`
            : undefined,
        ]
          .filter(Boolean)
          .join(' ');
    }
  }

  const sourceID = uuid();
  putState((prev) => ({
    ...prev,
    sources: { ...prev.sources, [sourceID]: source },
  }));
  res.send({ id: sourceID } satisfies output<typeof IDResponse>);
}

export function getSourcesByID(req: Request, res: Response): void {
  const sourceID = req.params.sourceID.toString();

  const { sources } = loadState();

  if (!Object.hasOwn(sources, sourceID)) {
    res.sendStatus(404);
    return;
  }

  res.send(sources[sourceID]! satisfies output<typeof Source>);
}

export function putSourcesByID(req: Request, res: Response): void {
  const sourceID = req.params.sourceID.toString();

  const { sources } = loadState();

  if (!Object.hasOwn(sources, sourceID)) {
    res.sendStatus(404);
    return;
  }

  let source: output<typeof Source>;
  try {
    source = Source.parse(req.body);
  } catch (error) {
    console.debug('Schema violation:', error);
    res.sendStatus(400);
    return;
  }

  putState((prev) => ({
    ...prev,
    sources: { ...prev.sources, [sourceID]: source },
  }));
  res.sendStatus(200);
}

export function deleteSourcesByID(req: Request, res: Response): void {
  const sourceID = req.params.sourceID.toString();

  const { sources } = loadState();

  if (!Object.hasOwn(sources, sourceID)) {
    res.sendStatus(404);
    return;
  }

  putState((prev) => {
    const { [sourceID]: _, ...nextSources } = prev.sources;
    return { ...prev, sources: nextSources };
  });
  res.sendStatus(200);
}
