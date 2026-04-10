import type { FetchProviderType } from '@civet/common';
import { useResource } from '@civet/core';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { type output } from 'zod';
import type SourceWithID from '@shared/schema/SourceWithID';
import AddSource from './AddSource';
import Source from './Source';

export default function Sources() {
  const resource = useResource<
    FetchProviderType,
    output<typeof SourceWithID>[] | undefined
  >({
    name: 'v1/sources',
    query: undefined,
  });

  if (resource.isLoading && resource.isInitial) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={88} />

        <Skeleton variant="rounded" height={48} />
      </Stack>
    );
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
        Error: {`${resource.error.message ?? resource.error}`}
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      <List>
        {resource.data?.map(({ id, ...source }) => (
          <Source key={id} id={id} data={source} notify={resource.notify} />
        ))}
      </List>

      <AddSource notify={resource.notify} />
    </Stack>
  );
}
