import type { FetchProviderType } from '@civet/common';
import { useConfigContext } from '@civet/core';
import DeleteIcon from '@mui/icons-material/Delete';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { useState } from 'react';
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

  const [deleteRequested, setDeleteRequested] = useState(false);
  const _delete = async () => {
    await dataProvider!.request(`v1/sources/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    notify();
  };

  return (
    <>
      <ListItem
        secondaryAction={
          <IconButton
            aria-label="delete"
            onClick={() => {
              setDeleteRequested(true);
            }}
          >
            <DeleteIcon />
          </IconButton>
        }
      >
        <ListItemText primary={data.name ?? id} secondary={data.type} />

        <Button sx={{ marginInline: 2 }}>Authorize</Button>
      </ListItem>

      <Dialog
        open={deleteRequested}
        onClose={() => {
          setDeleteRequested(false);
        }}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        role="alertdialog"
      >
        <DialogTitle id="delete-dialog-title">Delete source?</DialogTitle>

        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Confirm that you want to delete "{data.name ?? id}". This cannot be
            undone.
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setDeleteRequested(false);
            }}
            autoFocus
          >
            Cancel
          </Button>

          <Button
            onClick={() => {
              setDeleteRequested(false);

              const promise = _delete();

              toast.promise(promise, {
                loading: 'Deleting source…',
                success: 'Source deleted successfully',
                error: (error) => {
                  console.debug('Error deleting source:', error);
                  return `Error deleting source: ${error?.message ?? error ?? 'Unexpected error'}`;
                },
              });
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
