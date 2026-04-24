import type { FetchProviderType } from '@civet/common';
import { useConfigContext } from '@civet/core';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AccordionActions from '@mui/material/AccordionActions';
import AccordionDetails from '@mui/material/AccordionDetails';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { set } from 'immutable';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { input } from 'zod';
import { editTarget } from '@/actions/targets';
import { postTargets } from '@/api/targets';
import Md from '@/components/Md';
import ActualBudgetTargetRequest from '@shared/schema/ActualBudgetTargetRequest';

const setupInstructions = `
### Actual Budget Configuration

The following steps are required before adding an Actual Budget target.

1. Start Actual Budget **without OpenID configuration**
2. Set a **server password**
3. Create your first budget
4. (Optional) Enable OpenID later via the UI:
  - Go to **Settings → OpenID**
  - Enable authentication

Enable Actual requires password authentication to connect to your Actual Budget server.

> ⚠️ **Important limitation:**
> You currently cannot configure both OpenID _and_ password authentication via environment variables or config files. Doing so will break API authentication.

You may set \`ACTUAL_USER_CREATION_MODE=login\` to automatically create users after successful OpenID login.
`;

export default function AddTarget({ onReset }: { onReset: () => void }) {
  const navigate = useNavigate();
  const { dataProvider } = useConfigContext<FetchProviderType>();

  const [data, setData] = useState<
    Partial<input<typeof ActualBudgetTargetRequest>>
  >({});

  const handleChange: <F extends keyof typeof data>(
    field: F,
    value: (typeof data)[F],
  ) => void = (field: string, value: unknown): void => {
    setData((prev) => set(prev, field, value));
  };

  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <>
      <AccordionDetails>
        <form
          id="add-target"
          onSubmit={async (event) => {
            event.preventDefault();

            const { id } = await postTargets({
              dataProvider: dataProvider!,
              data: {
                type: 'actualbudget',
                name: data.name,
                url: data.url!,
                password: data.password!,
              },
            });

            onReset();

            editTarget({ navigate, targetID: id });
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
              id="url"
              label="Server URL"
              name="url"
              value={data.url ?? ''}
              onChange={(event) => {
                handleChange('url', event.target.value || undefined);
              }}
              required
            />

            <TextField
              id="password"
              label="Password"
              name="password"
              type={passwordVisible ? 'text' : 'password'}
              autoComplete="current-password"
              value={data.password ?? ''}
              onChange={(event) => {
                handleChange('password', event.target.value || undefined);
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          passwordVisible
                            ? 'hide the password'
                            : 'display the password'
                        }
                        onClick={() => {
                          setPasswordVisible((prev) => !prev);
                        }}
                        onMouseDown={(event) => {
                          event.preventDefault();
                        }}
                        onMouseUp={(event) => {
                          event.preventDefault();
                        }}
                        edge="end"
                      >
                        {passwordVisible ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              required
            />
          </Stack>
        </form>
      </AccordionDetails>

      <AccordionActions>
        <Button onClick={onReset}>Cancel</Button>

        <Button type="submit" form="add-target" startIcon={<AddIcon />}>
          Add target
        </Button>
      </AccordionActions>
    </>
  );
}
