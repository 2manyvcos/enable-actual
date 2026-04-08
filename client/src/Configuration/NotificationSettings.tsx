import type { FetchProviderType } from '@civet/common';
import { useResource } from '@civet/core';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import NumberField from '@/NumberField';

type NotificationSettings = {
  ntfy?: {
    enabled?: boolean;
    url?: string;
    username?: string;
    password?: string;
  };
  alerts?: {
    sessionExpiryDays?: number;
    successfulImports?: boolean;
    unsuccessfulImports?: boolean;
  };
};

export default function NotificationSettings() {
  const [ntfyEnabled, setNtfyEnabled] = useState(false);
  const [ntfyURL, setNtfyURL] = useState('');
  const [ntfyUsername, setNtfyUsername] = useState('');
  const [ntfyPassword, setNtfyPassword] = useState('');
  const [ntfyPasswordVisible, setNtfyPasswordVisible] = useState(false);
  const [alertsSessionExpiryDays, setAlertsSessionExpiryDays] = useState(0);
  const [alertsSuccessfulImports, setAlertsSuccessfulImports] = useState(false);
  const [alertsUnsuccessfulImports, setAlertsUnsuccessfulImports] =
    useState(false);

  const resource = useResource<
    FetchProviderType,
    NotificationSettings | undefined
  >({
    name: 'v1/config/notifications',
    query: undefined,
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNtfyEnabled(resource.data?.ntfy?.enabled ?? false);
    setNtfyURL(resource.data?.ntfy?.url ?? '');
    setNtfyUsername(resource.data?.ntfy?.username ?? '');
    setNtfyPassword(resource.data?.ntfy?.password ?? '');
    setAlertsSessionExpiryDays(resource.data?.alerts?.sessionExpiryDays ?? 0);
    setAlertsSuccessfulImports(
      resource.data?.alerts?.successfulImports ?? false,
    );
    setAlertsUnsuccessfulImports(
      resource.data?.alerts?.unsuccessfulImports ?? false,
    );
  }, [resource.data]);

  if (resource.isLoading && resource.isInitial) {
    // TODO: render skeleton
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

  const save = async () =>
    resource.dataProvider.request('v1/config/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ntfy: {
          enabled: ntfyEnabled,
          url: ntfyURL || undefined,
          username: ntfyUsername || undefined,
          password: ntfyPassword || undefined,
        },
        alerts: {
          sessionExpiryDays: alertsSessionExpiryDays || undefined,
          successfulImports: alertsSuccessfulImports,
          unsuccessfulImports: alertsUnsuccessfulImports,
        },
      } satisfies NotificationSettings),
    });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        const promise = save();

        toast.promise(promise, {
          loading: 'Saving changes…',
          success: 'Saved changes successfully',
          error: (error) => {
            console.error(error);
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
        sx={{ border: 'none' }}
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
                    checked={ntfyEnabled}
                    onChange={(_event, checked) => {
                      setNtfyEnabled(checked);
                    }}
                  />
                }
              />

              <Divider />

              <TextField
                id="ntfy-url"
                label="URL"
                name="ntfy-url"
                value={ntfyURL}
                onChange={(event) => {
                  setNtfyURL(event.target.value);
                }}
              />

              <TextField
                id="ntfy-username"
                label="Username"
                name="ntfy-username"
                autoComplete="username"
                value={ntfyUsername}
                onChange={(event) => {
                  setNtfyUsername(event.target.value);
                }}
              />

              <TextField
                id="ntfy-password"
                label="Password"
                name="ntfy-password"
                type={ntfyPasswordVisible ? 'text' : 'password'}
                autoComplete="current-password"
                value={ntfyPassword}
                onChange={(event) => {
                  setNtfyPassword(event.target.value);
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
                      checked={alertsSessionExpiryDays > 0}
                      onChange={(_event, checked) => {
                        setAlertsSessionExpiryDays(checked ? 7 : 0);
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
                      checked={alertsSuccessfulImports}
                      onChange={(_event, checked) => {
                        setAlertsSuccessfulImports(checked);
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
                      checked={alertsUnsuccessfulImports}
                      onChange={(_event, checked) => {
                        setAlertsUnsuccessfulImports(checked);
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

              {!alertsSessionExpiryDays ? null : (
                <NumberField
                  id="alerts-session-expiry-days"
                  label="Days before session expiry"
                  helperText="Select how many days before the session expires you would like to be notified"
                  name="alerts-session-expiry-days"
                  min={1}
                  step={1}
                  value={alertsSessionExpiryDays}
                  onValueChange={(value) => {
                    setAlertsSessionExpiryDays(value ?? 1);
                  }}
                />
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Button type="submit" variant="contained" loading={resource.isLoading}>
          Save
        </Button>
      </Stack>
    </form>
  );
}
