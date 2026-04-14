import { boolean, literal, strictObject, string } from 'zod';

export default strictObject({
  id: string(),
  type: literal('actualbudget'),
  name: string().optional(),
  url: string(),
  hasPassword: boolean(),
  budgetID: string().optional(),
  hasBudgetPassword: boolean(),
  setupRequired: boolean(),
});
