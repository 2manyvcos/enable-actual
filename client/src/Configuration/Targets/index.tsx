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
import { gotoTargets } from '@/actions/targets';
import type Issue from '@shared/schema/Issue';
import type TargetResponse from '@shared/schema/TargetResponse';
import { stringifyError } from '@shared/utils';
import AddTarget from './AddTarget';
import EditTarget from './EditTarget';
import Target from './Target';

export default function Targets({
  issues,
}: {
  issues?: output<typeof Issue>[];
}) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const preview = searchParams.get('preview');
  const previewID = preview?.startsWith('target:')
    ? preview.substring('target:'.length)
    : undefined;

  const edit = searchParams.get('edit');
  const editID = edit?.startsWith('target:')
    ? edit.substring('target:'.length)
    : undefined;

  const issuesByID = useMemo(
    () => Object.groupBy(issues?.filter(({ id }) => id) ?? [], ({ id }) => id!),
    [issues],
  );

  const resource = useResource<
    FetchProviderType,
    output<typeof TargetResponse>[] | undefined
  >({
    name: 'v1/targets',
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
          {resource.data?.map((target) => (
            <Target
              key={target.id}
              data={target}
              preview={previewID === target.id}
              issues={issuesByID[target.id]}
            />
          ))}
        </List>

        <AddTarget />

        <EditTarget
          data={
            !editID ? undefined : resource.data?.find(({ id }) => id === editID)
          }
          onClose={() => {
            gotoTargets({ navigate });
          }}
        />
      </Stack>
    </AccordionDetails>
  );
}
