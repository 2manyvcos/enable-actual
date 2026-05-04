import type { FetchProviderType } from '@civet/common';
import { useResource } from '@civet/core';
import AccordionDetails from '@mui/material/AccordionDetails';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { type output } from 'zod';
import { gotoSchedules } from '@/actions/schedules';
import type Issue from '@shared/schema/Issue';
import type ScheduleResponse from '@shared/schema/ScheduleResponse';
import { stringifyError } from '@shared/utils';
import AddSchedule from './AddSchedule';
import EditSchedule from './EditSchedule';
import Schedule from './Schedule';

export default function Schedules({
  issues,
}: {
  issues?: output<typeof Issue>[];
}) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const preview = searchParams.get('preview');
  const previewID = preview?.startsWith('schedule:')
    ? preview.substring('schedule:'.length)
    : undefined;

  const edit = searchParams.get('edit');
  const editID = edit?.startsWith('schedule:')
    ? edit.substring('schedule:'.length)
    : undefined;

  const issuesByID = useMemo(
    () => Object.groupBy(issues?.filter(({ id }) => id) ?? [], ({ id }) => id!),
    [issues],
  );

  const resource = useResource<
    FetchProviderType,
    output<typeof ScheduleResponse>[] | undefined
  >({
    name: 'v1/schedules',
    query: undefined,
    events: true,
  });

  if (resource.isLoading && resource.isInitial) {
    return (
      <AccordionDetails>
        <Stack spacing={2}>
          <Skeleton variant="rounded" height={88} />

          <Skeleton variant="rounded" height={48} />
        </Stack>
      </AccordionDetails>
    );
  }

  if (resource.error) {
    return (
      <AccordionDetails>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={resource.notify}>
              Retry
            </Button>
          }
        >
          Error: {stringifyError(resource.error)}
        </Alert>
      </AccordionDetails>
    );
  }

  return (
    <AccordionDetails>
      <Stack spacing={2}>
        <List>
          {resource.data?.map((schedule) => (
            <Schedule
              key={schedule.id}
              data={schedule}
              preview={previewID === schedule.id}
              issues={issuesByID[schedule.id]}
            />
          ))}
        </List>

        <AddSchedule />

        <EditSchedule
          data={
            !editID ? undefined : resource.data?.find(({ id }) => id === editID)
          }
          onClose={() => {
            gotoSchedules({ navigate });
          }}
        />
      </Stack>
    </AccordionDetails>
  );
}
