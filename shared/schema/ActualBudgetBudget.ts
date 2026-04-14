import { string, strictObject, boolean } from 'zod';

export default strictObject({
  id: string(),
  name: string(),
  encrypted: boolean(),
});
