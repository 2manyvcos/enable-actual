import type { FetchProviderType } from '@civet/common';
import { useConfigContext } from '@civet/core';
import DeleteIcon from '@mui/icons-material/Delete';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import type { output } from 'zod';
import { deleteSchedulesByID } from '@/api/schedules';
import type ScheduleResponse from '@shared/schema/ScheduleResponse';

export default function DeleteSchedule({
  open,
  data,
  onSuccess,
  onClose,
}: {
  open: boolean;
  data: output<typeof ScheduleResponse>;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const { dataProvider } = useConfigContext<FetchProviderType>();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
      role="alertdialog"
    >
      <DialogTitle id="delete-dialog-title">Delete schedule?</DialogTitle>

      <DialogContent>
        <DialogContentText id="delete-dialog-description">
          Confirm that you want to delete "{data.name ?? data.id}". This cannot
          be undone.
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} autoFocus>
          Cancel
        </Button>

        <Button
          color="error"
          onClick={async () => {
            onClose();

            await deleteSchedulesByID({
              dataProvider: dataProvider!,
              scheduleID: data.id,
            });

            onSuccess();
          }}
          startIcon={<DeleteIcon />}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
