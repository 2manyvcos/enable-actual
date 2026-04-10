import { strictObject, string } from 'zod';
import Source from './Source.ts';

export default strictObject({
  ...Source.shape,
  id: string(),
});
