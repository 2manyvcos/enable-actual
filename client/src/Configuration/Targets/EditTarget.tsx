import DeleteIcon from '@mui/icons-material/Delete';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import { useState } from 'react';
import type { output } from 'zod';
import ActualBudgetEditTarget from '@/integrations/actualbudget/EditTarget';
import type TargetResponse from '@shared/schema/TargetResponse';
import DeleteTarget from './DeleteTarget';

const components = {
  actualbudget: ActualBudgetEditTarget,
};

export default function EditTarget({
  data,
  onSuccess,
  onClose,
}: {
  data: output<typeof TargetResponse> | undefined;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const Component = data ? components[data.type] : undefined;

  const [deleteRequested, setDeleteRequested] = useState(false);

  return (
    <>
      <Dialog open={!!data} onClose={onClose}>
        <DialogTitle>Edit target</DialogTitle>

        {Component ? (
          <Component
            data={data!}
            onSuccess={onSuccess}
            onClose={onClose}
            deleteAction={
              <Button
                onClick={() => {
                  setDeleteRequested(true);
                }}
                color="error"
                startIcon={<DeleteIcon />}
              >
                Delete
              </Button>
            }
          />
        ) : undefined}
      </Dialog>

      {!data ? null : (
        <DeleteTarget
          open={deleteRequested}
          data={data}
          onSuccess={() => {
            onSuccess();
            onClose();
          }}
          onClose={() => {
            setDeleteRequested(false);
          }}
        />
      )}
    </>
  );
}
