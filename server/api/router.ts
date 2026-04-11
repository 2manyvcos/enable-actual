import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import { PUBLIC_URL } from '../config.ts';
import {
  getSourcesByIDEnableBankingASPSPs,
  postEnableBankingSession,
  postSourcesByIDEnableBankingAuth,
} from '../integrations/enablebanking/api/routes.ts';
import {
  getNotificationSettings,
  putNotificationSettings,
} from './notification-settings.ts';
import {
  deleteSourcesByID,
  getSources,
  getSourcesByID,
  postSources,
  putSourcesByID,
} from './sources.ts';

const router = express.Router();
router.use(cors({ origin: new URL(PUBLIC_URL).origin }));
router.use(express.json());

router.get('/v1/health', (_req, res) => {
  res.send('OK');
});

router.get('/v1/sources', getSources);
router.post('/v1/sources', postSources);
router.get('/v1/sources/:sourceID', getSourcesByID);
router.put('/v1/sources/:sourceID', putSourcesByID);
router.delete('/v1/sources/:sourceID', deleteSourcesByID);
router.get(
  '/v1/sources/:sourceID/enablebanking/aspsps',
  getSourcesByIDEnableBankingASPSPs,
);
router.post(
  '/v1/sources/:sourceID/enablebanking/auth',
  postSourcesByIDEnableBankingAuth,
);

router.get('/v1/notification-settings', getNotificationSettings);
router.put('/v1/notification-settings', putNotificationSettings);

router.post('/v1/enablebanking/session', postEnableBankingSession);

router.all('{*splat}', (_req, res) => {
  res.sendStatus(404);
});

router.use(((error, _req, res, _next) => {
  console.debug('Server error:', error);
  res.sendStatus(500);
}) satisfies ErrorRequestHandler);

export default router;
