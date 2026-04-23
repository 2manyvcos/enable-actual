import type { output } from 'zod';
import type EnableBankingSourceRequest from '../../../shared/schema/EnableBankingSourceRequest.ts';
import EnableBankingSourceResponse from '../../../shared/schema/EnableBankingSourceResponse.ts';
import EnableBankingSourceState from '../../../shared/schema/EnableBankingSourceState.ts';
import type EnableBankingSourceUpdate from '../../../shared/schema/EnableBankingSourceUpdate.ts';
import type SourceAccount from '../../../shared/schema/SourceAccount.ts';
import { startOfDate } from '../../../shared/utils.ts';
import APIError from '../../api/APIError.ts';
import { ENABLEBANKING_API } from '../../config.ts';
import EBClient, { type EBError } from './EBClient.ts';

export function getEnableBankingSourceResponse(
  id: string,
  {
    name,
    appID,
    bankCountry,
    bankName,
    psuType,
    tokenValidityDays,
    sessionID,
    sessionValidUntil,
  }: output<typeof EnableBankingSourceState>,
): output<typeof EnableBankingSourceResponse> {
  const setupRequired =
    !bankCountry || !bankName || !psuType || !tokenValidityDays;

  try {
    return EnableBankingSourceResponse.decode({
      id,
      type: 'enablebanking',
      name,
      available: !setupRequired && !!sessionID,
      appID,
      bankCountry,
      bankName,
      psuType,
      tokenValidityDays,
      sessionID,
      sessionValidUntil,
      setupRequired,
    });
  } catch (error) {
    throw new APIError(error, 500, 'Schema violation');
  }
}

export async function applyEnableBankingSourceRequest({
  name,
  appID,
  privateKey,
}: output<typeof EnableBankingSourceRequest>): Promise<
  output<typeof EnableBankingSourceState>
> {
  try {
    const client = new EBClient({
      api: ENABLEBANKING_API,
      appID,
      privateKey,
    });

    const { active } = await client.getApplication();

    if (!active)
      throw new APIError('Enable Banking application is inactive', 400);
  } catch (error) {
    throw new APIError(
      error,
      (error as EBError)?.responsible === 'client' ? 400 : 500,
    );
  }

  try {
    return EnableBankingSourceState.decode({
      type: 'enablebanking',
      name,
      appID,
      privateKey,
    });
  } catch (error) {
    throw new APIError(error, 500, 'Schema violation');
  }
}

export async function applyEnableBankingSourceUpdate(
  {
    appID,
    privateKey,
    bankCountry: prevBankCountry,
    bankName: prevBankName,
    psuType: prevPsuType,
    sessionID: prevSessionID,
    sessionValidUntil: prevSessionValidUntil,
  }: output<typeof EnableBankingSourceState>,
  {
    name,
    bankCountry,
    bankName,
    psuType,
    tokenValidityDays,
  }: output<typeof EnableBankingSourceUpdate>,
): Promise<output<typeof EnableBankingSourceState>> {
  let sessionID;
  let sessionValidUntil;
  if (
    prevBankCountry &&
    prevBankCountry === bankCountry &&
    prevBankName &&
    prevBankName === bankName &&
    prevPsuType &&
    prevPsuType === psuType
  ) {
    sessionID = prevSessionID;
    sessionValidUntil = prevSessionValidUntil;
  }

  try {
    return EnableBankingSourceState.decode({
      type: 'enablebanking',
      name: name || `${bankName} (${bankCountry})`,
      appID,
      privateKey,
      bankCountry,
      bankName,
      psuType,
      tokenValidityDays,
      sessionID,
      sessionValidUntil,
    });
  } catch (error) {
    throw new APIError(error, 500, 'Schema violation');
  }
}

export async function getEnableBankingSourceAccounts(
  _id: string,
  { sessionID, availableAccounts }: output<typeof EnableBankingSourceState>,
): Promise<output<typeof SourceAccount>[]> {
  if (!sessionID || !availableAccounts) {
    throw new APIError('Setup required', 400);
  }

  return availableAccounts;
}

export function getEnableBankingSourceSessionExpiryDays(
  _id: string,
  { sessionID, sessionValidUntil }: output<typeof EnableBankingSourceState>,
): number | undefined {
  if (!sessionID || !sessionValidUntil) return undefined;

  return Math.floor(
    (startOfDate(sessionValidUntil).getTime() -
      startOfDate(new Date()).getTime()) /
      (24 * 60 * 60 * 1000),
  );
}
