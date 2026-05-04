import type { FetchProviderType } from '@civet/common';
import { useConfigContext } from '@civet/core';
import AddIcon from '@mui/icons-material/Add';
import Accordion from '@mui/material/Accordion';
import AccordionActions from '@mui/material/AccordionActions';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { set, update } from 'immutable';
import { useState } from 'react';
import type { input } from 'zod';
import { postSchedules } from '@/api/schedules';
import NumberField from '@/components/NumberField';
import ScheduleAccountMappingSchema from '@shared/schema/ScheduleAccountMapping';
import ScheduleRequest from '@shared/schema/ScheduleRequest';
import ScheduleAccountMapping from './ScheduleAccountMapping';

type HandleChangeValue<T> =
  | T
  | {
      bivarianceHack(prev: T): T;
    }['bivarianceHack'];

function Component({ onReset }: { onReset: () => void }) {
  const { dataProvider } = useConfigContext<FetchProviderType>();

  const [data, setData] = useState<Partial<input<typeof ScheduleRequest>>>({
    schedule: '0 0 * * *',
    initialDays: 0,
    overscanDays: 7,
    offsetDays: 0,
    appendPayeeID: false,
  });

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
      <AccordionDetails>
        <form
          id="add-schedule"
          onSubmit={async (event) => {
            event.preventDefault();

            await postSchedules({
              dataProvider: dataProvider!,
              data: {
                name: data.name,
                schedule: data.schedule!,
                initialDays: data.initialDays!,
                overscanDays: data.overscanDays!,
                offsetDays: data.offsetDays!,
                appendPayeeID: data.appendPayeeID!,
                accounts: data.accounts!,
              },
            });

            onReset();
          }}
        >
          <Stack
            component="fieldset"
            spacing={2}
            sx={{ margin: 0, padding: 0, border: 'none', minWidth: 0 }}
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

            <FormControlLabel
              label="Add account identification (e.g. IBAN) to payees"
              name="append-payee-id"
              control={
                <Switch
                  id="append-payee-id"
                  checked={data.appendPayeeID ?? false}
                  onChange={(_event, checked) => {
                    handleChange('appendPayeeID', checked);
                  }}
                />
              }
            />

            <ScheduleAccountMapping
              data={data.accounts ?? [{}]}
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
      </AccordionDetails>

      <AccordionActions>
        <Button onClick={onReset}>Cancel</Button>

        <Button type="submit" form="add-schedule" startIcon={<AddIcon />}>
          Add schedule
        </Button>
      </AccordionActions>
    </>
  );
}

export default function AddSchedule() {
  const [expanded, setExpanded] = useState(false);

  return (
    <Accordion
      variant="outlined"
      expanded={expanded}
      onChange={(_event, isExpanded) => {
        setExpanded(isExpanded);
      }}
      slotProps={{ transition: { unmountOnExit: true } }}
    >
      <AccordionSummary
        expandIcon={<AddIcon />}
        aria-controls="add-schedule-content"
        id="add-schedule-header"
      >
        <Typography component="span">Add schedule</Typography>
      </AccordionSummary>

      <Component
        onReset={() => {
          setExpanded(false);
        }}
      />
    </Accordion>
  );
}
