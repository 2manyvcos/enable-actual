import { default as fetch } from 'node-fetch';
import { APP_NAME, PUBLIC_URL } from './config.ts';
import { loadState } from './state.ts';

export default function notify({
  message,
  action,
}: {
  message: string;
  action?: string;
}): void {
  console.log(`\n\n! ${message}${action ? ` - ${action}` : ''}\n\n`);

  const {
    notifications: { ntfy },
  } = loadState();

  if (ntfy.enabled && ntfy.url) {
    const headers = new Headers({
      Title: APP_NAME,
      Click: action ?? PUBLIC_URL,
    });

    if (ntfy.username && ntfy.password) {
      headers.set(
        'Authorization',
        `Basic ${Buffer.from(`${ntfy.username}:${ntfy.password}`).toString('base64')}`,
      );
    }

    fetch(ntfy.url, {
      method: 'POST',
      headers,
      body: message,
    });
  }
}
