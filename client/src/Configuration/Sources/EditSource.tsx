import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import type { output } from 'zod';
import EnableBankingEditSource from '@/integrations/enablebanking/EditSource';
import type SourceResponse from '@shared/schema/SourceResponse';

const components = {
  enablebanking: EnableBankingEditSource,
};

export default function EditSource({
  data,
  onNotify,
  onClose,
}: {
  data: output<typeof SourceResponse> | undefined;
  onNotify: () => void;
  onClose: () => void;
}) {
  const Component = data ? components[data.type] : undefined;

  return (
    <Dialog open={!!data} onClose={onClose}>
      <DialogTitle>Edit source</DialogTitle>

      {Component ? (
        <Component data={data!} onNotify={onNotify} onClose={onClose} />
      ) : undefined}
    </Dialog>
  );
}
