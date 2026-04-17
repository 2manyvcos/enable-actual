import { literal, record, strictObject, string } from 'zod';
import NotificationSettings from './NotificationSettings.ts';
import ScheduleState from './ScheduleState.ts';
import SourceState from './SourceState.ts';
import TargetState from './TargetState.ts';

export default strictObject({
  version: literal(1).default(1),
  sources: record(string(), SourceState.optional()).default({}),
  targets: record(string(), TargetState.optional()).default({}),
  schedules: record(string(), ScheduleState.optional()).default({}),
  notifications: NotificationSettings.prefault({}),
});
