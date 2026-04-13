import { strictObject, string } from 'zod';

export default strictObject({
  url: string(),
});
