import type { NavigateFunction } from 'react-router';

export function gotoSchedules({ navigate }: { navigate: NavigateFunction }) {
  navigate({
    pathname: '/',
    hash: 'schedules',
  });
}

export function previewSchedule({
  navigate,
  scheduleID,
}: {
  navigate: NavigateFunction;
  scheduleID: string;
}) {
  navigate({
    pathname: '/',
    hash: 'schedules',
    search: new URLSearchParams({
      preview: `schedule:${encodeURIComponent(scheduleID)}`,
    }).toString(),
  });
}

export function editSchedule({
  navigate,
  scheduleID,
}: {
  navigate: NavigateFunction;
  scheduleID: string;
}) {
  navigate({
    pathname: '/',
    hash: 'schedules',
    search: new URLSearchParams({
      edit: `schedule:${encodeURIComponent(scheduleID)}`,
    }).toString(),
  });
}
