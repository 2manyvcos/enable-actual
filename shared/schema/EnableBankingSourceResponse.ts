import { boolean, coerce, literal, number, strictObject, string } from 'zod';

export default strictObject({
  id: string(),
  type: literal('enablebanking'),
  name: string().optional(),
  available: boolean(),
  appID: string(),
  bankCountry: string().optional(),
  bankName: string().optional(),
  psuType: string().optional(),
  tokenValidityDays: number().int().nonnegative().optional(),
  sessionID: string().optional(),
  sessionValidUntil: coerce.date<string | Date>().optional(),
});
