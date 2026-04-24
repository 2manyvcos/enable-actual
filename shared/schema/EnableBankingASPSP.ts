import { string, strictObject, array, number } from 'zod';

export default strictObject({
  country: string(),
  name: string(),
  psuTypes: array(string()),
  maxTokenValidityDays: number().int().nonnegative(),
});
