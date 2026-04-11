import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import { useNavigate } from 'react-router';
import type { output } from 'zod';
import EnableBankingSource from '@/integrations/enablebanking/Source';
import type SourceResponse from '@shared/schema/SourceResponse';

const components = {
  enablebanking: EnableBankingSource,
};

export default function Source({
  data,
  onNotify,
}: {
  data: output<typeof SourceResponse>;
  onNotify: () => void;
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
            navigate({
              pathname: '/',
              search: new URLSearchParams({
                edit: `source:${encodeURIComponent(data.id)}`,
              }).toString(),
            });
          }}
        >
          <EditIcon />
        </IconButton>
      }
      onNotify={onNotify}
    />
  );
}
