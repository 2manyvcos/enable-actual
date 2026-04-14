import Button from '@mui/material/Button';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { type output } from 'zod';
import { editTarget } from '@/actions/targets';
import type ActualBudgetTargetResponse from '@shared/schema/ActualBudgetTargetResponse';

export default function Target({
  data,
  editAction,
}: {
  data: output<typeof ActualBudgetTargetResponse>;
  editAction: ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <ListItem secondaryAction={editAction}>
      <ListItemText primary={data.name ?? data.id} secondary="Actual Budget" />

      {!data.setupRequired ? null : (
        <Button
          color="warning"
          sx={{ marginInline: 2 }}
          onClick={() => {
            editTarget({ navigate, targetID: data.id });
          }}
        >
          Setup
        </Button>
      )}
    </ListItem>
  );
}
