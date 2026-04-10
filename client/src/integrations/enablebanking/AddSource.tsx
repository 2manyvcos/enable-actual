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
import Md from '@/Md';
import NumberField from '@/NumberField';
import type EnableBankingASPSP from '@shared/schema/EnableBankingASPSP';
import type Source from '@shared/schema/Source';

const setupInstructions = `
### Enable Banking Configuration

The following steps are required before adding an Enable Banking account.

1. Visit [https://enablebanking.com](https://enablebanking.com) and create an account (if you don't already have one)

2. Navigate to **API Applications** and click **Add a new application**

3. Fill out the form:

  - **Environment:**
    - \`Production\` → real bank data
    - \`Sandbox\` → mock data for testing (support and availability depends on the selected bank)

  - Generate a **private key in the browser**
  - Use a descriptive name (e.g. \`Actual Budget Import\`)
  - **Redirect URL:**

    \`\`\`
    {PUBLIC_URL}/enablebanking/callback
    \`\`\`

    - HTTPS is required for production
    - The URL does _not_ need to be accessible from the internet

  - Provide your email (data protection contact)
  - Set Privacy Policy / Terms URL (e.g. your service URL)

4. Submit the form — a \`.pem\` private key file will be downloaded.

  > 🔐 **Important:** Store the private key securely. You will need it later.

5. Note your **Application ID**
6. Link your bank accounts (required for the free plan)

After setup, your app will show as \`restricted\` but \`active\`, which is expected.
`;

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
      <Alert
        severity="info"
        sx={{
          '& > * > *:first-child': { marginTop: 0 },
          '& > * > *:last-child': { marginBottom: 0 },
        }}
      >
        <Md>{setupInstructions}</Md>
      </Alert>

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
                const [nextCountry, ...nextNameParts] = (
                  event.target.value ?? ''
                ).split('-');
                const nextName = nextNameParts.join('-');
                const aspsp = aspspResource.data?.find(
                  ({ country, name }) =>
                    country === nextCountry && name === nextName,
                );
                onChange(
                  ['enablebanking', 'bankCountry'],
                  aspsp?.country || undefined,
                );
                onChange(
                  ['enablebanking', 'bankName'],
                  aspsp?.name || undefined,
                );
                onChange(
                  ['enablebanking', 'tokenValidityDays'],
                  aspsp?.maxTokenValidityDays || undefined,
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

      <NumberField
        id="token-validity-days"
        label="Token validity (in days)"
        helperText="Select how many days the session should be valid, meaning that it needs to be renewed after the specified time. You should keep this unchanged in most cases."
        name="token-validity-days"
        min={1}
        step={1}
        value={data.enablebanking?.tokenValidityDays || null}
        onValueChange={(value) => {
          onChange(['enablebanking', 'tokenValidityDays'], value || undefined);
        }}
        required
      />
    </>
  );
}
