import type { NavigateFunction } from 'react-router';

export function gotoReports({ navigate }: { navigate: NavigateFunction }) {
  navigate({
    pathname: '/',
    hash: 'reports',
  });
}

export function previewReport({
  navigate,
  reportID,
}: {
  navigate: NavigateFunction;
  reportID: string;
}) {
  navigate({
    pathname: '/',
    hash: 'reports',
    search: new URLSearchParams({
      preview: `report:${encodeURIComponent(reportID)}`,
    }).toString(),
  });
}
