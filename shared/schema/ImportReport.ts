import { array, coerce, number, record, strictObject, string } from 'zod';
import RejectedTransaction from './RejectedTransaction.ts';
import ResolvedTransaction from './ResolvedTransaction.ts';

export default strictObject({
  id: string(),
  time: coerce.date<string | Date>(),
  scheduleID: string(),
  scheduleName: string().optional(),
  sources: record(
    string(),
    strictObject({
      name: string().optional(),
      accounts: record(
        string(),
        strictObject({ name: string().optional() }).optional(),
      ),
    }).optional(),
  ),
  targets: record(
    string(),
    strictObject({
      name: string().optional(),
      accounts: record(
        string(),
        strictObject({ name: string().optional() }).optional(),
      ),
    }).optional(),
  ),
  errors: array(
    strictObject({
      message: string(),
      sourceID: string().optional(),
      sourceAccountID: string().optional(),
      targetID: string().optional(),
      targetAccountID: string().optional(),
    }),
  ).prefault([]),
  rejectedTransactions: array(RejectedTransaction).prefault([]),
  resolvedTransactions: array(ResolvedTransaction).prefault([]),
  importedTransactions: number().int().nonnegative().default(0),
  updatedTransactions: number().int().nonnegative().default(0),
});
