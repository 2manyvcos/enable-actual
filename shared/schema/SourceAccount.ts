import { strictObject, string } from 'zod';

export default strictObject({
  id: string(),
  name: string(),
});
