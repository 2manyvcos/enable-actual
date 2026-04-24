import type { FetchProviderType } from '@civet/common';
import { useConfigContext } from '@civet/core';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { set, update } from 'immutable';
import { useState, type ReactNode } from 'react';
import type { input, output } from 'zod';
import { deleteSchedulesByIDState, putSchedulesByID } from '@/api/schedules';
import NumberField from '@/components/NumberField';
import ScheduleAccountMappingSchema from '@shared/schema/ScheduleAccountMapping';
import type ScheduleResponse from '@shared/schema/ScheduleResponse';
import type ScheduleUpdate from '@shared/schema/ScheduleUpdate';
import DeleteSchedule from './DeleteSchedule';
import ScheduleAccountMapping from './ScheduleAccountMapping';

type HandleChangeValue<T> =
  | T
  | {
      bivarianceHack(prev: T): T;
    }['bivarianceHack'];

function Component({
  data: schedule,
  onClose,
  deleteAction,
}: {
  data: output<typeof ScheduleResponse>;
  onClose: () => void;
  deleteAction: ReactNode;
}) {
  const { dataProvider } = useConfigContext<FetchProviderType>();

  const [data, setData] =
    useState<Partial<input<typeof ScheduleUpdate>>>(schedule);

  const handleChange: <F extends keyof typeof data>(
    field: F,
    value: HandleChangeValue<(typeof data)[F]>,
  ) => void = (field: string, value: unknown): void => {
    setData((prev) => {
      if (typeof value === 'function')
        return update(
          prev,
          field as keyof typeof data,
          value as (
            prev: (typeof data)[keyof typeof data],
          ) => (typeof data)[keyof typeof data],
        );
      return set(prev, field, value);
    });
  };

  return (
    <>
      <DialogContent>
        <form
          id="edit-schedule"
          onSubmit={async (event) => {
            event.preventDefault();

            await putSchedulesByID({
              dataProvider: dataProvider!,
              scheduleID: schedule.id,
              data: {
                name: data.name,
                schedule: data.schedule!,
                initialDays: data.initialDays!,
                overscanDays: data.overscanDays!,
                offsetDays: data.offsetDays!,
                accounts: data.accounts!,
              },
            });

            onClose();
          }}
        >
          <Stack
            component="fieldset"
            spacing={2}
            sx={{ margin: 0, padding: 0, border: 'none', minWidth: '500px' }}
          >
            <TextField
              id="name"
              label="Display Name"
              name="name"
              value={data.name ?? ''}
              onChange={(event) => {
                handleChange('name', event.target.value || undefined);
              }}
            />

            <TextField
              id="schedule"
              label="Schedule"
              helperText={
                <span>
                  Specify how often the schedule should be run using{' '}
                  <a
                    href="https://crontab.guru"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Cron syntax
                  </a>
                  .
                </span>
              }
              name="schedule"
              value={data.schedule ?? ''}
              onChange={(event) => {
                handleChange('schedule', event.target.value || undefined);
              }}
              required
            />

            <NumberField
              id="initial-days"
              label="Initial days"
              helperText="Select the number of days to include in the initial import."
              name="initial-days"
              min={0}
              step={1}
              value={data.initialDays ?? null}
              onValueChange={(value) => {
                handleChange('initialDays', value ?? undefined);
              }}
            />

            <NumberField
              id="overscan-days"
              label="Overscan days"
              helperText="Select the number of days by which the previous import should overlap. This can be helpful for pending transactions."
              name="overscan-days"
              min={0}
              step={1}
              value={data.overscanDays ?? null}
              onValueChange={(value) => {
                handleChange('overscanDays', value ?? undefined);
              }}
            />

            <NumberField
              id="offset-days"
              label="Offset days"
              helperText="Select how many of the most recent days to ignore during import. This can help prevent duplicate transactions if your bank modifies transactions during that time period."
              name="offset-days"
              min={0}
              step={1}
              value={data.offsetDays ?? null}
              onValueChange={(value) => {
                handleChange('offsetDays', value ?? undefined);
              }}
            />

            <ScheduleAccountMapping
              data={data.accounts ?? []}
              onChange={(value) => {
                handleChange(
                  'accounts',
                  value as HandleChangeValue<
                    input<typeof ScheduleAccountMappingSchema>[]
                  >,
                );
              }}
            />
          </Stack>
        </form>
      </DialogContent>

      <DialogActions>
        {deleteAction}

        <Button
          onClick={() => {
            deleteSchedulesByIDState({
              dataProvider: dataProvider!,
              scheduleID: schedule.id,
            });
          }}
        >
          Reset state
        </Button>

        <Button onClick={onClose}>Cancel</Button>

        <Button type="submit" form="edit-schedule" startIcon={<SaveIcon />}>
          Save
        </Button>
      </DialogActions>
    </>
  );
}

export default function EditSchedule({
  data,
  onClose,
}: {
  data: output<typeof ScheduleResponse> | undefined;
  onClose: () => void;
}) {
  const [deleteRequested, setDeleteRequested] = useState(false);

  return (
    <>
      <Dialog open={!!data} onClose={onClose}>
        <DialogTitle>Edit schedule</DialogTitle>

        <Component
          data={data!}
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
      </Dialog>

      {!data ? null : (
        <DeleteSchedule
          open={deleteRequested}
          data={data}
          onSuccess={onClose}
          onClose={() => {
            setDeleteRequested(false);
          }}
        />
      )}
    </>
  );
}
