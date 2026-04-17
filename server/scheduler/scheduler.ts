import { CronJob } from 'cron';
import { loadState } from '../state.ts';
import createImportJob from './createImportJob.ts';
import createSessionExpiryJob from './createSessionExpiryJob.ts';

const scheduleJobs: { [scheduleID: string]: CronJob | undefined } = {};

export function startScheduler() {
  const { schedules } = loadState();

  console.debug('Starting session expiry job');
  CronJob.from({
    cronTime: '0 12 * * *',
    onTick: createSessionExpiryJob(),
    start: true,
  });

  Object.entries(schedules).forEach(([scheduleID, schedule]) => {
    if (!schedule) return;

    console.debug(`Starting import job for ${scheduleID}`);
    scheduleJobs[scheduleID] = CronJob.from({
      cronTime: schedule.schedule,
      onTick: createImportJob(scheduleID, schedule),
      start: true,
    });
  });
}

export function updateSchedule(scheduleID: string) {
  const { schedules } = loadState();

  if (Object.hasOwn(scheduleJobs, scheduleID)) {
    scheduleJobs[scheduleID]!.stop();
    delete scheduleJobs[scheduleID];
  }

  const schedule = schedules[scheduleID];

  if (!schedule) {
    console.debug(`Stopping import job for ${scheduleID}`);
    return;
  }

  console.log(`Restarting import job for ${scheduleID}`);
  scheduleJobs[scheduleID] = CronJob.from({
    cronTime: schedule.schedule,
    onTick: createImportJob(scheduleID, schedule),
    start: true,
  });
}
