import { array, number, strictObject, string } from 'zod';
import ScheduleAccountMapping from './ScheduleAccountMapping.ts';

export default strictObject({
  id: string(),
  name: string().optional(),
  schedule: string().nonempty(),
  initialDays: number().int().nonnegative(),
  overscanDays: number().int().nonnegative(),
  offsetDays: number().int().nonnegative(),
  accounts: array(ScheduleAccountMapping).min(1),
  nextRun: string().optional(),
});
