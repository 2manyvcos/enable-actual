import type { FetchProviderType } from '@civet/common';
import { useConfigContext, useResource } from '@civet/core';
import SaveIcon from '@mui/icons-material/Save';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useMemo, useState, type ReactNode } from 'react';
import type { input, output } from 'zod';
import NumberField from '@/NumberField';
import { putSourcesByID } from '@/api/sources';
import { postSourcesByIDEnableBankingAuth } from '@/api/sources-enablebanking';
import type EnableBankingASPSP from '@shared/schema/EnableBankingASPSP';
import type EnableBankingSourceResponse from '@shared/schema/EnableBankingSourceResponse';
import type EnableBankingSourceUpdate from '@shared/schema/EnableBankingSourceUpdate';

export default function EditSource({
  data: source,
  onSuccess,
  onClose,
  deleteAction,
}: {
  data: output<typeof EnableBankingSourceResponse>;
  onSuccess: () => void;
  onClose: () => void;
  deleteAction: ReactNode;
}) {
  const { dataProvider } = useConfigContext<FetchProviderType>();

  const [data, setData] =
    useState<Partial<input<typeof EnableBankingSourceUpdate>>>(source);

  const handleChange: <F extends keyof typeof data>(
    field: F,
    value: (typeof data)[F],
  ) => void = (field: string, value: unknown): void => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const aspspResource = useResource<
    FetchProviderType,
    output<typeof EnableBankingASPSP>[] | undefined
  >({
    name: `v1/sources/${encodeURIComponent(source.id)}/enablebanking/aspsps`,
    query: undefined,
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

  const aspsps = useMemo(
    () =>
      aspspResource.data
        ?.filter(
          ({ country }) => !data.bankCountry || country === data.bankCountry,
        )
        .toSorted((a, b) => a.name.localeCompare(b.name)) ?? [],
    [aspspResource.data, data.bankCountry],
  );

  const psuTypes = useMemo(
    () =>
      aspspResource.data
        ?.find(
          ({ country, name }) =>
            country === data.bankCountry && name === data.bankName,
        )
        ?.psuTypes.toSorted() ?? [],
    [aspspResource.data, data.bankCountry, data.bankName],
  );

  return (
    <>
      <DialogContent>
        <form
          id="edit-source"
          onSubmit={async (event) => {
            event.preventDefault();

            await putSourcesByID({
              dataProvider: dataProvider!,
              sourceID: source.id,
              data: {
                type: 'enablebanking',
                name: data.name,
                bankCountry: data.bankCountry!,
                bankName: data.bankName!,
                psuType: data.psuType!,
                tokenValidityDays: data.tokenValidityDays!,
              },
            });

            onSuccess();
            onClose();

            if (source.sessionID) return;

            const { url } = await postSourcesByIDEnableBankingAuth({
              dataProvider: dataProvider!,
              sourceID: source.id,
            });

            window.location.href = url;
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
                handleChange('name', event.target.value || undefined);
              }}
            />

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
                    value={data.bankCountry ?? ''}
                    onChange={(event) => {
                      handleChange(
                        'bankCountry',
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
                      data.bankCountry && data.bankName
                        ? `${data.bankCountry}-${data.bankName}`
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
                      handleChange('bankCountry', aspsp?.country || undefined);
                      handleChange('bankName', aspsp?.name || undefined);
                      handleChange(
                        'tokenValidityDays',
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
                    value={data.psuType || ''}
                    onChange={(event) => {
                      handleChange('psuType', event.target.value || undefined);
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
              helperText="Select how many days the session should remain active; after this period expires, it must be renewed. You should leave this setting at the value that is automatically set when you select your bank."
              name="token-validity-days"
              min={1}
              step={1}
              value={data.tokenValidityDays || null}
              onValueChange={(value) => {
                handleChange('tokenValidityDays', value || undefined);
              }}
              required
            />
          </Stack>
        </form>
      </DialogContent>

      <DialogActions>
        {deleteAction}

        <Button onClick={onClose}>Cancel</Button>

        <Button type="submit" form="edit-source" startIcon={<SaveIcon />}>
          {source.sessionID ? 'Save' : 'Save and authorize'}
        </Button>
      </DialogActions>
    </>
  );
}
