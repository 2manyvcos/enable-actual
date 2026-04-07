import type { FetchProviderType } from '@civet/common';
import { useResource } from '@civet/core';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ErrorMessage from './ErrorMessage';

type NotificationSettings = {
  ntfy?: {
    url?: string;
    username?: string;
    password?: string;
  };
  alerts?: {
    sessionExpiryDays?: number;
    successfulImports?: boolean;
    unsuccessfulImports?: boolean;
  };
};

export default function NotificationSettings() {
  const [ntfyURL, setNtfyURL] = useState('');
  const [ntfyUsername, setNtfyUsername] = useState('');
  const [ntfyPassword, setNtfyPassword] = useState('');
  const [alertsSessionExpiryDays, setAlertsSessionExpiryDays] = useState(0);
  const [alertsSuccessfulImports, setAlertsSuccessfulImports] = useState(false);
  const [alertsUnsuccessfulImports, setAlertsUnsuccessfulImports] =
    useState(false);

  const resource = useResource<
    FetchProviderType,
    NotificationSettings | undefined
  >({
    name: 'v1/config/notifications',
    query: undefined,
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNtfyURL(resource.data?.ntfy?.url ?? '');
    setNtfyUsername(resource.data?.ntfy?.username ?? '');
    setNtfyPassword(resource.data?.ntfy?.password ?? '');
    setAlertsSessionExpiryDays(resource.data?.alerts?.sessionExpiryDays ?? 0);
    setAlertsSuccessfulImports(
      resource.data?.alerts?.successfulImports ?? false,
    );
    setAlertsUnsuccessfulImports(
      resource.data?.alerts?.unsuccessfulImports ?? false,
    );
  }, [resource.data]);

  if (resource.error) {
    return <ErrorMessage>{resource.error?.toString()}</ErrorMessage>;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        toast.promise(
          (() =>
            resource.dataProvider.request('v1/config/notifications', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ntfy: {
                  url: ntfyURL || undefined,
                  username: ntfyUsername || undefined,
                  password: ntfyPassword || undefined,
                },
                alerts: {
                  sessionExpiryDays: alertsSessionExpiryDays || undefined,
                  successfulImports: alertsSuccessfulImports,
                  unsuccessfulImports: alertsUnsuccessfulImports,
                },
              } satisfies NotificationSettings),
            }))(),
          {
            loading: 'Saving changes…',
            success: 'Saved changes successfully',
            error: (error) => {
              console.error(error);
              return `Error saving changes: ${
                error?.message ?? error ?? 'Unexpected error'
              }`;
            },
          },
        );
      }}
    >
      <fieldset disabled={resource.isLoading}>
        <fieldset>
          <legend>ntfy.sh</legend>

          <p>
            <label htmlFor="ntfy-url">URL</label>

            <input
              type="text"
              id="ntfy-url"
              name="ntfy-url"
              value={ntfyURL}
              onChange={(event) => {
                setNtfyURL(event.target.value);
              }}
            />
          </p>

          <p>
            <label htmlFor="ntfy-username">Username</label>

            <input
              type="text"
              id="ntfy-username"
              name="ntfy-username"
              autoComplete="username"
              autoCapitalize="none"
              value={ntfyUsername}
              onChange={(event) => {
                setNtfyUsername(event.target.value);
              }}
            />
          </p>

          <p>
            <label htmlFor="ntfy-password">Password</label>

            <input
              type="password"
              id="ntfy-password"
              name="ntfy-password"
              autoComplete="current-password"
              autoCapitalize="none"
              value={ntfyPassword}
              onChange={(event) => {
                setNtfyPassword(event.target.value);
              }}
            />
          </p>
        </fieldset>

        <fieldset>
          <legend>Alerts</legend>

          <p>
            <label htmlFor="alerts-session-expiry">Session expiry</label>

            <input
              type="checkbox"
              id="alerts-session-expiry"
              name="alerts-session-expiry"
              checked={alertsSessionExpiryDays > 0}
              onChange={(event) => {
                setAlertsSessionExpiryDays(event.target.checked ? 7 : 0);
              }}
            />
          </p>

          {!alertsSessionExpiryDays ? null : (
            <p>
              <label htmlFor="alerts-session-expiry-days">
                Days before session expiry
              </label>

              <input
                type="number"
                id="alerts-session-expiry-days"
                name="alerts-session-expiry-days"
                min={1}
                step={1}
                value={alertsSessionExpiryDays}
                onChange={(event) => {
                  setAlertsSessionExpiryDays(+(event.target.value || 0));
                }}
              />
            </p>
          )}

          <p>
            <label htmlFor="alerts-successful-imports">
              Successful imports
            </label>

            <input
              type="checkbox"
              id="alerts-successful-imports"
              name="alerts-successful-imports"
              checked={alertsSuccessfulImports}
              onChange={(event) => {
                setAlertsSuccessfulImports(event.target.checked);
              }}
            />
          </p>

          <p>
            <label htmlFor="alerts-unsuccessful-imports">
              Unsuccessful imports
            </label>

            <input
              type="checkbox"
              id="alerts-unsuccessful-imports"
              name="alerts-unsuccessful-imports"
              checked={alertsUnsuccessfulImports}
              onChange={(event) => {
                setAlertsUnsuccessfulImports(event.target.checked);
              }}
            />
          </p>
        </fieldset>

        <input type="submit" value="Save" />
      </fieldset>
    </form>
  );
}
