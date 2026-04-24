import { literal, strictObject, string } from 'zod';

export default strictObject({
  type: literal('actualbudget'),
  name: string().optional(),
  url: string().nonempty(),
  password: string().nullable().optional(),
  budgetID: string().nonempty(),
  budgetPassword: string().nullable().optional(),
});
