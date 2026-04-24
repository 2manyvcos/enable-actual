import { coerce, number, strictObject, string } from 'zod';

export default strictObject({
  id: string().optional(),
  date: coerce.date<string | Date>(),
  amount: number(),
  currency: string(),
  payee: string().optional(),
  notes: string().optional(),
});
