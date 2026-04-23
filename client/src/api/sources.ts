import type { FetchProviderType } from '@civet/common';
import toast from 'react-hot-toast';
import type { input, output } from 'zod';
import type IDResponse from '@shared/schema/IDResponse';
import type SourceRequest from '@shared/schema/SourceRequest';
import type SourceUpdate from '@shared/schema/SourceUpdate';
import { stringifyError } from '@shared/utils';

export async function postSources({
  dataProvider,
  data,
}: {
  dataProvider: FetchProviderType;
  data: input<typeof SourceRequest>;
}): Promise<output<typeof IDResponse>> {
  const promise = dataProvider.request<output<typeof IDResponse>>(
    'v1/sources',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );

  return toast.promise(promise, {
    loading: 'Creating source…',
    success: 'The source has been successfully created',
    error: (error) => `Error creating source: ${stringifyError(error)}`,
  });
}

export async function putSourcesByID({
  dataProvider,
  sourceID,
  data,
}: {
  dataProvider: FetchProviderType;
  sourceID: string;
  data: input<typeof SourceUpdate>;
}): Promise<void> {
  const promise = dataProvider.request<void>(
    `v1/sources/${encodeURIComponent(sourceID)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );

  return toast.promise(promise, {
    loading: 'Saving changes…',
    success: 'The changes have been successfully saved',
    error: (error) => `Error saving changes: ${stringifyError(error)}`,
  });
}

export async function deleteSourcesByID({
  dataProvider,
  sourceID,
}: {
  dataProvider: FetchProviderType;
  sourceID: string;
}): Promise<void> {
  const promise = dataProvider.request<void>(
    `v1/sources/${encodeURIComponent(sourceID)}`,
    { method: 'DELETE' },
  );

  return toast.promise(promise, {
    loading: 'Deleting source…',
    success: 'The source has been successfully deleted',
    error: (error) => `Error deleting source: ${stringifyError(error)}`,
  });
}
