import { array, coerce, literal, number, strictObject, string } from 'zod';
import SourceAccount from './SourceAccount.ts';

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
  availableAccounts: array(SourceAccount).optional(),
});
