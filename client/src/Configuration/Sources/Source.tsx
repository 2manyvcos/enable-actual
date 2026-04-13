import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import { useNavigate } from 'react-router';
import type { output } from 'zod';
import { editSource } from '@/actions/sources';
import EnableBankingSource from '@/integrations/enablebanking/Source';
import type SourceResponse from '@shared/schema/SourceResponse';

const components = {
  enablebanking: EnableBankingSource,
};

export default function Source({
  data,
}: {
  data: output<typeof SourceResponse>;
}) {
  const navigate = useNavigate();

  const Component = components[data.type];

  return (
    <Component
      data={data}
      editAction={
        <IconButton
          aria-label="edit"
          onClick={() => {
            editSource({ navigate, sourceID: data.id });
          }}
        >
          <EditIcon />
        </IconButton>
      }
    />
  );
}
