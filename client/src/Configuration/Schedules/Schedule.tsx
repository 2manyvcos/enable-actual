import type { FetchProviderType } from '@civet/common';
import { useConfigContext } from '@civet/core';
import EditIcon from '@mui/icons-material/Edit';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import type { output } from 'zod';
import { editSchedule } from '@/actions/schedules';
import { postSchedulesByIDExecutions } from '@/api/schedules';
import type ScheduleResponse from '@shared/schema/ScheduleResponse';

export default function Schedule({
  data,
  preview,
}: {
  data: output<typeof ScheduleResponse>;
  preview: boolean;
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
      secondaryAction={
        <IconButton
          aria-label="edit"
          onClick={() => {
            editSchedule({ navigate, scheduleID: data.id });
          }}
        >
          <EditIcon />
        </IconButton>
      }
    >
      <ListItemText
        primary={data.name ?? data.id}
        secondary={
          !data.nextRun
            ? undefined
            : `Next run at ${new Date(data.nextRun).toLocaleString()}`
        }
      />

      <Button
        sx={{ marginInline: 2 }}
        onClick={() => {
          postSchedulesByIDExecutions({
            dataProvider: dataProvider!,
            scheduleID: data.id,
          });
        }}
      >
        Run now
      </Button>
    </ListItem>
  );
}
