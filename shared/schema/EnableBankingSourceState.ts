import { coerce, literal, number, strictObject, string } from 'zod';

export default strictObject({
  type: literal('enablebanking'),
  name: string().optional(),
  appID: string().nonempty(),
  privateKey: string().nonempty(),
  bankCountry: string().optional(),
  bankName: string().optional(),
  psuType: string().optional(),
  tokenValidityDays: number().int().nonnegative().optional(),
  sessionID: string().optional(),
  sessionValidUntil: coerce.date<string | Date>().optional(),
});
