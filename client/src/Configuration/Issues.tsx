import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useNavigate } from 'react-router';
import type { output } from 'zod';
import { gotoSchedules, previewSchedule } from '@/actions/schedules';
import { gotoSources, previewSource } from '@/actions/sources';
import { gotoTargets, previewTarget } from '@/actions/targets';
import type Issue from '@shared/schema/Issue';
import { stringifyError } from '@shared/utils';

export default function Issues({
  isLoading,
  error,
  notify,
  data,
}: {
  isLoading: boolean;
  error?: unknown;
  notify: () => void;
  data: output<typeof Issue>[] | undefined;
}) {
  const navigate = useNavigate();

  if (isLoading) {
    return null;
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={notify}>
            Retry
          </Button>
        }
      >
        Error: {stringifyError(error)}
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      {data
        ?.slice(0, 1)
        .map(({ description, actionLabel, resource, id }, index) => (
          <Alert
            key={index}
            severity="warning"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  switch (resource) {
                    case 'sources':
                      if (id) previewSource({ navigate, sourceID: id });
                      else gotoSources({ navigate });
                      break;

                    case 'targets':
                      if (id) previewTarget({ navigate, targetID: id });
                      else gotoTargets({ navigate });
                      break;

                    case 'schedules':
                      if (id) previewSchedule({ navigate, scheduleID: id });
                      else gotoSchedules({ navigate });
                      break;
                  }
                }}
              >
                {actionLabel}
              </Button>
            }
          >
            {description}
          </Alert>
        ))}
    </Stack>
  );
}
