import express from 'express';
import { loadState, putState } from '../state.ts';

const router = express.Router();

router.get('/notifications', (_req, res) => {
  res.send(loadState().notifications ?? {});
});
router.put('/notifications', (req, res) => {
  if (typeof req.body !== 'object') {
    console.debug(req.body);
    res.sendStatus(400);
    return;
  }

  putState({ notifications: req.body });
  res.sendStatus(200);
});

export default router;
