import { string, strictObject, array } from 'zod';

export default strictObject({
  country: string(),
  name: string(),
  psuTypes: array(string()),
});
