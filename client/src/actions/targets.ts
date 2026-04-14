import type { NavigateFunction } from 'react-router';

export function editTarget({
  navigate,
  targetID,
}: {
  navigate: NavigateFunction;
  targetID: string;
}) {
  navigate({
    pathname: '/',
    search: new URLSearchParams({
      edit: `target:${encodeURIComponent(targetID)}`,
    }).toString(),
  });
}
