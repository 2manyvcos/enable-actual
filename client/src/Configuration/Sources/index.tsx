import type { FetchProviderType } from '@civet/common';
import { useResource } from '@civet/core';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { strictObject, string, type output } from 'zod';
import SourceSchema from '@shared/schema/Source';
import AddSource from './AddSource';
import Source from './Source';

const _SourceWithID = strictObject({
  ...SourceSchema.shape,
  id: string(),
});

export default function Sources() {
  const resource = useResource<
    FetchProviderType,
    output<typeof _SourceWithID>[] | undefined
  >({
    name: 'v1/sources',
    query: undefined,
  });

  if (resource.isLoading && resource.isInitial) {
    // TODO: update skeletons
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={68} />

        <Skeleton variant="rounded" height={36} />
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
