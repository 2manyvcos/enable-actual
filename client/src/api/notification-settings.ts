import type { FetchProviderType } from '@civet/common';
import toast from 'react-hot-toast';
import type { input } from 'zod';
import type NotificationSettings from '@shared/schema/NotificationSettings';

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
    success: 'Changes saved successfully',
    error: (error) =>
      `Error saving changes: ${(error?.message ?? error) || 'Unexpected error'}`,
  });
}
