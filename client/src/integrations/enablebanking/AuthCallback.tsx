import type { FetchProviderType } from '@civet/common';
import { useResource } from '@civet/core';
import Alert from '@mui/material/Alert';
import Backdrop from '@mui/material/Backdrop';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import { useSearchParams, Link as RouterLink } from 'react-router';
import type { input, output } from 'zod';
import type EnableBankingSessionRequest from '@shared/schema/EnableBankingSessionRequest';
import type IDResponse from '@shared/schema/IDResponse';

const headers = { 'Content-Type': 'application/json' };

export default function AuthCallback() {
  const [search] = useSearchParams();
  const state = search.get('state');
  const code = search.get('code');
  const error = search.get('error');
  const errorDescription = search.get('error_description');

  const resource = useResource<FetchProviderType, output<typeof IDResponse>>({
    name: 'v1/enablebanking/session',
    query: {
      method: 'POST',
      headers,
      body: JSON.stringify({
        state: state!,
        code: code!,
      } satisfies input<typeof EnableBankingSessionRequest>),
    },
    disabled: !state || !code,
  });

  if (!state || !code) {
    let errorMessage = 'Something went wrong';
    if (error) errorMessage += ` (${error})`;
    if (errorDescription) errorMessage += ` - ${errorDescription}`;

    return (
      <Container sx={{ paddingTop: 2 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" component={RouterLink} to="/">
              Home
            </Button>
          }
        >
          {errorMessage}
        </Alert>
      </Container>
    );
  }

  if (resource.isLoading) {
    return (
      <Backdrop
        sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
        open
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    );
  }

  if (resource.error) {
    return (
      <Container sx={{ paddingTop: 2 }}>
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
      </Container>
    );
  }

  return (
    <Container sx={{ paddingTop: 2 }}>
      <Alert
        severity="success"
        action={
          <Button color="inherit" size="small" component={RouterLink} to="/">
            Home
          </Button>
        }
      >
        Your session has been successfully authorized. You may now leave this
        page.
      </Alert>
    </Container>
  );
}
