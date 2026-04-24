import type { FetchProviderType } from '@civet/common';
import toast from 'react-hot-toast';
import type { output } from 'zod';
import type EnableBankingAuthRequest from '@shared/schema/EnableBankingAuthRequest';
import { stringifyError } from '@shared/utils';

export async function postSourcesByIDEnableBankingAuth({
  dataProvider,
  sourceID,
}: {
  dataProvider: FetchProviderType;
  sourceID: string;
}): Promise<output<typeof EnableBankingAuthRequest>> {
  const promise = dataProvider.request<output<typeof EnableBankingAuthRequest>>(
    `v1/sources/${encodeURIComponent(sourceID)}/enablebanking/auth`,
    { method: 'POST' },
  );

  return toast.promise(promise, {
    loading: 'Requesting authorization…',
    success:
      'Authorization has been successfully requested - you should be redirected shortly',
    error: (error) =>
      `Error requesting authorization: ${stringifyError(error)}`,
  });
}
