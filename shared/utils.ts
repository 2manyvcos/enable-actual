import { core, prettifyError, ZodError } from 'zod';

export function toDateString(date: Date | string): string {
  return new Date(date).toISOString().split('T', 1)[0];
}

export function startOfDate(date: Date | string): Date {
  return new Date(toDateString(date));
}

export function addToDate(date: Date | string, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addToDateString(date: Date | string, days: number): string {
  const d = startOfDate(date);
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

export function stringifyError(
  error: unknown,
  fallbackMessage: string = 'Unexpected error',
) {
  if (error instanceof ZodError || error instanceof core.$ZodError)
    return prettifyError(error);
  return ((error as Error)?.message ?? error?.toString()) || fallbackMessage;
}
