import type { output } from 'zod';
import type EnableBankingSourceRequest from '../../../../shared/schema/EnableBankingSourceRequest.ts';
import EnableBankingSourceResponse from '../../../../shared/schema/EnableBankingSourceResponse.ts';
import EnableBankingSourceState from '../../../../shared/schema/EnableBankingSourceState.ts';
import type EnableBankingSourceUpdate from '../../../../shared/schema/EnableBankingSourceUpdate.ts';
import type SourceAccount from '../../../../shared/schema/SourceAccount.ts';
import { ENABLEBANKING_API } from '../../../config.ts';
import EBClient from '../EBClient.ts';

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
}

export async function applyEnableBankingSourceRequest({
  name,
  appID,
  privateKey,
}: output<typeof EnableBankingSourceRequest>): Promise<
  output<typeof EnableBankingSourceState>
> {
  const client = new EBClient({
    api: ENABLEBANKING_API,
    appID,
    privateKey,
  });

  const { active } = await client.getApplication();

  if (!active) throw new Error('Application is inactive');

  return EnableBankingSourceState.decode({
    type: 'enablebanking',
    name,
    appID,
    privateKey,
  });
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
}

export async function getEnableBankingSourceAccounts(
  _id: string,
  { sessionID, availableAccounts }: output<typeof EnableBankingSourceState>,
): Promise<output<typeof SourceAccount>[]> {
  if (!sessionID || !availableAccounts) {
    throw new Error('Setup required');
  }

  return availableAccounts;
}
