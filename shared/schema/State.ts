import { literal, record, strictObject, string } from 'zod';
import NotificationSettings from './NotificationSettings.ts';
import SourceState from './SourceState.ts';

export default strictObject({
  version: literal(1).default(1),
  sources: record(string(), SourceState.optional()).default({}),
  notifications: NotificationSettings.prefault({}),
});
