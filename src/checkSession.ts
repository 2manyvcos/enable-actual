import { PUBLIC_URL, SESSION_EXPIRY_WARNING } from './config.ts';
import notify from './notify.ts';
import { type SourceState } from './state.ts';

export default function checkSession(source: SourceState | undefined): boolean {
  if (!source) {
    notify(
      'There is no account session configured yet. Please authorize.',
      new URL('auth', PUBLIC_URL).href,
    );

    return false;
  }

  if (SESSION_EXPIRY_WARNING > 0) {
    const now = Date.now();
    const expiry = new Date(source.sessionExpiry);
    const warning = expiry.getTime() - SESSION_EXPIRY_WARNING;
    if (now >= warning) {
      const remainingDays = Math.floor(
        Math.max(0, expiry.getTime() - now) / (24 * 60 * 60 * 1000),
      );

      notify(
        `Your account session expires in ${remainingDays} days. Please don't forget to reauthorize in time.`,
        new URL('auth', PUBLIC_URL).href,
      );
    }
  }

  return true;
}
