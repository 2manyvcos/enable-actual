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
import { gotoSources } from '@/actions/sources';
import type Issue from '@shared/schema/Issue';
import type SourceResponse from '@shared/schema/SourceResponse';
import { stringifyError } from '@shared/utils';
import AddSource from './AddSource';
import EditSource from './EditSource';
import Source from './Source';

export default function Sources({
  issues,
}: {
  issues?: output<typeof Issue>[];
}) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const preview = searchParams.get('preview');
  const previewID = preview?.startsWith('source:')
    ? preview.substring('source:'.length)
    : undefined;

  const edit = searchParams.get('edit');
  const editID = edit?.startsWith('source:')
    ? edit.substring('source:'.length)
    : undefined;

  const issuesByID = useMemo(
    () => Object.groupBy(issues?.filter(({ id }) => id) ?? [], ({ id }) => id!),
    [issues],
  );

  const resource = useResource<
    FetchProviderType,
    output<typeof SourceResponse>[] | undefined
  >({
    name: 'v1/sources',
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
          {resource.data?.map((source) => (
            <Source
              key={source.id}
              data={source}
              preview={previewID === source.id}
              issues={issuesByID[source.id]}
            />
          ))}
        </List>

        <AddSource />

        <EditSource
          data={
            !editID ? undefined : resource.data?.find(({ id }) => id === editID)
          }
          onClose={() => {
            gotoSources({ navigate });
          }}
        />
      </Stack>
    </AccordionDetails>
  );
}
