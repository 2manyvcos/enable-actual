import type { FetchProviderType } from '@civet/common';
import toast from 'react-hot-toast';
import { stringifyError } from '@shared/utils';

export async function deleteReports({
  dataProvider,
}: {
  dataProvider: FetchProviderType;
}): Promise<void> {
  const promise = dataProvider.request<void>('v1/reports', {
    method: 'DELETE',
  });

  return toast.promise(promise, {
    loading: 'Clearing report history…',
    success: 'Report history has been successfully cleared',
    error: (error) => `Error clearing report history: ${stringifyError(error)}`,
  });
}
