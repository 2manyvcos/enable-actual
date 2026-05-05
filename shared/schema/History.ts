import { array, literal, strictObject } from 'zod';
import ImportReport from './ImportReport.ts';

export default strictObject({
  version: literal(2).default(2),
  entries: array(ImportReport).prefault([]),
});
