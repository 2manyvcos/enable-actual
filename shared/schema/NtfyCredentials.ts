import { string, strictObject } from 'zod';

export default strictObject({
  url: string().nonempty(),
  username: string().optional(),
  password: string().optional(),
});
