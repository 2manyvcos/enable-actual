import { strictObject, string } from 'zod';
import Transaction from './Transaction.ts';

export default strictObject({
  sourceID: string(),
  sourceAccountID: string(),
  targetID: string(),
  targetAccountID: string(),
  details: Transaction,
});
