import { boolean, number, object, strictObject } from 'zod';
import NtfyCredentials from './NtfyCredentials.ts';

export default strictObject({
  ntfy: object({
    enabled: boolean().default(false),
    ...NtfyCredentials.partial().shape,
  }).prefault({}),

  alerts: strictObject({
    sessionExpiryDays: number().int().nonnegative().default(7),
    successfulImports: boolean().default(false),
    unsuccessfulImports: boolean().default(true),
  }).prefault({}),
});
