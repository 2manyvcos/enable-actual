import { strictObject, enum as _enum, string, coerce } from 'zod';

export default strictObject({
  type: _enum(['enablebanking']),
  name: string().optional(),
  enablebanking: strictObject({
    appID: string(),
    privateKey: string(),
    bankCountry: string(),
    bankName: string(),
    psuType: string(),
    sessionID: string().optional(),
    sessionValidUntil: coerce.date<string>().optional(),
  }).optional(),
});
