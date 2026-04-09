import { boolean, number, object, strictObject, string } from 'zod';

export default strictObject({
  ntfy: object({
    enabled: boolean().default(false),
    url: string().optional(),
    username: string().optional(),
    password: string().optional(),
  }).prefault({}),

  alerts: strictObject({
    sessionExpiryDays: number().int().nonnegative().default(7),
    successfulImports: boolean().default(false),
    unsuccessfulImports: boolean().default(true),
  }).prefault({}),
});
