import type { Request, Response } from 'express';
import { type output } from 'zod';
import NotificationSettings from '../../../schema/NotificationSettings.ts';
import { loadState, putState } from '../../state.ts';

export function getNotifications(_req: Request, res: Response): void {
  res.send(loadState().notifications ?? {});
}

export function putNotifications(req: Request, res: Response): void {
  let notifications: output<typeof NotificationSettings>;
  try {
    notifications = NotificationSettings.parse(req.body);
  } catch (error) {
    console.debug('Schema error:', error);
    res.sendStatus(400);
    return;
  }

  putState({ notifications });
  res.sendStatus(200);
}
