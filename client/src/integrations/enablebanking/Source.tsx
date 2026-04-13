import type { FetchProviderType } from '@civet/common';
import { useConfigContext } from '@civet/core';
import Button from '@mui/material/Button';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { type output } from 'zod';
import { editSource } from '@/actions/sources';
import { postSourcesByIDEnableBankingAuth } from '@/data/sources-enablebanking';
import type EnableBankingSourceResponse from '@shared/schema/EnableBankingSourceResponse';
import { addToDate, startOfDate } from '@shared/utils';

export default function Source({
  data,
  editAction,
}: {
  data: output<typeof EnableBankingSourceResponse>;
  editAction: ReactNode;
}) {
  const navigate = useNavigate();
  const { dataProvider } = useConfigContext<FetchProviderType>();

  const sessionValidUntil = !data.sessionValidUntil
    ? undefined
    : startOfDate(data.sessionValidUntil);
  const today = startOfDate(new Date());

  return (
    <ListItem secondaryAction={editAction}>
      <ListItemText
        primary={data.name ?? data.id}
        secondary={
          <>
            Enable Banking |{' '}
            {!data.sessionID ? (
              <Typography variant="inherit" component="span" color="warning">
                No active session
              </Typography>
            ) : !sessionValidUntil ? (
              <Typography variant="inherit" component="span" color="warning">
                Session expiry details unavailable
              </Typography>
            ) : sessionValidUntil <= today ? (
              <Typography variant="inherit" component="span" color="error">
                Session expired{' '}
                {(() => {
                  const days = Math.floor(
                    Math.max(0, today.getTime() - sessionValidUntil.getTime()) /
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
                  sessionValidUntil <= addToDate(today, 7)
                    ? 'warning'
                    : 'success'
                }
              >
                Session expires{' '}
                {(() => {
                  const days = Math.floor(
                    Math.max(0, sessionValidUntil.getTime() - today.getTime()) /
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

      {data.setupRequired ? (
        <Button
          color="warning"
          sx={{ marginInline: 2 }}
          onClick={() => {
            editSource({ navigate, sourceID: data.id });
          }}
        >
          Setup
        </Button>
      ) : (
        <Button
          color={
            !data.sessionID ||
            !sessionValidUntil ||
            sessionValidUntil <= addToDate(today, 7)
              ? 'warning'
              : undefined
          }
          sx={{ marginInline: 2 }}
          onClick={async () => {
            const { url } = await postSourcesByIDEnableBankingAuth({
              dataProvider: dataProvider!,
              sourceID: data.id,
            });

            window.location.href = url;
          }}
        >
          {data.sessionID ? 'Reauthorize' : 'Authorize'}
        </Button>
      )}
    </ListItem>
  );
}
