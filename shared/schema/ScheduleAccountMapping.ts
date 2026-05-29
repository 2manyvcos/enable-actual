import { strictObject, string } from 'zod';

export default strictObject({
  sourceID: string(),
  sourceAccountID: string(),
  targetID: string(),
  targetAccountID: string(),
  templates: strictObject({
    id: string().optional(),
    payee: string().optional(),
    notes: string().optional(),
  }).optional(),
});
