import type { FetchProviderType } from '@civet/common';
import { useConfigContext } from '@civet/core';
import DeleteIcon from '@mui/icons-material/Delete';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import toast from 'react-hot-toast';
import type { output } from 'zod';
import SourceSchema from '@schema/Source';

export default function Source({
  id,
  data,
  notify,
}: {
  id: string;
  data: output<typeof SourceSchema>;
  notify: () => void;
}) {
  const { dataProvider } = useConfigContext<FetchProviderType>();

  const _delete = async (id: string) => {
    await dataProvider!.request(`v1/sources/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    notify();
  };

  return (
    <ListItem
      secondaryAction={
        <IconButton
          aria-label="delete"
          onClick={() => {
            const promise = _delete(id);

            toast.promise(promise, {
              loading: 'Deleting record…',
              success: 'Record deleted successfully',
              error: (error) => {
                console.debug('Error deleting record:', error);
                return `Error deleting record: ${error?.message ?? error ?? 'Unexpected error'}`;
              },
            });
          }}
        >
          <DeleteIcon />
        </IconButton>
      }
    >
      <ListItemText primary={data.name ?? id} secondary={data.type} />

      <Button sx={{ marginInline: 2 }}>Authorize</Button>
    </ListItem>
  );
}
