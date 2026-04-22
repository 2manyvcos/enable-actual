import { record, strictObject, string } from 'zod';
import ScheduleImportAccountState from './ScheduleImportAccountState.ts';

export default strictObject({
  accounts: record(string(), ScheduleImportAccountState.optional()).default({}),
});
