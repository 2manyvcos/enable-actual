import { literal, strictObject, string } from 'zod';

export default strictObject({
  type: literal('enablebanking'),
  name: string().optional(),
  appID: string().nonempty(),
  privateKey: string().nonempty(),
});
