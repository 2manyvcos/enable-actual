import { strictObject, enum as _enum, string, coerce, number } from 'zod';

export default strictObject({
  type: _enum(['enablebanking']),
  name: string().optional(),
  enablebanking: strictObject({
    appID: string(),
    privateKey: string(),
    bankCountry: string(),
    bankName: string(),
    psuType: string(),
    tokenValidityDays: number().int().nonnegative(),
    sessionID: string().optional(),
    sessionValidUntil: coerce.date<string>().optional(),
  }).optional(),
});
