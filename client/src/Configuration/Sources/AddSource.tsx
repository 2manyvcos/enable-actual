import type { FetchProviderType } from '@civet/common';
import { useConfigContext, useResource } from '@civet/core';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { setIn } from 'immutable';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { v7 as uuid } from 'uuid';
import type { input } from 'zod';
import type Source from '@schema/Source';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

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
      body: JSON.stringify(data),
    });

    notify();

    setData({ type: 'enablebanking' });
    setID(uuid());
  };

  const aspspResource = useResource<
    FetchProviderType,
    { name: string; country: string }[] | undefined
  >({
    name: 'v1/enablebanking/aspsps',
    query: {
      search: new URLSearchParams({
        appID: data.enablebanking?.appID ?? '',
        privateKey: data.enablebanking?.privateKey ?? '',
      }).toString(),
    },
    disabled: !data.enablebanking?.appID || !data.enablebanking.privateKey,
  });

  const countries = useMemo(
    () =>
      [
        ...new Set([
          ...(aspspResource.data?.map(({ country }) => country) ?? []),
        ]),
      ].toSorted(),
    [aspspResource.data],
  );

  const selectedCountry = data.enablebanking?.bankCountry;
  const aspsps = useMemo(
    () =>
      aspspResource.data
        ?.filter(
          ({ country }) => !selectedCountry || country === selectedCountry,
        )
        .toSorted((a, b) => a.name.localeCompare(b.name)) ?? [],
    [aspspResource.data, selectedCountry],
  );

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

            <TextField
              id="enablebanking-private-key"
              label="Private Key"
              name="enablebanking-private-key"
              value={data.enablebanking?.privateKey ?? ''}
              onChange={(event) => {
                handleChange(
                  ['enablebanking', 'privateKey'],
                  event.target.value || undefined,
                );
              }}
              multiline
              required
            />

            <Button
              component="label"
              role={undefined}
              variant="contained"
              tabIndex={-1}
              startIcon={<CloudUploadIcon />}
            >
              Upload private key
              <VisuallyHiddenInput
                type="file"
                onChange={(event) => {
                  if (event.target.files?.length) {
                    const [file] = event.target.files;
                    const reader = new FileReader();
                    reader.readAsText(file);
                    reader.onload = () => {
                      const content = reader.result?.toString() ?? '';
                      if (!content.startsWith('-----BEGIN PRIVATE KEY-----')) {
                        toast.error(
                          'The uploaded file does not seem to contain a private key',
                        );
                        return;
                      }
                      handleChange(
                        ['enablebanking', 'privateKey'],
                        content || undefined,
                      );
                      if (!data.enablebanking?.appID) {
                        handleChange(
                          ['enablebanking', 'appID'],
                          (file.name.includes('.')
                            ? file.name.split('.').slice(0, -1).join('.')
                            : file.name) || undefined,
                        );
                      }
                    };
                    reader.onerror = () => {
                      toast.error('Error loading file');
                    };
                  }
                  event.target.value = '';
                }}
              />
            </Button>

            <TextField
              id="enablebanking-app-id"
              label="Application ID"
              name="enablebanking-app-id"
              value={data.enablebanking?.appID ?? ''}
              onChange={(event) => {
                handleChange(
                  ['enablebanking', 'appID'],
                  event.target.value || undefined,
                );
              }}
              required
            />

            {!aspspResource.isDisabled ? null : (
              <Alert severity="info">
                Please enter your application ID and private key so that the
                available banks can be retrieved from Enable Banking.
              </Alert>
            )}

            {aspspResource.isLoading && aspspResource.isInitial ? (
              <>
                <Skeleton variant="rounded" height={56} />

                <Skeleton variant="rounded" height={56} />
              </>
            ) : (
              <>
                {!aspspResource.error ? null : (
                  <Alert
                    severity="error"
                    action={
                      <Button
                        color="inherit"
                        size="small"
                        onClick={aspspResource.notify}
                      >
                        Retry
                      </Button>
                    }
                  >
                    The available banks could not be retrieved. Please make sure
                    that your application ID and private key are correct.
                    <br />
                    Error:{' '}
                    {`${aspspResource.error.message ?? aspspResource.error}`}
                  </Alert>
                )}

                <FormControl fullWidth required>
                  <InputLabel id="bank-country-label">Bank Country</InputLabel>
                  <Select
                    labelId="bank-country-label"
                    id="bank-country-select"
                    label="Bank Country *"
                    value={data.enablebanking?.bankCountry ?? ''}
                    onChange={(event) => {
                      handleChange(
                        ['enablebanking', 'bankCountry'],
                        event.target.value || undefined,
                      );
                    }}
                  >
                    {countries.map((country) => (
                      <MenuItem key={country} value={country}>
                        {country}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth required>
                  <InputLabel id="bank-name-label">Bank Name</InputLabel>
                  <Select
                    labelId="bank-name-label"
                    id="bank-name-select"
                    label="Bank Name *"
                    value={
                      data.enablebanking?.bankCountry &&
                      data.enablebanking?.bankName
                        ? `${data.enablebanking.bankCountry}-${data.enablebanking.bankName}`
                        : ''
                    }
                    onChange={(event) => {
                      const [country, ...nameParts] = (
                        event.target.value ?? ''
                      ).split('-');
                      handleChange(
                        ['enablebanking', 'bankCountry'],
                        country || undefined,
                      );
                      handleChange(
                        ['enablebanking', 'bankName'],
                        nameParts.join('-') || undefined,
                      );
                    }}
                  >
                    {aspsps.map(({ name, country }) => (
                      <MenuItem
                        key={`${country}-${name}`}
                        value={`${country}-${name}`}
                      >
                        {name} ({country})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}

            <FormControl fullWidth required>
              <InputLabel id="psu-type-label">PSU Type</InputLabel>
              <Select
                labelId="psu-type-label"
                id="psu-type-select"
                label="PSU Type *"
                value={data.enablebanking?.psuType || ''}
                onChange={(event) => {
                  handleChange(
                    ['enablebanking', 'psuType'],
                    event.target.value || undefined,
                  );
                }}
                // TODO: take this from aspsp data instead of hard coding the values
              >
                <MenuItem value="personal">Personal</MenuItem>
                <MenuItem value="business">Business</MenuItem>
              </Select>
            </FormControl>

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
