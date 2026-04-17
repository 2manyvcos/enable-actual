import type { FetchProviderType } from '@civet/common';
import { useConfigContext, useResource } from '@civet/core';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useState, type ReactNode } from 'react';
import type { input, output } from 'zod';
import { putTargetsByID } from '@/api/targets';
import type ActualBudgetBudget from '@shared/schema/ActualBudgetBudget';
import type ActualBudgetTargetResponse from '@shared/schema/ActualBudgetTargetResponse';
import type ActualBudgetTargetUpdate from '@shared/schema/ActualBudgetTargetUpdate';

export default function EditTarget({
  data: target,
  onSuccess,
  onClose,
  deleteAction,
}: {
  data: output<typeof ActualBudgetTargetResponse>;
  onSuccess: () => void;
  onClose: () => void;
  deleteAction: ReactNode;
}) {
  const { dataProvider } = useConfigContext<FetchProviderType>();

  const [data, setData] =
    useState<Partial<input<typeof ActualBudgetTargetUpdate>>>(target);

  const handleChange: <F extends keyof typeof data>(
    field: F,
    value: (typeof data)[F],
  ) => void = (field: string, value: unknown): void => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [budgetPasswordVisible, setBudgetPasswordVisible] = useState(false);

  const budgetResource = useResource<
    FetchProviderType,
    output<typeof ActualBudgetBudget>[] | undefined
  >({
    name: `v1/targets/${encodeURIComponent(target.id)}/actualbudget/budgets`,
    query: undefined,
  });

  return (
    <>
      <DialogContent>
        <form
          id="edit-target"
          onSubmit={async (event) => {
            event.preventDefault();

            await putTargetsByID({
              dataProvider: dataProvider!,
              targetID: target.id,
              data: {
                type: 'actualbudget',
                name: data.name,
                url: data.url!,
                password: data.password,
                budgetID: data.budgetID!,
                budgetPassword: data.budgetPassword,
              },
            });

            onSuccess();
            onClose();
          }}
        >
          <Stack
            component="fieldset"
            spacing={2}
            sx={{ margin: 0, padding: 0, border: 'none', minWidth: '500px' }}
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
              value={
                data.password === undefined && target.hasPassword
                  ? 'Unchanged'
                  : (data.password ?? '')
              }
              onChange={(event) => {
                handleChange('password', event.target.value || null);
              }}
              slotProps={{
                input: {
                  onFocus: (event) => {
                    if (data.password === undefined && target.hasPassword) {
                      event.target.select();
                    }
                  },
                  onMouseUp: (event) => {
                    if (data.password === undefined && target.hasPassword) {
                      event.preventDefault();
                      (event.target as HTMLInputElement).select?.();
                    }
                  },
                  onKeyDown: (event) => {
                    if (data.password === undefined && target.hasPassword) {
                      if (event.key.startsWith('Arrow')) {
                        event.preventDefault();
                        (event.target as HTMLInputElement).select?.();
                        return;
                      }
                    }
                  },
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

            {budgetResource.isLoading && budgetResource.isInitial ? (
              <>
                <Skeleton variant="rounded" height={56} />

                {!target.hasBudgetPassword ? null : (
                  <Skeleton variant="rounded" height={56} />
                )}
              </>
            ) : (
              <>
                {!budgetResource.error ? null : (
                  <Alert
                    severity="error"
                    action={
                      <Button
                        color="inherit"
                        size="small"
                        onClick={budgetResource.notify}
                      >
                        Retry
                      </Button>
                    }
                  >
                    Error:{' '}
                    {`${budgetResource.error.message ?? budgetResource.error}`}
                  </Alert>
                )}

                <FormControl fullWidth required>
                  <InputLabel id="budget-id-label">Budget</InputLabel>

                  <Select
                    labelId="budget-id-label"
                    id="budget-id-select"
                    label="Budget *"
                    value={data.budgetID ?? ''}
                    onChange={(event) => {
                      handleChange('budgetID', event.target.value || undefined);
                      handleChange('budgetPassword', null);
                    }}
                  >
                    {budgetResource.data?.map(({ id, name }) => (
                      <MenuItem key={id} value={id}>
                        {name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {!budgetResource.data?.find(({ id }) => id === data.budgetID)
                  ?.encrypted ? null : (
                  <TextField
                    id="budget-password"
                    label="Budget Password"
                    helperText="Your budget is end-to-end encrypted and therefore requires a password"
                    name="budget-password"
                    type={budgetPasswordVisible ? 'text' : 'password'}
                    // autoComplete="current-password"
                    value={
                      data.budgetPassword === undefined &&
                      target.hasBudgetPassword
                        ? 'Unchanged'
                        : (data.budgetPassword ?? '')
                    }
                    onChange={(event) => {
                      handleChange(
                        'budgetPassword',
                        event.target.value || null,
                      );
                    }}
                    slotProps={{
                      input: {
                        onFocus: (event) => {
                          if (
                            data.budgetPassword === undefined &&
                            target.hasBudgetPassword
                          ) {
                            event.target.select();
                          }
                        },
                        onMouseUp: (event) => {
                          if (
                            data.budgetPassword === undefined &&
                            target.hasBudgetPassword
                          ) {
                            event.preventDefault();
                            (event.target as HTMLInputElement).select?.();
                          }
                        },
                        onKeyDown: (event) => {
                          if (
                            data.budgetPassword === undefined &&
                            target.hasBudgetPassword
                          ) {
                            if (event.key.startsWith('Arrow')) {
                              event.preventDefault();
                              (event.target as HTMLInputElement).select?.();
                              return;
                            }
                          }
                        },
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={
                                budgetPasswordVisible
                                  ? 'hide the password'
                                  : 'display the password'
                              }
                              onClick={() => {
                                setBudgetPasswordVisible((prev) => !prev);
                              }}
                              onMouseDown={(event) => {
                                event.preventDefault();
                              }}
                              onMouseUp={(event) => {
                                event.preventDefault();
                              }}
                              edge="end"
                            >
                              {budgetPasswordVisible ? (
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
                )}
              </>
            )}
          </Stack>
        </form>
      </DialogContent>

      <DialogActions>
        {deleteAction}

        <Button onClick={onClose}>Cancel</Button>

        <Button type="submit" form="edit-target" startIcon={<SaveIcon />}>
          Save
        </Button>
      </DialogActions>
    </>
  );
}
