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
import { deleteSchedulesByIDState } from '@/api/schedules';
import type ScheduleResponse from '@shared/schema/ScheduleResponse';

export default function DeleteScheduleState({
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
      <DialogTitle id="delete-dialog-title">Reset schedule state?</DialogTitle>

      <DialogContent>
        <DialogContentText id="delete-dialog-description">
          Confirm that you want to reset the state for "{data.name ?? data.id}".
          This deletes all information related to previous imports, ensuring
          that the next import starts from a clean slate.
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} autoFocus>
          Cancel
        </Button>

        <Button
          color="warning"
          onClick={async () => {
            onClose();

            await deleteSchedulesByIDState({
              dataProvider: dataProvider!,
              scheduleID: data.id,
            });

            onSuccess();
          }}
          startIcon={<DeleteIcon />}
        >
          Reset state
        </Button>
      </DialogActions>
    </Dialog>
  );
}
