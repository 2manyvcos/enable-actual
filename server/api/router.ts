import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import { PUBLIC_URL } from '../config.ts';

const router = express.Router();
router.use(cors({ origin: new URL(PUBLIC_URL).origin }));

router.get('/v1/health', (_req, res) => {
  res.send('OK');
});

router.all('{*splat}', (_req, res) => {
  res.status(404).send('Not found');
});

router.use(((error, _req, res, _next) => {
  console.error(`Error: ${error.message ?? error}`);
  res.status(500).send('Internal server error');
}) satisfies ErrorRequestHandler);

export default router;
