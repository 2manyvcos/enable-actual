import type { Request, Response } from 'express';
import type { output } from 'zod';
import type EnableBankingASPSP from '../../shared/schema/EnableBankingASPSP.ts';
import { ENABLEBANKING_API } from '../config.ts';
import EBClient, { EBError } from '../integrations/enablebanking/EBClient.ts';

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

  try {
    const { aspsps } = await client.getASPSPs({ country });

    res.send(
      aspsps.map(
        ({ country, name, psu_types }) =>
          ({ country, name, psuTypes: psu_types }) satisfies output<
            typeof EnableBankingASPSP
          >,
      ),
    );
  } catch (error) {
    if (
      error instanceof EBError &&
      (error.status === 'invalid-jwt' ||
        (error.code >= 400 && error.code < 500))
    ) {
      res.sendStatus(400);
    }

    throw error;
  }
}
