import type { FetchProviderType } from '@civet/common';
import { useResource } from '@civet/core';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import { styled } from '@mui/material/styles';
import { useMemo } from 'react';
import toast from 'react-hot-toast';
import type { input, output } from 'zod';
import type EnableBankingASPSP from '@shared/schema/EnableBankingASPSP';
import type Source from '@shared/schema/Source';

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

export default function AddSource({
  data,
  onChange,
}: {
  data: input<typeof Source>;
  onChange: (path: string[], value: unknown) => void;
}) {
  const aspspResource = useResource<
    FetchProviderType,
    output<typeof EnableBankingASPSP>[] | undefined
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

  const selectedCountry = data.enablebanking?.bankCountry;
  const selectedName = data.enablebanking?.bankName;
  const countries = useMemo(
    () =>
      [
        ...new Set([
          ...(aspspResource.data?.map(({ country }) => country) ?? []),
        ]),
      ].toSorted(),
    [aspspResource.data],
  );
  const aspsps = useMemo(
    () =>
      aspspResource.data
        ?.filter(
          ({ country }) => !selectedCountry || country === selectedCountry,
        )
        .toSorted((a, b) => a.name.localeCompare(b.name)) ?? [],
    [aspspResource.data, selectedCountry],
  );
  const psuTypes = useMemo(
    () =>
      aspspResource.data
        ?.find(
          ({ country, name }) =>
            country === selectedCountry && name === selectedName,
        )
        ?.psuTypes.toSorted() ?? [],
    [aspspResource.data, selectedCountry, selectedName],
  );

  return (
    <>
      <TextField
        id="enablebanking-private-key"
        label="Private Key"
        name="enablebanking-private-key"
        value={data.enablebanking?.privateKey ?? ''}
        onChange={(event) => {
          onChange(
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
                onChange(['enablebanking', 'privateKey'], content || undefined);
                if (!data.enablebanking?.appID) {
                  onChange(
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
          onChange(['enablebanking', 'appID'], event.target.value || undefined);
        }}
        required
      />

      {!aspspResource.isDisabled ? null : (
        <Alert severity="info">
          Please enter your application ID and private key to retrieve the
          available banks from Enable Banking.
        </Alert>
      )}

      {aspspResource.isLoading && aspspResource.isInitial ? (
        <>
          <Skeleton variant="rounded" height={56} />

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
              The available banks could not be retrieved. Please make sure that
              your application ID and private key are correct.
              <br />
              Error: {`${aspspResource.error.message ?? aspspResource.error}`}
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
                onChange(
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
                data.enablebanking?.bankCountry && data.enablebanking?.bankName
                  ? `${data.enablebanking.bankCountry}-${data.enablebanking.bankName}`
                  : ''
              }
              onChange={(event) => {
                const [country, ...nameParts] = (
                  event.target.value ?? ''
                ).split('-');
                onChange(
                  ['enablebanking', 'bankCountry'],
                  country || undefined,
                );
                onChange(
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

          <FormControl fullWidth required>
            <InputLabel id="psu-type-label">PSU Type</InputLabel>
            <Select
              labelId="psu-type-label"
              id="psu-type-select"
              label="PSU Type *"
              value={data.enablebanking?.psuType || ''}
              onChange={(event) => {
                onChange(
                  ['enablebanking', 'psuType'],
                  event.target.value || undefined,
                );
              }}
            >
              {psuTypes.map((psuType) => (
                <MenuItem key={psuType} value={psuType}>
                  {psuType}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </>
      )}
    </>
  );
}
