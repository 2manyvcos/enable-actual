import { literal, number, strictObject, string, union } from 'zod';

export default strictObject({
  description: string(),
  action: union([
    literal('create'),
    literal('setup'),
    literal('authorization'),
  ]),
  dueDays: number().int().optional(),
  actionLabel: string(),
  resource: union([
    literal('sources'),
    literal('targets'),
    literal('schedules'),
  ]),
  id: string().optional(),
});
