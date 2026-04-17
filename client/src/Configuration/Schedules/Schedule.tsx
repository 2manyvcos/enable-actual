import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { useNavigate } from 'react-router';
import type { output } from 'zod';
import { editSchedule } from '@/actions/schedules';
import type ScheduleResponse from '@shared/schema/ScheduleResponse';

export default function Schedule({
  data,
}: {
  data: output<typeof ScheduleResponse>;
}) {
  const navigate = useNavigate();

  return (
    <ListItem
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
    </ListItem>
  );
}
