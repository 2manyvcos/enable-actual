import type { FetchProviderType } from '@civet/common';
import { stringifyError } from '@shared/utils';
import { toast } from 'react-hot-toast';

export async function postTargetsByIDActualBudgetConnection({
  dataProvider,
  targetID,
}: {
  dataProvider: FetchProviderType;
  targetID: string;
}): Promise<void> {
  const promise = dataProvider.request<void>(
    `v1/targets/${encodeURIComponent(targetID)}/actualbudget/connection`,
    { method: 'POST' },
  );

  return toast.promise(promise, {
    loading: 'Reconnecting target…',
    success: 'The target has been successfully reconnected',
    error: (error) => `Error reconnecting target: ${stringifyError(error)}`,
  });
}
