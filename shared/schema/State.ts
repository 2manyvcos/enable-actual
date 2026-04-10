import { record, strictObject, string } from 'zod';
import NotificationSettings from './NotificationSettings.ts';
import Source from './Source.ts';

export default strictObject({
  sources: record(string(), Source.optional()).default({}),
  notifications: NotificationSettings.prefault({}),
});
