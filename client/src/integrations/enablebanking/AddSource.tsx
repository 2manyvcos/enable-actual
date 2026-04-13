import type { FetchProviderType } from '@civet/common';
import { useConfigContext } from '@civet/core';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AccordionActions from '@mui/material/AccordionActions';
import AccordionDetails from '@mui/material/AccordionDetails';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { styled } from '@mui/material/styles';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import type { input } from 'zod';
import Md from '@/Md';
import { editSource } from '@/actions/sources';
import { postSources } from '@/data/sources';
import EnableBankingSourceRequest from '@shared/schema/EnableBankingSourceRequest';

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
  onSuccess,
  onReset,
}: {
  onSuccess: () => void;
  onReset: () => void;
}) {
  const navigate = useNavigate();
  const { dataProvider } = useConfigContext<FetchProviderType>();

  const [data, setData] = useState<
    Partial<input<typeof EnableBankingSourceRequest>>
  >({});

  const handleChange: <F extends keyof typeof data>(
    field: F,
    value: (typeof data)[F],
  ) => void = (field: string, value: unknown): void => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <AccordionDetails>
        <form
          id="add-source"
          onSubmit={async (event) => {
            event.preventDefault();

            const { id } = await postSources({
              dataProvider: dataProvider!,
              data: {
                type: 'enablebanking',
                appID: data.appID!,
                privateKey: data.privateKey!,
                name: data.name,
              },
            });

            onSuccess();
            onReset();

            editSource({ navigate, sourceID: id });
          }}
        >
          <Stack
            component="fieldset"
            spacing={2}
            sx={{ margin: 0, padding: 0, border: 'none', minWidth: 0 }}
          >
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
              id="name"
              label="Display Name"
              name="name"
              value={data.name ?? ''}
              onChange={(event) => {
                handleChange('name', event.target.value || undefined);
              }}
            />

            <TextField
              id="private-key"
              label="Private Key"
              name="private-key"
              value={data.privateKey ?? ''}
              onChange={(event) => {
                handleChange('privateKey', event.target.value || undefined);
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
                      handleChange('privateKey', content || undefined);
                      if (!data.appID) {
                        handleChange(
                          'appID',
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
              id="app-id"
              label="Application ID"
              name="app-id"
              value={data.appID ?? ''}
              onChange={(event) => {
                handleChange('appID', event.target.value || undefined);
              }}
              required
            />
          </Stack>
        </form>
      </AccordionDetails>

      <AccordionActions>
        <Button onClick={onReset}>Cancel</Button>

        <Button type="submit" form="add-source" startIcon={<AddIcon />}>
          Add source
        </Button>
      </AccordionActions>
    </>
  );
}
