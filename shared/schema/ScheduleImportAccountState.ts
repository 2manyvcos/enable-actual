import { strictObject, string } from 'zod';

export default strictObject({
  initial: string(),
  checkpoint: string(),
});
