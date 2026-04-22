import { array, literal, strictObject } from 'zod';
import ImportReport from './ImportReport.ts';

export default strictObject({
  version: literal(1).default(1),
  entries: array(ImportReport).prefault([]),
});
