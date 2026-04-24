import { literal, number, strictObject, string } from 'zod';

export default strictObject({
  type: literal('enablebanking'),
  name: string().optional(),
  bankCountry: string().nonempty(),
  bankName: string().nonempty(),
  psuType: string().nonempty(),
  tokenValidityDays: number().int().nonnegative(),
});
