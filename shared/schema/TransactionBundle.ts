import { array, strictObject, string } from 'zod';
import ScheduleImportAccountState from './ScheduleImportAccountState.ts';
import Transaction from './Transaction.ts';

export default strictObject({
  sourceAccountID: string(),
  transactions: array(Transaction),
  state: ScheduleImportAccountState,
});
