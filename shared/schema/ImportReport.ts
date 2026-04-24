import { array, coerce, number, strictObject, string } from 'zod';
import RejectedTransaction from './RejectedTransaction.ts';
import ResolvedTransaction from './ResolvedTransaction.ts';

export default strictObject({
  id: string(),
  time: coerce.date<string | Date>(),
  scheduleID: string(),
  scheduleName: string().optional(),
  errors: array(string()).prefault([]),
  rejectedTransactions: array(RejectedTransaction).prefault([]),
  resolvedTransactions: array(ResolvedTransaction).prefault([]),
  importedTransactions: number().int().nonnegative().default(0),
  updatedTransactions: number().int().nonnegative().default(0),
});
