import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import { PUBLIC_URL } from '../config.ts';
import configRouter from './config.ts';

const router = express.Router();
router.use(cors({ origin: new URL(PUBLIC_URL).origin }));
router.use(express.json());

router.get('/v1/health', (_req, res) => {
  res.send('OK');
});

router.use('/v1/config', configRouter);

router.all('{*splat}', (_req, res) => {
  res.sendStatus(404);
});

router.use(((error, _req, res, _next) => {
  console.error(`Error: ${error.message ?? error}`);
  res.sendStatus(500);
}) satisfies ErrorRequestHandler);

export default router;
