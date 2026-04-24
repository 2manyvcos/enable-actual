import { strictObject, string } from 'zod';

export default strictObject({
  sourceID: string(),
  sourceAccountID: string(),
  targetID: string(),
  targetAccountID: string(),
});
