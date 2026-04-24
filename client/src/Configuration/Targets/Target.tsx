import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import { useNavigate } from 'react-router';
import type { output } from 'zod';
import { editTarget } from '@/actions/targets';
import ActualBudgetTarget from '@/integrations/actualbudget/Target';
import type TargetResponse from '@shared/schema/TargetResponse';

const components = {
  actualbudget: ActualBudgetTarget,
};

export default function Target({
  data,
  preview,
}: {
  data: output<typeof TargetResponse>;
  preview: boolean;
}) {
  const navigate = useNavigate();

  const Component = components[data.type];

  return (
    <Component
      data={data}
      preview={preview}
      editAction={
        <IconButton
          aria-label="edit"
          onClick={() => {
            editTarget({ navigate, targetID: data.id });
          }}
        >
          <EditIcon />
        </IconButton>
      }
    />
  );
}
