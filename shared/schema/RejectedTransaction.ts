import { strictObject, string } from 'zod';
import Transaction from './Transaction.ts';

export default strictObject({
  sourceID: string(),
  sourceAccountID: string(),
  reason: string(),
  details: Transaction.partial(),
});
