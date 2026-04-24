import { literal, strictObject, string, union } from 'zod';

export default strictObject({
  description: string(),
  action: string(),
  resource: union([
    literal('sources'),
    literal('targets'),
    literal('schedules'),
  ]),
  id: string().optional(),
});
