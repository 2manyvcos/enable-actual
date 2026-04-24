import type { FetchProviderType } from '@civet/common';
import toast from 'react-hot-toast';
import type { input } from 'zod';
import type NotificationSettings from '@shared/schema/NotificationSettings';
import type NtfyCredentials from '@shared/schema/NtfyCredentials';
import { stringifyError } from '@shared/utils';

export async function putNotificationSettings({
  dataProvider,
  data,
}: {
  dataProvider: FetchProviderType;
  data: input<typeof NotificationSettings>;
}): Promise<void> {
  const promise = dataProvider.request<void>('v1/notification-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return toast.promise(promise, {
    loading: 'Saving changes…',
    success: 'The changes have been successfully saved',
    error: (error) => `Error saving changes: ${stringifyError(error)}`,
  });
}

export async function postNotificationSettingsNtfyTests({
  dataProvider,
  data,
}: {
  dataProvider: FetchProviderType;
  data: input<typeof NtfyCredentials>;
}): Promise<void> {
  const promise = dataProvider.request<void>(
    'v1/notification-settings/ntfy/tests',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );

  return toast.promise(promise, {
    loading: 'Sending test notification…',
    success: 'The test notification was successfully sent',
    error: (error) =>
      `Error sending test notification: ${stringifyError(error)}`,
  });
}
