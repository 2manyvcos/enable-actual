import type { Request, Response } from 'express';
import { updateIn } from 'immutable';
import jwt from 'jsonwebtoken';
import { v7 as uuid } from 'uuid';
import { type output } from 'zod';
import type EnableBankingASPSP from '../../../shared/schema/EnableBankingASPSP.ts';
import type EnableBankingAuthorizationRequest from '../../../shared/schema/EnableBankingAuthorizationRequest.ts';
import EnableBankingSessionRequest from '../../../shared/schema/EnableBankingSessionRequest.ts';
import type IDResponse from '../../../shared/schema/IDResponse.ts';
import type Source from '../../../shared/schema/Source.ts';
import { ENABLEBANKING_API, PUBLIC_URL } from '../../config.ts';
import { loadState, putState } from '../../state.ts';
import EBClient, { EBError } from './EBClient.ts';

const stateSecret = uuid();

export async function getEnableBankingASPSPs(
  req: Request,
  res: Response,
): Promise<void> {
  const appID = req.query.appID?.toString();
  const privateKey = req.query.privateKey?.toString();
  const country = req.query.country?.toString();

  if (!appID || !privateKey) {
    res.sendStatus(400);
    return;
  }

  try {
    const client = new EBClient({
      api: ENABLEBANKING_API,
      appID,
      privateKey,
    });

    const { aspsps } = await client.getASPSPs({ country });

    res.send(
      aspsps.map(
        ({ country, name, psu_types, maximum_consent_validity }) =>
          ({
            country,
            name,
            psuTypes: psu_types,
            maxTokenValidityDays: Math.floor(
              maximum_consent_validity / (24 * 60 * 60),
            ),
          }) satisfies output<typeof EnableBankingASPSP>,
      ) satisfies output<typeof EnableBankingASPSP>[],
    );
  } catch (error) {
    if (error instanceof EBError && error.responsible === 'client') {
      res.sendStatus(400);
    }
    throw error;
  }
}

export async function postEnableBankingAuthBySourceID(
  req: Request,
  res: Response,
): Promise<void> {
  const sourceID = req.params.sourceID.toString();

  const { sources } = loadState();

  if (!Object.hasOwn(sources, sourceID)) {
    res.sendStatus(404);
    return;
  }

  const source = sources[sourceID];

  if (source?.type !== 'enablebanking' || !source.enablebanking) {
    res.sendStatus(400);
    return;
  }

  try {
    const client = new EBClient({
      api: ENABLEBANKING_API,
      appID: source.enablebanking.appID,
      privateKey: source.enablebanking.privateKey,
    });

    const state = jwt.sign({ iss: PUBLIC_URL, sub: sourceID }, stateSecret, {
      expiresIn: '15m',
    });

    const { url } = await client.initAuth({
      state,
      tokenValidity:
        source.enablebanking.tokenValidityDays * 24 * 60 * 60 * 1000,
      bankName: source.enablebanking.bankName,
      bankCountry: source.enablebanking.bankCountry,
      psuType: source.enablebanking.psuType,
      redirectURL: new URL('enablebanking/callback', PUBLIC_URL).href,
    });

    res.send({ url } satisfies output<
      typeof EnableBankingAuthorizationRequest
    >);
  } catch (error) {
    if (error instanceof EBError && error.responsible === 'client') {
      res.sendStatus(400);
    }
    throw error;
  }
}

export async function postEnableBankingSession(
  req: Request,
  res: Response,
): Promise<void> {
  let request: output<typeof EnableBankingSessionRequest>;
  try {
    request = EnableBankingSessionRequest.parse(req.body);
  } catch (error) {
    console.debug('Schema violation:', error);
    res.sendStatus(400);
    return;
  }

  let sourceID: string;
  try {
    const token = jwt.verify(request.state, stateSecret, {
      issuer: PUBLIC_URL,
    });

    if (typeof token === 'string' || !token.sub) {
      console.debug('Error parsing state: Invalid JWT payload');
      res.sendStatus(500);
      return;
    }

    sourceID = token.sub;
  } catch (error) {
    console.debug('Verifying state failed:', error);
    res.sendStatus(400);
    return;
  }

  const { sources } = loadState();

  if (!Object.hasOwn(sources, sourceID)) {
    res.sendStatus(400);
    return;
  }

  const source = sources[sourceID];

  if (source?.type !== 'enablebanking' || !source.enablebanking) {
    res.sendStatus(400);
    return;
  }

  try {
    const client = new EBClient({
      api: ENABLEBANKING_API,
      appID: source.enablebanking.appID,
      privateKey: source.enablebanking.privateKey,
    });

    const { sessionID, validUntil } = await client.authorizeSession({
      code: request.code,
    });

    putState((prev) =>
      updateIn(
        prev,
        ['sources', sourceID, 'enablebanking'],
        (
          prev: output<typeof Source>['enablebanking'],
        ): output<typeof Source>['enablebanking'] => {
          if (!prev) throw new Error('source gone');
          return {
            ...prev,
            sessionID,
            sessionValidUntil: new Date(validUntil),
          };
        },
      ),
    );

    res.send({ id: sourceID } satisfies output<typeof IDResponse>);
  } catch (error) {
    if (error instanceof EBError && error.responsible === 'client') {
      res.sendStatus(400);
    }
    throw error;
  }
}
