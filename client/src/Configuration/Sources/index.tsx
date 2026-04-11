import type { FetchProviderType } from '@civet/common';
import { useResource } from '@civet/core';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { useSearchParams } from 'react-router';
import { type output } from 'zod';
import type SourceResponse from '@shared/schema/SourceResponse';
import AddSource from './AddSource';
import DeleteSource from './DeleteSource';
import EditSource from './EditSource';
import Source from './Source';

export default function Sources() {
  const [search, setSearch] = useSearchParams();
  const edit = search.get('edit');
  const _delete = search.get('delete');

  const editID = edit?.startsWith('source:')
    ? edit.substring('source:'.length)
    : undefined;

  const deleteID = _delete?.startsWith('source:')
    ? _delete.substring('source:'.length)
    : undefined;

  const resource = useResource<
    FetchProviderType,
    output<typeof SourceResponse>[] | undefined
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
        {resource.data?.map((source) => (
          <Source key={source.id} data={source} onNotify={resource.notify} />
        ))}
      </List>

      <AddSource onNotify={resource.notify} />

      <EditSource
        data={
          !editID ? undefined : resource.data?.find(({ id }) => id === editID)
        }
        onNotify={resource.notify}
        onClose={() => {
          setSearch((search) => {
            search.delete('edit');
            return search;
          });
        }}
      />

      <DeleteSource
        data={
          !deleteID
            ? undefined
            : resource.data?.find(({ id }) => id === deleteID)
        }
        onNotify={resource.notify}
        onClose={() => {
          setSearch((search) => {
            search.delete('delete');
            return search;
          });
        }}
      />
    </Stack>
  );
}
