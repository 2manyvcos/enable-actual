import type { FetchProviderType } from '@civet/common';
import toast from 'react-hot-toast';
import type { input, output } from 'zod';
import type IDResponse from '@shared/schema/IDResponse';
import type ScheduleRequest from '@shared/schema/ScheduleRequest';
import type ScheduleUpdate from '@shared/schema/ScheduleUpdate';
import { stringifyError } from '@shared/utils';

export async function postSchedules({
  dataProvider,
  data,
}: {
  dataProvider: FetchProviderType;
  data: input<typeof ScheduleRequest>;
}): Promise<output<typeof IDResponse>> {
  const promise = dataProvider.request<output<typeof IDResponse>>(
    'v1/schedules',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );

  return toast.promise(promise, {
    loading: 'Creating schedule…',
    success: 'The schedule has been successfully created',
    error: (error) => `Error creating schedule: ${stringifyError(error)}`,
  });
}

export async function putSchedulesByID({
  dataProvider,
  scheduleID,
  data,
}: {
  dataProvider: FetchProviderType;
  scheduleID: string;
  data: input<typeof ScheduleUpdate>;
}): Promise<void> {
  const promise = dataProvider.request<void>(
    `v1/schedules/${encodeURIComponent(scheduleID)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );

  return toast.promise(promise, {
    loading: 'Saving changes…',
    success: 'The changes have been successfully saved',
    error: (error) => `Error saving changes: ${stringifyError(error)}`,
  });
}

export async function deleteSchedulesByID({
  dataProvider,
  scheduleID,
}: {
  dataProvider: FetchProviderType;
  scheduleID: string;
}): Promise<void> {
  const promise = dataProvider.request<void>(
    `v1/schedules/${encodeURIComponent(scheduleID)}`,
    { method: 'DELETE' },
  );

  return toast.promise(promise, {
    loading: 'Deleting schedule…',
    success: 'The schedule has been successfully deleted',
    error: (error) => `Error deleting schedule: ${stringifyError(error)}`,
  });
}

export async function postSchedulesByIDExecutions({
  dataProvider,
  scheduleID,
}: {
  dataProvider: FetchProviderType;
  scheduleID: string;
}): Promise<void> {
  const promise = dataProvider.request<void>(
    `v1/schedules/${encodeURIComponent(scheduleID)}/executions`,
    { method: 'POST' },
  );

  return toast.promise(promise, {
    loading: 'Requesting to run schedule…',
    success: 'Schedule execution has been successfully requested',
    error: (error) =>
      `Error requesting schedule execution: ${stringifyError(error)}`,
  });
}

export async function deleteSchedulesByIDState({
  dataProvider,
  scheduleID,
}: {
  dataProvider: FetchProviderType;
  scheduleID: string;
}): Promise<void> {
  const promise = dataProvider.request<void>(
    `v1/schedules/${encodeURIComponent(scheduleID)}/state`,
    { method: 'DELETE' },
  );

  return toast.promise(promise, {
    loading: 'Resetting schedule state…',
    success: 'The schedule state has been successfully resetted',
    error: (error) =>
      `Error resetting schedule state: ${stringifyError(error)}`,
  });
}
