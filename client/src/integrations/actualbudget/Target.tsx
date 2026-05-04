import type { FetchProviderType } from '@civet/common';
import { useConfigContext } from '@civet/core';
import Button from '@mui/material/Button';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { type output } from 'zod';
import { editTarget } from '@/actions/targets';
import { postTargetsByIDActualBudgetConnection } from '@/api/targets-actualbudget';
import type ActualBudgetTargetResponse from '@shared/schema/ActualBudgetTargetResponse';

export default function Target({
  data,
  preview,
  editAction,
}: {
  data: output<typeof ActualBudgetTargetResponse>;
  preview: boolean;
  editAction: ReactNode;
}) {
  const navigate = useNavigate();
  const { dataProvider } = useConfigContext<FetchProviderType>();

  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (preview) {
      setTimeout(() => ref.current?.scrollIntoView({ behavior: 'instant' }));
      setTimeout(
        () => ref.current?.scrollIntoView({ behavior: 'smooth' }),
        500,
      );
    }
  }, [preview]);

  return (
    <ListItem
      ref={ref}
      sx={(theme) =>
        preview ? { backgroundColor: theme.palette.action.selected } : {}
      }
      secondaryAction={editAction}
    >
      <ListItemText primary={data.name ?? data.id} secondary="Actual Budget" />

      {data.setupRequired ? (
        <Button
          color="warning"
          sx={{ marginInline: 2 }}
          onClick={() => {
            editTarget({ navigate, targetID: data.id });
          }}
        >
          Setup
        </Button>
      ) : (
        <Button
          sx={{ marginInline: 2 }}
          onClick={() => {
            postTargetsByIDActualBudgetConnection({
              dataProvider: dataProvider!,
              targetID: data.id,
            });
          }}
        >
          Reconnect
        </Button>
      )}
    </ListItem>
  );
}
