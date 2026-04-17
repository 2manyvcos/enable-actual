import type { output } from 'zod';
import type ScheduleState from '../../shared/schema/ScheduleState';

export default function createImportJob(
  scheduleID: string,
  schedule: output<typeof ScheduleState>,
): () => Promise<void> {
  return async () => {
    console.debug(`Running import job for ${scheduleID}`);

    console.log('TODO:', schedule);
  };
}
