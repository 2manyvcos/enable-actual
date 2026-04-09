import express from 'express';
import { getNotifications, putNotifications } from './notifications.ts';
import { getSources } from './sources.ts';

const router = express.Router();

router.get('/sources', getSources);

router.get('/notifications', getNotifications);
router.put('/notifications', putNotifications);

export default router;
