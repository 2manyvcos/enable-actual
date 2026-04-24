import { literal, strictObject, string } from 'zod';

export default strictObject({
  type: literal('actualbudget'),
  name: string().optional(),
  url: string().nonempty(),
  password: string().nonempty(),
});
