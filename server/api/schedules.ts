import { sendAt, validateCronExpression } from 'cron';
import type { Request, Response } from 'express';
import { removeIn, setIn } from 'immutable';
import { v7 as uuid } from 'uuid';
import type { output } from 'zod';
import IDResponse from '../../shared/schema/IDResponse.ts';
import type QuickAction from '../../shared/schema/QuickAction.ts';
import ScheduleRequest from '../../shared/schema/ScheduleRequest.ts';
import ScheduleResponse from '../../shared/schema/ScheduleResponse.ts';
import ScheduleState from '../../shared/schema/ScheduleState.ts';
import ScheduleUpdate from '../../shared/schema/ScheduleUpdate.ts';
import { runSchedule, updateSchedule } from '../scheduler/scheduler.ts';
import { loadState, putState } from '../state.ts';
import APIError from './APIError.ts';
import { publishEvent } from './events.ts';

function getScheduleResponse(
  id: string,
  {
    name,
    schedule,
    initialDays,
    overscanDays,
    offsetDays,
    accounts,
  }: output<typeof ScheduleState>,
): output<typeof ScheduleResponse> {
  try {
    return ScheduleResponse.decode({
      id,
      name,
      schedule,
      initialDays,
      overscanDays,
      offsetDays,
      accounts,
      nextRun: sendAt(schedule).toISO() ?? undefined,
    });
  } catch (error) {
    throw new APIError(error, 500, 'Schema violation');
  }
}

function applyScheduleRequest({
  name,
  schedule,
  initialDays,
  overscanDays,
  offsetDays,
  accounts,
}: output<typeof ScheduleRequest>): output<typeof ScheduleState> {
  const { valid, error } = validateCronExpression(schedule);
  if (!valid) throw new APIError(error, 400, 'Invalid CRON expression');

  try {
    return ScheduleState.decode({
      name: name || schedule,
      schedule,
      initialDays,
      overscanDays,
      offsetDays,
      accounts,
    });
  } catch (error) {
    throw new APIError(error, 500, 'Schema violation');
  }
}

function applyScheduleUpdate(
  { state }: output<typeof ScheduleState>,
  {
    name,
    schedule,
    initialDays,
    overscanDays,
    offsetDays,
    accounts,
  }: output<typeof ScheduleUpdate>,
): output<typeof ScheduleState> {
  const { valid, error } = validateCronExpression(schedule);
  if (!valid) throw new APIError(error, 400, 'Invalid CRON expression');

  try {
    return ScheduleState.decode({
      name: name || schedule,
      schedule,
      initialDays,
      overscanDays,
      offsetDays,
      accounts,
      state,
    });
  } catch (error) {
    throw new APIError(error, 500, 'Schema violation');
  }
}

export function getScheduleQuickActions(
  _id: string,
  _state: output<typeof ScheduleState>,
): output<typeof QuickAction>[] {
  return [];
}

export async function getSchedules(
  _req: Request,
  res: Response,
): Promise<void> {
  const { schedules } = loadState();

  const response: output<typeof ScheduleResponse>[] = await Promise.all(
    Object.entries(schedules)
      .filter(([, value]) => value)
      .map(async ([scheduleID, schedule]) =>
        getScheduleResponse(scheduleID, schedule!),
      ),
  );

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
    throw new APIError(error, 400, 'Schema violation');
  }

  const scheduleID = uuid();

  const schedule: output<typeof ScheduleState> =
    await applyScheduleRequest(request);

  putState((prev) => setIn(prev, ['schedules', scheduleID], schedule));

  publishEvent();
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
    throw new APIError(`Schedule "${scheduleID}" not found`, 404);
  }

  const schedule = schedules[scheduleID]!;

  const response: output<typeof ScheduleResponse> = await getScheduleResponse(
    scheduleID,
    schedule,
  );

  res.send(response);
}

export async function putSchedulesByID(
  req: Request,
  res: Response,
): Promise<void> {
  const scheduleID = req.params.scheduleID.toString();

  const { schedules } = loadState();

  if (!Object.hasOwn(schedules, scheduleID)) {
    throw new APIError(`Schedule "${scheduleID}" not found`, 404);
  }

  const schedule = schedules[scheduleID]!;

  let update: output<typeof ScheduleUpdate>;
  try {
    update = ScheduleUpdate.parse(req.body);
  } catch (error) {
    throw new APIError(error, 400, 'Schema violation');
  }

  const nextSchedule: output<typeof ScheduleState> = await applyScheduleUpdate(
    schedule,
    update,
  );

  putState((prev) => setIn(prev, ['schedules', scheduleID], nextSchedule));

  publishEvent();
  updateSchedule(scheduleID);

  res.sendStatus(200);
}

export function deleteSchedulesByID(req: Request, res: Response): void {
  const scheduleID = req.params.scheduleID.toString();

  const { schedules } = loadState();

  if (!Object.hasOwn(schedules, scheduleID)) {
    throw new APIError(`Schedule "${scheduleID}" not found`, 404);
  }

  putState((prev) => removeIn(prev, ['schedules', scheduleID]));

  publishEvent();
  updateSchedule(scheduleID);

  res.sendStatus(200);
}

export function postSchedulesByIDExecutions(req: Request, res: Response): void {
  const scheduleID = req.params.scheduleID.toString();

  const { schedules } = loadState();

  if (!Object.hasOwn(schedules, scheduleID)) {
    throw new APIError(`Schedule "${scheduleID}" not found`, 404);
  }

  runSchedule(scheduleID);

  res.sendStatus(202);
}

export function deleteSchedulesByIDState(req: Request, res: Response): void {
  const scheduleID = req.params.scheduleID.toString();

  const { schedules } = loadState();

  if (!Object.hasOwn(schedules, scheduleID)) {
    throw new APIError(`Schedule "${scheduleID}" not found`, 404);
  }

  putState((prev) => removeIn(prev, ['schedules', scheduleID, 'state']));

  // publishEvent(); // this change is not transparent to the client, so an event is not necessary
  updateSchedule(scheduleID);

  res.sendStatus(200);
}
