import type { FetchProviderType } from '@civet/common';
import { useConfigContext } from '@civet/core';
import DeleteIcon from '@mui/icons-material/Delete';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { deleteReports } from '@/api/reports';

export default function DeleteReports({
  open,
  onClose,
}: {
  open: boolean;
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
      <DialogTitle id="delete-dialog-title">Clear import history?</DialogTitle>

      <DialogContent>
        <DialogContentText id="delete-dialog-description">
          Confirm that you want to clear the whole import history. This cannot
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

            await deleteReports({ dataProvider: dataProvider! });
          }}
          startIcon={<DeleteIcon />}
        >
          Clear
        </Button>
      </DialogActions>
    </Dialog>
  );
}
