import type { FetchProviderType } from '@civet/common';
import { useResource } from '@civet/core';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { setIn } from 'immutable';
import { useState } from 'react';
import toast from 'react-hot-toast';
import type { input, output } from 'zod';
import NumberField from '@/NumberField';
import NotificationSettingsSchema from '@schema/NotificationSettings';

export default function NotificationSettings() {
  const resource = useResource<
    FetchProviderType,
    output<typeof NotificationSettingsSchema> | undefined
  >({
    name: 'v1/notification-settings',
    query: undefined,
  });

  const [state, setState] =
    useState<input<typeof NotificationSettingsSchema>>();
  const [resetStateAfterRevision, setResetStateAfterRevision] =
    useState<string>();
  if (resetStateAfterRevision) {
    if (resource.revision >= resetStateAfterRevision) {
      setState(undefined);
      setResetStateAfterRevision(undefined);
    }
  }

  const data = state ?? resource.data;

  const handleChange = (path: string[], value: unknown): void => {
    setState((prev) => {
      const base = prev ?? resource.data;
      if (!base) return prev;
      return setIn(base, path, value);
    });
  };

  const [ntfyPasswordVisible, setNtfyPasswordVisible] = useState(false);

  const save = async () => {
    await resource.dataProvider.request('v1/notification-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });

    const { revision } = await resource.notify();

    setResetStateAfterRevision(revision);
  };

  if (resource.isLoading && resource.isInitial) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={48} />

        <Skeleton variant="rounded" height={315} />

        <Skeleton variant="rounded" height={36} />
      </Stack>
    );
  }

  if (resource.error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={resource.notify}>
            Retry
          </Button>
        }
      >
        Error: {`${resource.error.message ?? resource.error}`}
      </Alert>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();

        if (!state) return;

        const promise = save();

        toast.promise(promise, {
          loading: 'Saving changes…',
          success: 'Changes saved successfully',
          error: (error) => {
            console.debug('Saving changes failed:', error);
            return `Error saving changes: ${
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
        disabled={resource.isLoading}
      >
        <Accordion variant="outlined">
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="ntfy-content"
            id="ntfy-header"
          >
            <Typography component="span">ntfy.sh</Typography>
          </AccordionSummary>

          <AccordionDetails>
            <Stack spacing={2}>
              <FormControlLabel
                label="Enable ntfy.sh Notifications"
                name="ntfy-enabled"
                control={
                  <Switch
                    id="ntfy-enabled"
                    checked={data?.ntfy?.enabled ?? false}
                    onChange={(_event, checked) => {
                      handleChange(['ntfy', 'enabled'], checked);
                    }}
                  />
                }
              />

              <Divider />

              <TextField
                id="ntfy-url"
                label="URL"
                name="ntfy-url"
                value={data?.ntfy?.url ?? ''}
                onChange={(event) => {
                  handleChange(
                    ['ntfy', 'url'],
                    event.target.value || undefined,
                  );
                }}
                required={data?.ntfy?.enabled}
              />

              <TextField
                id="ntfy-username"
                label="Username"
                name="ntfy-username"
                autoComplete="username"
                value={data?.ntfy?.username ?? ''}
                onChange={(event) => {
                  handleChange(
                    ['ntfy', 'username'],
                    event.target.value || undefined,
                  );
                }}
              />

              <TextField
                id="ntfy-password"
                label="Password"
                name="ntfy-password"
                type={ntfyPasswordVisible ? 'text' : 'password'}
                autoComplete="current-password"
                value={data?.ntfy?.password ?? ''}
                onChange={(event) => {
                  handleChange(
                    ['ntfy', 'password'],
                    event.target.value || undefined,
                  );
                }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={
                            ntfyPasswordVisible
                              ? 'hide the password'
                              : 'display the password'
                          }
                          onClick={() => {
                            setNtfyPasswordVisible((prev) => !prev);
                          }}
                          onMouseDown={(event) => {
                            event.preventDefault();
                          }}
                          onMouseUp={(event) => {
                            event.preventDefault();
                          }}
                          edge="end"
                        >
                          {ntfyPasswordVisible ? (
                            <VisibilityOffIcon />
                          ) : (
                            <VisibilityIcon />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion variant="outlined" defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="alerts-content"
            id="alerts-header"
          >
            <Typography component="span">Alerts</Typography>
          </AccordionSummary>

          <AccordionDetails>
            <Stack spacing={2}>
              <FormGroup>
                <FormControlLabel
                  label="Enable session expiry warnings"
                  name="alerts-session-expiry"
                  control={
                    <Switch
                      id="alerts-session-expiry"
                      checked={(data?.alerts?.sessionExpiryDays ?? 0) > 0}
                      onChange={(_event, checked) => {
                        handleChange(
                          ['alerts', 'sessionExpiryDays'],
                          checked ? 7 : 0,
                        );
                      }}
                    />
                  }
                />

                <FormControlLabel
                  label="Enable alerts on successful imports"
                  name="alerts-successful-imports"
                  control={
                    <Switch
                      id="alerts-successful-imports"
                      checked={data?.alerts?.successfulImports ?? false}
                      onChange={(_event, checked) => {
                        handleChange(['alerts', 'successfulImports'], checked);
                      }}
                    />
                  }
                />

                <FormControlLabel
                  label="Enable alerts on unsuccessful imports"
                  name="alerts-unsuccessful-imports"
                  control={
                    <Switch
                      id="alerts-unsuccessful-imports"
                      checked={data?.alerts?.unsuccessfulImports ?? false}
                      onChange={(_event, checked) => {
                        handleChange(
                          ['alerts', 'unsuccessfulImports'],
                          checked,
                        );
                      }}
                    />
                  }
                />
              </FormGroup>

              <Divider
                sx={{
                  '&:last-child': { display: 'none' },
                }}
              />

              {!data?.alerts?.sessionExpiryDays ? null : (
                <NumberField
                  id="alerts-session-expiry-days"
                  label="Days before session expiry"
                  helperText="Select how many days before the session expires you would like to be notified"
                  name="alerts-session-expiry-days"
                  min={1}
                  step={1}
                  value={data.alerts.sessionExpiryDays}
                  onValueChange={(value) => {
                    handleChange(['alerts', 'sessionExpiryDays'], value ?? 1);
                  }}
                />
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Button
          type="submit"
          sx={{ alignSelf: 'flex-end' }}
          startIcon={<SaveIcon />}
          loading={resource.isLoading}
          disabled={!state}
        >
          Save
        </Button>
      </Stack>
    </form>
  );
}
