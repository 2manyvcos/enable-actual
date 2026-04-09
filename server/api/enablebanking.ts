import type { Request, Response } from 'express';
import { ENABLEBANKING_API } from '../config.ts';
import EBClient from '../integrations/enablebanking/EBClient.ts';

export async function getEnableBankingASPSPs(req: Request, res: Response) {
  const appID = req.query.appID?.toString();
  const privateKey = req.query.privateKey?.toString();
  const country = req.query.country?.toString();

  if (!appID || !privateKey) {
    res.sendStatus(400);
    return;
  }

  const client = new EBClient({
    api: ENABLEBANKING_API,
    appID,
    privateKey,
  });

  const { aspsps } = await client.getASPSPs({ country });

  res.send(aspsps);
}
