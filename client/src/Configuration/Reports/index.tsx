import type { FetchProviderType } from '@civet/common';
import { useResource } from '@civet/core';
import AccordionActions from '@mui/material/AccordionActions';
import AccordionDetails from '@mui/material/AccordionDetails';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { useMemo } from 'react';
import { array, type input, type output } from 'zod';
import { deleteReports } from '@/api/reports';
import ImportReport from '@shared/schema/ImportReport';
import { stringifyError } from '@shared/utils';
import Report from './Report';

export default function Reports() {
  const resource = useResource<
    FetchProviderType,
    input<typeof ImportReport>[] | undefined
  >({
    name: 'v1/reports',
    query: undefined,
  });

  const [data, error] = useMemo<
    [output<typeof ImportReport>[], unknown]
  >(() => {
    try {
      return [array(ImportReport).decode(resource.data ?? []), undefined];
    } catch (error) {
      return [[], error];
    }
  }, [resource.data]);

  if (resource.isLoading && resource.isInitial) {
    return (
      <AccordionDetails>
        <Stack spacing={2}>
          <Skeleton variant="rounded" height={88} />

          <Skeleton variant="rounded" height={88} />
        </Stack>
      </AccordionDetails>
    );
  }

  if (resource.error || error) {
    return (
      <AccordionDetails>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={resource.notify}>
              Retry
            </Button>
          }
        >
          Error: {stringifyError(resource.error || error)}
        </Alert>
      </AccordionDetails>
    );
  }

  return (
    <>
      <AccordionActions>
        <Button
          onClick={async () => {
            await deleteReports({ dataProvider: resource.dataProvider });

            resource.notify();
          }}
        >
          Clear
        </Button>

        <Button onClick={resource.notify}>Reload</Button>
      </AccordionActions>

      <AccordionDetails>
        {data.map((report) => (
          <Report key={report.id} data={report} />
        ))}
      </AccordionDetails>
    </>
  );
}
