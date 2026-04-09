import { strictObject, enum as _enum } from 'zod';

export default strictObject({
  type: _enum(['enablebanking']).default('enablebanking'),
});
