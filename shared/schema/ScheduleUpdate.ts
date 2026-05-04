import { array, boolean, number, strictObject, string } from 'zod';
import ScheduleAccountMapping from './ScheduleAccountMapping.ts';

export default strictObject({
  name: string().optional(),
  schedule: string().nonempty(),
  initialDays: number().int().nonnegative().default(0),
  overscanDays: number().int().nonnegative().default(0),
  offsetDays: number().int().nonnegative().default(0),
  appendPayeeID: boolean().default(false),
  accounts: array(ScheduleAccountMapping).min(1),
});
