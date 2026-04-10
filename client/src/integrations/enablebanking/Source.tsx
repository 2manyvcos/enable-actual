import type { FetchProviderType } from '@civet/common';
import { useConfigContext } from '@civet/core';
import Button from '@mui/material/Button';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { type output } from 'zod';
import type EnableBankingAuthorizationRequest from '@shared/schema/EnableBankingAuthorizationRequest';
import SourceSchema from '@shared/schema/Source';
import { addToDate, startOfDate } from '@shared/utils';

export default function Source({
  id,
  data,
  notify: _notify,
  deleteAction,
}: {
  id: string;
  data: output<typeof SourceSchema>;
  notify: () => void;
  deleteAction: ReactNode;
}) {
  const { dataProvider } = useConfigContext<FetchProviderType>();

  const auth = async () => {
    const { url } = await dataProvider!.request<
      output<typeof EnableBankingAuthorizationRequest>
    >(`v1/enablebanking/auth/${encodeURIComponent(id)}`, { method: 'POST' });

    window.location.href = url;
  };

  const sessionValidUntil = !data.enablebanking?.sessionValidUntil
    ? undefined
    : startOfDate(data.enablebanking.sessionValidUntil);
  const today = startOfDate(new Date());

  return (
    <ListItem secondaryAction={deleteAction}>
      <ListItemText
        primary={data.name ?? id}
        secondary={
          <>
            Enable Banking |{' '}
            {!data.enablebanking?.sessionID ? (
              <Typography variant="inherit" component="span" color="warning">
                No active session
              </Typography>
            ) : !data.enablebanking.sessionValidUntil ? (
              <Typography variant="inherit" component="span" color="warning">
                Session expiry details unavailable
              </Typography>
            ) : sessionValidUntil! <= today ? (
              <Typography variant="inherit" component="span" color="error">
                Session expired{' '}
                {(() => {
                  const days = Math.floor(
                    Math.max(
                      0,
                      today.getTime() - sessionValidUntil!.getTime(),
                    ) /
                      (24 * 60 * 60 * 1000),
                  );
                  switch (days) {
                    case 0:
                      return 'today';
                    case 1:
                      return 'yesterday';
                    default:
                      return `${days.toLocaleString()} days ago`;
                  }
                })()}
              </Typography>
            ) : (
              <Typography
                variant="inherit"
                component="span"
                color={
                  sessionValidUntil! > addToDate(today, 7)
                    ? 'success'
                    : 'warning'
                }
              >
                Session expires{' '}
                {(() => {
                  const days = Math.floor(
                    Math.max(
                      0,
                      sessionValidUntil!.getTime() - today.getTime(),
                    ) /
                      (24 * 60 * 60 * 1000),
                  );
                  switch (days) {
                    case 1:
                      return 'tomorrow';
                    default:
                      return `in ${days.toLocaleString()} days`;
                  }
                })()}
              </Typography>
            )}
          </>
        }
      />

      <Button
        sx={{ marginInline: 2 }}
        onClick={() => {
          const promise = auth();

          toast.promise(promise, {
            loading: 'Requesting authorization…',
            success:
              'Authorization requested successfully - you should be redirected now',
            error: (error) => {
              console.debug('Requesting authorization failed:', error);
              return `Error requesting authorization: ${
                error?.message ?? error ?? 'Unexpected error'
              }`;
            },
          });
        }}
      >
        {data.enablebanking?.sessionID ? 'Reauthorize' : 'Authorize'}
      </Button>
    </ListItem>
  );
}
