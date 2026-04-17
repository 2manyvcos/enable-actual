import type { NavigateFunction } from 'react-router';

export function gotoSources({ navigate }: { navigate: NavigateFunction }) {
  navigate({
    pathname: '/',
    hash: 'sources',
  });
}

export function editSource({
  navigate,
  sourceID,
}: {
  navigate: NavigateFunction;
  sourceID: string;
}) {
  navigate({
    pathname: '/',
    hash: 'sources',
    search: new URLSearchParams({
      edit: `source:${encodeURIComponent(sourceID)}`,
    }).toString(),
  });
}
