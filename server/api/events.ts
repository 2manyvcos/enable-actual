import EventEmitter from 'events';
import type { Request, Response } from 'express';

const eventEmitter = new EventEmitter<{ event: [] }>();

// event debouncing
let eventPending = false;

export function publishEvent() {
  if (eventPending) return;
  eventPending = true;
  setTimeout(() => {
    eventEmitter.emit('event');
    eventPending = false;
  }, 250);
}

export function getEvents(_req: Request, res: Response): void {
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const handler = () => {
    res.write(`data: ${JSON.stringify('/')}\n\n`);
  };

  eventEmitter.addListener('event', handler);

  res.on('close', () => {
    eventEmitter.removeListener('event', handler);
    res.end();
  });
}
