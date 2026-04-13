import type { NavigateFunction } from 'react-router';

export function editSource({
  navigate,
  sourceID,
}: {
  navigate: NavigateFunction;
  sourceID: string;
}) {
  navigate({
    pathname: '/',
    search: new URLSearchParams({
      edit: `source:${encodeURIComponent(sourceID)}`,
    }).toString(),
  });
}
