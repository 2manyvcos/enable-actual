import DeleteIcon from '@mui/icons-material/Delete';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import { useState } from 'react';
import type { output } from 'zod';
import EnableBankingEditSource from '@/integrations/enablebanking/EditSource';
import type SourceResponse from '@shared/schema/SourceResponse';
import DeleteSource from './DeleteSource';

const components = {
  enablebanking: EnableBankingEditSource,
};

export default function EditSource({
  data,
  onSuccess,
  onClose,
}: {
  data: output<typeof SourceResponse> | undefined;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const Component = data ? components[data.type] : undefined;

  const [deleteRequested, setDeleteRequested] = useState(false);

  return (
    <>
      <Dialog open={!!data} onClose={onClose}>
        <DialogTitle>Edit source</DialogTitle>

        {!Component ? null : (
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
        )}
      </Dialog>

      {!data ? null : (
        <DeleteSource
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
