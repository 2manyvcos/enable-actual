import type { Request, Response } from 'express';
import type { output } from 'zod';
import type ImportReport from '../../shared/schema/ImportReport.ts';
import { loadHistory, putHistory } from '../history.ts';
import { publishEvent } from './events.ts';

export async function getReports(_req: Request, res: Response): Promise<void> {
  const { entries } = loadHistory();

  const response: output<typeof ImportReport>[] = entries;

  res.send(response);
}

export async function deleteReports(
  _req: Request,
  res: Response,
): Promise<void> {
  putHistory({ entries: [] });

  publishEvent();

  res.sendStatus(200);
}
