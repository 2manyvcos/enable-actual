import type { FetchProviderType } from '@civet/common';
import { useResource } from '@civet/core';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/Delete';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { remove, setIn } from 'immutable';
import type { input, output } from 'zod';
import type ScheduleAccountMappingSchema from '@shared/schema/ScheduleAccountMapping';
import type SourceAccount from '@shared/schema/SourceAccount';
import type SourceResponse from '@shared/schema/SourceResponse';
import type TargetAccount from '@shared/schema/TargetAccount';
import type TargetResponse from '@shared/schema/TargetResponse';
import { stringifyError } from '@shared/utils';

function Item({
  data: items,
  onChange,
  index,
  sources,
  targets,
}: {
  data: Partial<input<typeof ScheduleAccountMappingSchema>>[];
  onChange: (
    value:
      | Partial<input<typeof ScheduleAccountMappingSchema>>[]
      | ((
          prev: Partial<input<typeof ScheduleAccountMappingSchema>>[],
        ) => Partial<input<typeof ScheduleAccountMappingSchema>>[]),
  ) => void;
  index: number;
  sources: output<typeof SourceResponse>[];
  targets: output<typeof TargetResponse>[];
}) {
  const data = items[index];

  const handleChange: <F extends keyof typeof data>(
    field: F,
    value: (typeof data)[F],
  ) => void = (field: string, value: unknown): void => {
    onChange((prev) => setIn(prev ?? [{}], [index, field], value));
  };

  const sourceAccountResource = useResource<
    FetchProviderType,
    output<typeof SourceAccount>[] | undefined
  >({
    name: `v1/sources/${encodeURIComponent(data.sourceID!)}/accounts`,
    query: undefined,
    events: true,
    disabled: !data.sourceID,
  });

  const targetAccountResource = useResource<
    FetchProviderType,
    output<typeof TargetAccount>[] | undefined
  >({
    name: `v1/targets/${encodeURIComponent(data.targetID!)}/accounts`,
    query: undefined,
    events: true,
    disabled: !data.targetID,
  });

  return (
    <ListItem
      secondaryAction={
        <IconButton
          aria-label="delete"
          onClick={() => {
            onChange(remove(items, index));
          }}
        >
          <DeleteIcon />
        </IconButton>
      }
    >
      <ListItemText>
        <Stack spacing={2} sx={{ marginRight: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="source-label">Source</InputLabel>

            <Select
              labelId="source-label"
              id="source-select"
              label="Source"
              value={data.sourceID ?? ''}
              onChange={(event) => {
                handleChange('sourceID', event.target.value || undefined);
                handleChange('sourceAccountID', undefined);
              }}
            >
              {!data.sourceID ||
              sources.some(({ id }) => id === data.sourceID) ? null : (
                <MenuItem value={data.sourceID} disabled>
                  <i>Not found: {data.sourceID}</i>
                </MenuItem>
              )}

              {sources.map(({ id, name, available }) => (
                <MenuItem key={id} value={id} disabled={!available}>
                  {name || id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {sourceAccountResource.isLoading &&
          sourceAccountResource.isInitial ? (
            <Skeleton variant="rounded" width="100%" height={56} />
          ) : (
            <>
              {!sourceAccountResource.error ? null : (
                <Alert
                  severity="error"
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={sourceAccountResource.notify}
                    >
                      Retry
                    </Button>
                  }
                >
                  Error: {stringifyError(sourceAccountResource.error)}
                </Alert>
              )}

              <FormControl fullWidth>
                <InputLabel id="source-account-label">Account</InputLabel>

                <Select
                  labelId="source-account-label"
                  id="source-account-select"
                  label="Account"
                  value={data.sourceAccountID ?? ''}
                  onChange={(event) => {
                    handleChange(
                      'sourceAccountID',
                      event.target.value || undefined,
                    );
                  }}
                >
                  {!data.sourceAccountID ||
                  sourceAccountResource.data?.some(
                    ({ id }) => id === data.sourceAccountID,
                  ) ? null : (
                    <MenuItem value={data.sourceAccountID} disabled>
                      <i>Not found: {data.sourceAccountID}</i>
                    </MenuItem>
                  )}

                  {sourceAccountResource.data?.map(({ id, name }) => (
                    <MenuItem key={id} value={id}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}

          <ArrowDownwardIcon sx={{ alignSelf: 'center' }} />

          <FormControl fullWidth>
            <InputLabel id="target-label">Target</InputLabel>

            <Select
              labelId="target-label"
              id="target-select"
              label="Target"
              value={data.targetID ?? ''}
              onChange={(event) => {
                handleChange('targetID', event.target.value || undefined);
                handleChange('targetAccountID', undefined);
              }}
            >
              {!data.targetID ||
              targets.some(({ id }) => id === data.targetID) ? null : (
                <MenuItem value={data.targetID} disabled>
                  <i>Not found: {data.targetID}</i>
                </MenuItem>
              )}

              {targets.map(({ id, name, available }) => (
                <MenuItem key={id} value={id} disabled={!available}>
                  {name || id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {targetAccountResource.isLoading &&
          targetAccountResource.isInitial ? (
            <Skeleton variant="rounded" width="100%" height={56} />
          ) : (
            <>
              {!targetAccountResource.error ? null : (
                <Alert
                  severity="error"
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={targetAccountResource.notify}
                    >
                      Retry
                    </Button>
                  }
                >
                  Error: {stringifyError(targetAccountResource.error)}
                </Alert>
              )}

              <FormControl fullWidth>
                <InputLabel id="source-account-label">Account</InputLabel>

                <Select
                  labelId="source-account-label"
                  id="source-account-select"
                  label="Account"
                  value={data.targetAccountID ?? ''}
                  onChange={(event) => {
                    handleChange(
                      'targetAccountID',
                      event.target.value || undefined,
                    );
                  }}
                >
                  {!data.targetAccountID ||
                  targetAccountResource.data?.some(
                    ({ id }) => id === data.targetAccountID,
                  ) ? null : (
                    <MenuItem value={data.targetAccountID} disabled>
                      <i>Not found: {data.targetAccountID}</i>
                    </MenuItem>
                  )}

                  {targetAccountResource.data?.map(({ id, name }) => (
                    <MenuItem key={id} value={id}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </Stack>
      </ListItemText>
    </ListItem>
  );
}

export default function ScheduleAccountMapping({
  data,
  onChange,
}: {
  data: Partial<input<typeof ScheduleAccountMappingSchema>>[];
  onChange: (
    value:
      | Partial<input<typeof ScheduleAccountMappingSchema>>[]
      | ((
          prev: Partial<input<typeof ScheduleAccountMappingSchema>>[],
        ) => Partial<input<typeof ScheduleAccountMappingSchema>>[]),
  ) => void;
}) {
  const sourceResource = useResource<
    FetchProviderType,
    output<typeof SourceResponse>[] | undefined
  >({
    name: 'v1/sources',
    query: undefined,
    events: true,
  });

  const targetResource = useResource<
    FetchProviderType,
    output<typeof TargetResponse>[] | undefined
  >({
    name: 'v1/targets',
    query: undefined,
    events: true,
  });

  if (
    (sourceResource.isLoading && sourceResource.isInitial) ||
    (targetResource.isLoading && targetResource.isInitial)
  ) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Skeleton variant="text" sx={{ fontSize: 'h5' }} />

          <Skeleton variant="rounded" height={48} />
        </CardContent>
      </Card>
    );
  }

  if (sourceResource.error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={sourceResource.notify}>
            Retry
          </Button>
        }
      >
        Error: {stringifyError(sourceResource.error)}
      </Alert>
    );
  }

  if (targetResource.error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={targetResource.notify}>
            Retry
          </Button>
        }
      >
        Error: {stringifyError(targetResource.error)}
      </Alert>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h5" component="div">
          Account mappings
        </Typography>

        <List>
          {data.map((_, index) => (
            <>
              {index === 0 ? null : <Divider />}

              <Item
                key={index}
                data={data}
                onChange={onChange}
                index={index}
                sources={sourceResource.data ?? []}
                targets={targetResource.data ?? []}
              />
            </>
          ))}
        </List>
      </CardContent>

      <CardActions>
        <Button
          onClick={() => {
            onChange([...data, {}]);
          }}
          startIcon={<AddIcon />}
        >
          Add mapping
        </Button>
      </CardActions>
    </Card>
  );
}
