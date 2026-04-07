import type { FetchProviderType } from '@civet/common';
import { useResource } from '@civet/core';

export default function App() {
  const resource = useResource<FetchProviderType, string | undefined>({
    name: 'v1/health',
    query: undefined,
  });

  return resource.error?.toString() ?? resource.data;
}
