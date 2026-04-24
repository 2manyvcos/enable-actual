import type { FetchProviderType } from '@civet/common';
import { useResource } from '@civet/core';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useNavigate } from 'react-router';
import type { output } from 'zod';
import { gotoSchedules, previewSchedule } from '@/actions/schedules';
import { gotoSources, previewSource } from '@/actions/sources';
import { gotoTargets, previewTarget } from '@/actions/targets';
import type QuickAction from '@shared/schema/QuickAction';
import { stringifyError } from '@shared/utils';

export default function QuickActions() {
  const navigate = useNavigate();

  const resource = useResource<
    FetchProviderType,
    output<typeof QuickAction>[] | undefined
  >({
    name: 'v1/quick-actions',
    query: undefined,
    events: true,
  });

  if (resource.isLoading && resource.isInitial) {
    return null;
  }

  if (resource.error) {
    return (
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
    );
  }

  return (
    <Stack spacing={2}>
      {resource.data
        ?.slice(0, 1)
        .map(({ description, action, resource, id }, index) => (
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
                {action}
              </Button>
            }
          >
            {description}
          </Alert>
        ))}
    </Stack>
  );
}
