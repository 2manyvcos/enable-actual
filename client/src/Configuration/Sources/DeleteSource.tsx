import type { FetchProviderType } from '@civet/common';
import { useConfigContext } from '@civet/core';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import toast from 'react-hot-toast';
import type { output } from 'zod';
import type SourceResponse from '@shared/schema/SourceResponse';

export default function DeleteSource({
  data,
  onNotify,
  onClose,
}: {
  data: output<typeof SourceResponse> | undefined;
  onNotify: () => void;
  onClose: () => void;
}) {
  const { dataProvider } = useConfigContext<FetchProviderType>();

  const _delete = async () => {
    onClose();

    await dataProvider!.request(`v1/sources/${encodeURIComponent(data!.id)}`, {
      method: 'DELETE',
    });

    onNotify();
  };

  return (
    <Dialog
      open={!!data}
      onClose={onClose}
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
      role="alertdialog"
    >
      <DialogTitle id="delete-dialog-title">Delete source?</DialogTitle>

      <DialogContent>
        <DialogContentText id="delete-dialog-description">
          Confirm that you want to delete "{data?.name ?? data?.id}". This
          cannot be undone.
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} autoFocus>
          Cancel
        </Button>

        <Button
          onClick={() => {
            const promise = _delete();

            toast.promise(promise, {
              loading: 'Deleting source…',
              success: 'Source deleted successfully',
              error: (error) =>
                `Error deleting source: ${error?.message ?? error ?? 'Unexpected error'}`,
            });
          }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
