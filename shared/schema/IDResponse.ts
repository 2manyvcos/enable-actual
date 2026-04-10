import { string, strictObject } from 'zod';

export default strictObject({
  id: string(),
});
