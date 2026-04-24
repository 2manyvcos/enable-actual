import { default as fetch } from 'node-fetch';
import { stringifyError } from '../shared/utils.ts';
import APIError from './api/APIError.ts';
import { APP_NAME, PUBLIC_URL } from './config.ts';
import { loadState } from './state.ts';

export function sendConsoleNotification({
  message,
  action,
}: {
  message: string;
  action?: string;
}): void {
  console.log(`\n\n! ${message}${action ? ` - ${action}` : ''}\n\n`);
}

export async function sendNtfyNotification({
  url,
  username,
  password,
  message,
  action,
}: {
  url: string;
  username?: string;
  password?: string;
  message: string;
  action?: string;
}): Promise<void> {
  const headers = new Headers({
    Title: APP_NAME,
    Click: action ?? PUBLIC_URL,
  });

  if (username && password) {
    headers.set(
      'Authorization',
      `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    );
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: message,
  });

  if (!res.ok) {
    let error: string | undefined;
    try {
      error = await res.text();
    } catch {
      error = undefined;
    }
    throw new APIError(
      `${res.status} ${res.statusText}${error ? `\n${error}` : ''}`,
      res.status < 500 ? 400 : 500,
    );
  }
}

export default function notify({
  message,
  action,
}: {
  message: string;
  action?: string;
}): void {
  sendConsoleNotification({ message, action });

  const {
    notifications: { ntfy },
  } = loadState();

  if (ntfy.enabled) {
    (async () => {
      try {
        if (!ntfy.url) throw new APIError('URL missing', 400);

        await sendNtfyNotification({
          url: ntfy.url,
          username: ntfy.username,
          password: ntfy.password,
          message,
          action,
        });
      } catch (error) {
        console.debug(
          `Error sending ntfy.sh notification: ${stringifyError(error)}`,
        );
      }
    })();
  }
}
