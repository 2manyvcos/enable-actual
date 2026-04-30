import { array, boolean, number, record, strictObject, string } from 'zod';
import ScheduleAccountMapping from './ScheduleAccountMapping.ts';
import ScheduleImportState from './ScheduleImportState.ts';

export default strictObject({
  name: string().optional(),
  schedule: string().nonempty(),
  initialDays: number().int().nonnegative().default(0),
  overscanDays: number().int().nonnegative().default(0),
  offsetDays: number().int().nonnegative().default(0),
  appendPayeeID: boolean().default(false),
  accounts: array(ScheduleAccountMapping).min(1),
  state: record(string(), ScheduleImportState.optional()).default({}),
});
