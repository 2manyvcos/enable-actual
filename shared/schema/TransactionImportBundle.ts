import { array, strictObject, string } from 'zod';
import ResolvedTransaction from './ResolvedTransaction.ts';

export default strictObject({
  targetAccountID: string(),
  transactions: array(ResolvedTransaction),
});
