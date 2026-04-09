import type { Request, Response } from 'express';
import { loadState } from '../../state.ts';

export function getSources(_req: Request, res: Response): void {
  res.send(
    Object.entries(loadState().sources ?? {}).map(([id, source]) => ({
      id,
      ...source,
    })),
  );
}
