import { boolean, literal, strictObject, string } from 'zod';

export default strictObject({
  id: string(),
  type: literal('actualbudget'),
  name: string().optional(),
  available: boolean(),
  url: string(),
  hasPassword: boolean(),
  budgetID: string().optional(),
  hasBudgetPassword: boolean(),
});
