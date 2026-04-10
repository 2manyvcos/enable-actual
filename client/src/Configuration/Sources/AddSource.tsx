import type { FetchProviderType } from '@civet/common';
import { useConfigContext } from '@civet/core';
import AddIcon from '@mui/icons-material/Add';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { setIn } from 'immutable';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { v7 as uuid } from 'uuid';
import type { input } from 'zod';
import EnableBankingAddSource from '@/integrations/enablebanking/AddSource';
import type Source from '@shared/schema/Source';

export default function AddSource({ notify }: { notify: () => void }) {
  const { dataProvider } = useConfigContext<FetchProviderType>();

  const [id, setID] = useState(uuid());
  const [data, setData] = useState<input<typeof Source>>({
    type: 'enablebanking',
  });

  const handleChange = (path: string[], value: unknown): void => {
    setData((prev) => setIn(prev, path, value));
  };

  const create = async () => {
    await dataProvider!.request('v1/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data satisfies input<typeof Source>),
    });

    notify();

    setData({ type: 'enablebanking' });
    setID(uuid());
  };

  return (
    <Accordion key={id} variant="outlined">
      <AccordionSummary
        expandIcon={<AddIcon />}
        aria-controls="add-source-content"
        id="add-source-header"
      >
        <Typography component="span">Add source</Typography>
      </AccordionSummary>

      <AccordionDetails>
        <form
          onSubmit={(event) => {
            event.preventDefault();

            const promise = create();

            toast.promise(promise, {
              loading: 'Creating record…',
              success: 'Record created successfully',
              error: (error) => {
                console.debug('Creating record failed:', error);
                return `Error creating record: ${
                  error?.message ?? error ?? 'Unexpected error'
                }`;
              },
            });
          }}
        >
          <Stack
            component="fieldset"
            spacing={2}
            sx={{ margin: 0, padding: 0, border: 'none' }}
          >
            <TextField
              id="name"
              label="Display Name"
              name="name"
              value={data.name ?? ''}
              onChange={(event) => {
                handleChange(['name'], event.target.value || undefined);
              }}
            />

            {data.type !== 'enablebanking' ? null : (
              <EnableBankingAddSource data={data} onChange={handleChange} />
            )}

            <Button
              type="submit"
              sx={{ alignSelf: 'flex-end' }}
              startIcon={<AddIcon />}
            >
              Add source
            </Button>
          </Stack>
        </form>
      </AccordionDetails>
    </Accordion>
  );
}
