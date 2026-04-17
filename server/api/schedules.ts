import { sendAt, validateCronExpression } from 'cron';
import type { Request, Response } from 'express';
import { removeIn, setIn } from 'immutable';
import { v7 as uuid } from 'uuid';
import type { output } from 'zod';
import IDResponse from '../../shared/schema/IDResponse.ts';
import ScheduleRequest from '../../shared/schema/ScheduleRequest.ts';
import ScheduleResponse from '../../shared/schema/ScheduleResponse.ts';
import ScheduleState from '../../shared/schema/ScheduleState.ts';
import ScheduleUpdate from '../../shared/schema/ScheduleUpdate.ts';
import { updateSchedule } from '../scheduler/scheduler.ts';
import { loadState, putState } from '../state.ts';

function getScheduleResponse(
  id: string,
  schedule: output<typeof ScheduleState>,
): output<typeof ScheduleResponse> {
  return ScheduleResponse.decode({
    id,
    ...schedule!,
    nextRun: sendAt(schedule.schedule).toISO() ?? undefined,
  });
}

function applyScheduleRequest(
  request: output<typeof ScheduleRequest>,
): output<typeof ScheduleState> {
  const { valid, error } = validateCronExpression(request.schedule);
  if (!valid) {
    throw new Error(`Invalid CRON expression: ${error}`);
  }

  return ScheduleState.decode({
    ...request!,
    name: request.name || request.schedule,
  });
}

function applyScheduleUpdate(
  _state: output<typeof ScheduleState>,
  update: output<typeof ScheduleUpdate>,
): output<typeof ScheduleState> {
  const { valid, error } = validateCronExpression(update.schedule);
  if (!valid) {
    throw new Error(`Invalid CRON expression: ${error}`);
  }

  return ScheduleState.decode({
    ...update!,
    name: update.name || update.schedule,
  });
}

export async function getSchedules(
  _req: Request,
  res: Response,
): Promise<void> {
  const { schedules } = loadState();

  let response: output<typeof ScheduleResponse>[];
  try {
    response = await Promise.all(
      Object.entries(schedules)
        .filter(([, value]) => value)
        .map(async ([scheduleID, schedule]) =>
          getScheduleResponse(scheduleID, schedule!),
        ),
    );
  } catch (error) {
    console.debug('Implementation rejection:', error);
    res.sendStatus(500);
    return;
  }

  res.send(response);
}

export async function postSchedules(
  req: Request,
  res: Response,
): Promise<void> {
  let request: output<typeof ScheduleRequest>;
  try {
    request = ScheduleRequest.parse(req.body);
  } catch (error) {
    console.debug('Schema violation:', error);
    res.sendStatus(400);
    return;
  }

  const scheduleID = uuid();

  let schedule: output<typeof ScheduleState>;
  try {
    schedule = await applyScheduleRequest(request);
  } catch (error) {
    console.debug('Implementation rejection:', error);
    res.sendStatus(400);
    return;
  }

  putState((prev) => setIn(prev, ['schedules', scheduleID], schedule));

  updateSchedule(scheduleID);

  res.send({ id: scheduleID } satisfies output<typeof IDResponse>);
}

export async function getSchedulesByID(
  req: Request,
  res: Response,
): Promise<void> {
  const scheduleID = req.params.scheduleID.toString();

  const { schedules } = loadState();

  if (!Object.hasOwn(schedules, scheduleID)) {
    res.sendStatus(404);
    return;
  }

  const schedule = schedules[scheduleID]!;

  let response: output<typeof ScheduleResponse>;
  try {
    response = await getScheduleResponse(scheduleID, schedule);
  } catch (error) {
    console.debug('Implementation rejection:', error);
    res.sendStatus(400);
    return;
  }

  res.send(response);
}

export async function putSchedulesByID(
  req: Request,
  res: Response,
): Promise<void> {
  const scheduleID = req.params.scheduleID.toString();

  const { schedules } = loadState();

  if (!Object.hasOwn(schedules, scheduleID)) {
    res.sendStatus(404);
    return;
  }

  const schedule = schedules[scheduleID]!;

  let update: output<typeof ScheduleUpdate>;
  try {
    update = ScheduleUpdate.parse(req.body);
  } catch (error) {
    console.debug('Schema violation:', error);
    res.sendStatus(400);
    return;
  }

  let nextSchedule: output<typeof ScheduleState>;
  try {
    nextSchedule = await applyScheduleUpdate(schedule, update);
  } catch (error) {
    console.debug('Implementation rejection:', error);
    res.sendStatus(400);
    return;
  }

  putState((prev) => setIn(prev, ['schedules', scheduleID], nextSchedule));

  updateSchedule(scheduleID);

  res.sendStatus(200);
}

export function deleteSchedulesByID(req: Request, res: Response): void {
  const scheduleID = req.params.scheduleID.toString();

  const { schedules } = loadState();

  if (!Object.hasOwn(schedules, scheduleID)) {
    res.sendStatus(404);
    return;
  }

  putState((prev) => removeIn(prev, ['schedules', scheduleID]));

  updateSchedule(scheduleID);

  res.sendStatus(200);
}
