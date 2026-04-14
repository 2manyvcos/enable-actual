import type { FetchProviderType } from '@civet/common';
import toast from 'react-hot-toast';
import type { input, output } from 'zod';
import type IDResponse from '@shared/schema/IDResponse';
import type TargetRequest from '@shared/schema/TargetRequest';
import type TargetUpdate from '@shared/schema/TargetUpdate';

export async function postTargets({
  dataProvider,
  data,
}: {
  dataProvider: FetchProviderType;
  data: input<typeof TargetRequest>;
}): Promise<output<typeof IDResponse>> {
  const promise = dataProvider.request<output<typeof IDResponse>>(
    'v1/targets',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );

  return toast.promise(promise, {
    loading: 'Creating target…',
    success: 'Target created successfully',
    error: (error) =>
      `Error creating target: ${(error?.message ?? error) || 'Unexpected error'}`,
  });
}

export async function putTargetsByID({
  dataProvider,
  targetID,
  data,
}: {
  dataProvider: FetchProviderType;
  targetID: string;
  data: input<typeof TargetUpdate>;
}): Promise<void> {
  const promise = dataProvider.request<void>(
    `v1/targets/${encodeURIComponent(targetID)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );

  return toast.promise(promise, {
    loading: 'Saving changes…',
    success: 'Changes saved successfully',
    error: (error) =>
      `Error saving changes: ${(error?.message ?? error) || 'Unexpected error'}`,
  });
}

export async function deleteTargetsByID({
  dataProvider,
  targetID,
}: {
  dataProvider: FetchProviderType;
  targetID: string;
}): Promise<void> {
  const promise = dataProvider.request<void>(
    `v1/targets/${encodeURIComponent(targetID)}`,
    { method: 'DELETE' },
  );

  return toast.promise(promise, {
    loading: 'Deleting target…',
    success: 'Target deleted successfully',
    error: (error) =>
      `Error deleting target: ${(error?.message ?? error) || 'Unexpected error'}`,
  });
}
