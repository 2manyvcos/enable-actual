/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Enable Banking account UIDs are only valid for the current session, thus a new field `hash` was introduced to allow automatically updating those accounts.
 * This migration function deletes session details from sources where the hash is missing giving a clear signal to the user that they need to reauthorize.
 */
export default function state202605040(state: any): unknown {
  if (state?.sources != null) {
    Object.values(state.sources).forEach((source: any) => {
      if (
        source?.type === 'enablebanking' &&
        Array.isArray(source.availableAccounts) &&
        source.availableAccounts.some(({ hash }: any) => !hash)
      ) {
        delete source.sessionID;
        delete source.sessionValidUntil;
        delete source.availableAccounts;
      }
    });
  }

  return state;
}
