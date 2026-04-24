import type { Request, Response } from 'express';
import type { output } from 'zod';
import NtfyCredentials from '../../shared/schema/NtfyCredentials.ts';
import { sendNtfyNotification } from '../notify.ts';
import APIError from './APIError.ts';

export async function postNotificationSettingsNtfyTests(
  req: Request,
  res: Response,
): Promise<void> {
  let request: output<typeof NtfyCredentials>;
  try {
    request = NtfyCredentials.parse(req.body);
  } catch (error) {
    throw new APIError(error, 400, 'Schema violation');
  }

  await sendNtfyNotification({
    url: request.url,
    username: request.username,
    password: request.password,
    message: 'Test notification - Your configuration works!',
  });

  res.sendStatus(200);
}
