import type { NavigateFunction } from 'react-router';

export function gotoTargets({ navigate }: { navigate: NavigateFunction }) {
  navigate({
    pathname: '/',
    hash: 'targets',
  });
}

export function previewTarget({
  navigate,
  targetID,
}: {
  navigate: NavigateFunction;
  targetID: string;
}) {
  navigate({
    pathname: '/',
    hash: 'targets',
    search: new URLSearchParams({
      preview: `target:${encodeURIComponent(targetID)}`,
    }).toString(),
  });
}

export function editTarget({
  navigate,
  targetID,
}: {
  navigate: NavigateFunction;
  targetID: string;
}) {
  navigate({
    pathname: '/',
    hash: 'targets',
    search: new URLSearchParams({
      edit: `target:${encodeURIComponent(targetID)}`,
    }).toString(),
  });
}
