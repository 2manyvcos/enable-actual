import { strictObject, string } from 'zod';

export default strictObject({
  state: string(),
  code: string(),
});
