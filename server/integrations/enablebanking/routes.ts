import type { Request, Response } from 'express';
import { updateIn } from 'immutable';
import jwt from 'jsonwebtoken';
import { v7 as uuid } from 'uuid';
import { type output } from 'zod';
import type EnableBankingASPSP from '../../../shared/schema/EnableBankingASPSP.ts';
import type EnableBankingAuthRequest from '../../../shared/schema/EnableBankingAuthRequest.ts';
import EnableBankingSessionRequest from '../../../shared/schema/EnableBankingSessionRequest.ts';
import type IDResponse from '../../../shared/schema/IDResponse.ts';
import type SourceState from '../../../shared/schema/SourceState.ts';
import APIError from '../../api/APIError.ts';
import { publishEvent } from '../../api/events.ts';
import { ENABLEBANKING_API, PUBLIC_URL } from '../../config.ts';
import { loadState, putState } from '../../state.ts';
import EBClient, { EBError } from './EBClient.ts';

const stateSecret = uuid();

export async function getSourcesByIDEnableBankingASPSPs(
  req: Request,
  res: Response,
): Promise<void> {
  const sourceID = req.params.sourceID.toString();
  const country = req.query.country?.toString();

  const { sources } = loadState();

  if (!Object.hasOwn(sources, sourceID)) {
    throw new APIError(`Source "${sourceID}" not found`, 404);
  }

  const source = sources[sourceID];

  if (source?.type !== 'enablebanking') {
    throw new APIError('Type mismatch', 400);
  }

  try {
    const client = new EBClient({
      api: ENABLEBANKING_API,
      appID: source.appID,
      privateKey: source.privateKey,
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
    throw new APIError(
      error,
      (error as EBError)?.responsible === 'client' ? 400 : 500,
    );
  }
}

export async function postSourcesByIDEnableBankingAuth(
  req: Request,
  res: Response,
): Promise<void> {
  const sourceID = req.params.sourceID.toString();

  const { sources } = loadState();

  if (!Object.hasOwn(sources, sourceID)) {
    throw new APIError(`Source "${sourceID}" not found`, 404);
  }

  const source = sources[sourceID];

  if (source?.type !== 'enablebanking') {
    throw new APIError('Type mismatch', 400);
  }

  if (
    !source.tokenValidityDays ||
    !source.bankCountry ||
    !source.bankName ||
    !source.psuType
  ) {
    throw new APIError('Setup required', 400);
  }

  try {
    const client = new EBClient({
      api: ENABLEBANKING_API,
      appID: source.appID,
      privateKey: source.privateKey,
    });

    const state = jwt.sign({ iss: PUBLIC_URL, sub: sourceID }, stateSecret, {
      expiresIn: '15m',
    });

    const { url } = await client.initAuth({
      state,
      tokenValidity: source.tokenValidityDays * 24 * 60 * 60 * 1000,
      bankCountry: source.bankCountry,
      bankName: source.bankName,
      psuType: source.psuType,
      redirectURL: new URL('enablebanking/callback', PUBLIC_URL).href,
    });

    res.send({ url } satisfies output<typeof EnableBankingAuthRequest>);
  } catch (error) {
    throw new APIError(
      error,
      (error as EBError)?.responsible === 'client' ? 400 : 500,
    );
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
    throw new APIError(error, 400, 'Schema violation');
  }

  let sourceID: string;
  try {
    const token = jwt.verify(request.state, stateSecret, {
      issuer: PUBLIC_URL,
    });

    if (typeof token === 'string' || !token.sub) {
      throw new APIError('Invalid JWT payload', 500);
    }

    sourceID = token.sub;
  } catch (error) {
    throw new APIError(error, 400, 'Invalid state');
  }

  const { sources } = loadState();

  if (!Object.hasOwn(sources, sourceID)) {
    throw new APIError(`Source "${sourceID}" not found`, 404);
  }

  const source = sources[sourceID];

  if (source?.type !== 'enablebanking') {
    throw new APIError('Type mismatch', 400);
  }

  try {
    const client = new EBClient({
      api: ENABLEBANKING_API,
      appID: source.appID,
      privateKey: source.privateKey,
    });

    const { sessionID, validUntil, accounts } = await client.authorizeSession({
      code: request.code,
    });

    putState((prev) =>
      updateIn(
        prev,
        ['sources', sourceID],
        (prev: output<typeof SourceState>): output<typeof SourceState> => {
          if (!prev) {
            throw new APIError(`Source "${sourceID}" not found`, 404);
          }

          if (prev.type !== 'enablebanking') {
            throw new APIError('Type mismatch', 400);
          }

          return {
            ...prev,
            sessionID,
            sessionValidUntil: new Date(validUntil),
            availableAccounts: accounts
              .filter(({ uid }) => uid)
              .map(({ uid, name: accountName, details, account_id }) => {
                let name = accountName ?? '';
                if (details) name += ` | ${details}`;
                if (account_id?.iban) name += ` (IBAN ${account_id.iban})`;
                else name += ` (UID ${uid})`;
                return { id: uid!, name };
              }),
          };
        },
      ),
    );

    publishEvent();

    res.send({ id: sourceID } satisfies output<typeof IDResponse>);
  } catch (error) {
    throw new APIError(
      error,
      (error as EBError)?.responsible === 'client' ? 400 : 500,
    );
  }
}
