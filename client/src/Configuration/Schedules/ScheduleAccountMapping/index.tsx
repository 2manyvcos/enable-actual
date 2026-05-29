import Md from '@/components/Md';
import type { FetchProviderType } from '@civet/common';
import { useResource } from '@civet/core';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ReplayIcon from '@mui/icons-material/Replay';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Collapse from '@mui/material/Collapse';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type ScheduleAccountMappingSchema from '@shared/schema/ScheduleAccountMapping';
import type SourceAccount from '@shared/schema/SourceAccount';
import type SourceResponse from '@shared/schema/SourceResponse';
import type TargetAccount from '@shared/schema/TargetAccount';
import type TargetResponse from '@shared/schema/TargetResponse';
import { stringifyError } from '@shared/utils';
import { remove, setIn } from 'immutable';
import { useState } from 'react';
import type { input, output } from 'zod';

const advancedInstructions = `
### Templating

Enable Actual uses [LiquidJS](https://liquidjs.com) to enable customization for specific transaction fields.

The raw datasets from the source are provided as context when parsing the templates.
Tip: The raw datasets of your already imported transactions can be viewed in the import history.

[Tutorial](https://liquidjs.com/tutorials/intro-to-liquid.html) | [Playground](https://liquidjs.com/playground.html)

In addition to the predefined [tags](https://liquidjs.com/tags/overview.html) and [filters](https://liquidjs.com/filters/overview.html), the following is also supported:

#### default

Returns the default value that would be used without your custom template.
This can be useful if you only want to append additional information.

\`\`\`
{{ default }} #auto-imported
-> "<DEFAULT VALUE> #auto-imported"
\`\`\`

#### mask

Masks texts with at least 4 characters for privacy purposes, e.g. IBANs or similar.

\`\`\`
{{ "my-iban" | mask }}
-> "*** iban"
\`\`\`
`;

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
  const [expanded, setExpanded] = useState(false);

  const data = items[index];

  const handleChange: <F extends keyof typeof data>(
    field: F,
    value: (typeof data)[F],
  ) => void = (field: string, value: unknown): void => {
    onChange((prev) => setIn(prev ?? [{}], [index, field], value));
  };

  const handleChangeTemplate: <
    F extends keyof Required<typeof data>['templates'],
  >(
    field: F,
    value: Required<typeof data>['templates'][F],
  ) => void = (field: string, value: unknown): void => {
    onChange((prev) => setIn(prev ?? [{}], [index, 'templates', field], value));
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
    <>
      <TableRow
        sx={{
          '&& > *': { borderBottom: 0 },
        }}
      >
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>

        <TableCell>
          <FormControl variant="standard" fullWidth>
            <Select
              id="source-select"
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
        </TableCell>

        <TableCell>
          {sourceAccountResource.isLoading &&
          sourceAccountResource.isInitial ? (
            <Skeleton variant="rounded" width="100%" height={32} />
          ) : sourceAccountResource.error ? (
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
          ) : (
            <FormControl variant="standard" fullWidth>
              <Select
                id="source-account-select"
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
          )}
        </TableCell>

        <TableCell>
          <FormControl variant="standard" fullWidth>
            <Select
              id="target-select"
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
        </TableCell>

        <TableCell>
          {targetAccountResource.isLoading &&
          targetAccountResource.isInitial ? (
            <Skeleton variant="rounded" width="100%" height={32} />
          ) : targetAccountResource.error ? (
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
          ) : (
            <FormControl variant="standard" fullWidth>
              <Select
                id="source-account-select"
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
          )}
        </TableCell>

        <TableCell align="right">
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <IconButton
              aria-label="reload"
              size="small"
              onClick={() => {
                sourceAccountResource.notify();
                targetAccountResource.notify();
              }}
            >
              <ReplayIcon />
            </IconButton>

            <IconButton
              aria-label="delete"
              size="small"
              onClick={() => {
                onChange(remove(items, index));
              }}
            >
              <DeleteIcon />
            </IconButton>
          </div>
        </TableCell>
      </TableRow>

      <TableRow
        sx={{
          '&:last-child td, &:last-child th': { border: 0 },
        }}
      >
        <TableCell sx={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography
                color="error"
                gutterBottom
                variant="h6"
                component="div"
              >
                Advanced settings
              </Typography>

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
                  <Md>{advancedInstructions}</Md>
                </Alert>

                <TextField
                  id="idTemplate"
                  label="Custom ID Template"
                  name="idTemplate"
                  multiline
                  value={data.templates?.id ?? ''}
                  onChange={(event) => {
                    handleChangeTemplate('id', event.target.value || undefined);
                  }}
                  sx={{ fontFamily: 'monospace' }}
                />

                <TextField
                  id="payeeTemplate"
                  label="Custom Payee Template"
                  name="payeeTemplate"
                  multiline
                  value={data.templates?.payee ?? ''}
                  onChange={(event) => {
                    handleChangeTemplate(
                      'payee',
                      event.target.value || undefined,
                    );
                  }}
                  sx={{ fontFamily: 'monospace' }}
                />

                <TextField
                  id="notesTemplate"
                  label="Custom Notes Template"
                  name="notesTemplate"
                  multiline
                  value={data.templates?.notes ?? ''}
                  onChange={(event) => {
                    handleChangeTemplate(
                      'notes',
                      event.target.value || undefined,
                    );
                  }}
                  sx={{ fontFamily: 'monospace' }}
                />
              </Stack>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
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

        <TableContainer component={Paper}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell />

                <TableCell>Source</TableCell>

                <TableCell>Source Account</TableCell>

                <TableCell>Target</TableCell>

                <TableCell>Target Account</TableCell>

                <TableCell />
              </TableRow>
            </TableHead>

            <TableBody>
              {data.map((_, index) => (
                <Item
                  key={index}
                  data={data}
                  onChange={onChange}
                  index={index}
                  sources={sourceResource.data ?? []}
                  targets={targetResource.data ?? []}
                />
              ))}

              {data.length ? null : (
                <TableRow
                  sx={{
                    '&& > *': { borderBottom: 0 },
                    '&:last-child td, &:last-child th': { border: 0 },
                  }}
                >
                  <TableCell colSpan={6}>
                    <i>No entries</i>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
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
