import type { output } from 'zod';
import type EnableBankingSourceRequest from '../../../../shared/schema/EnableBankingSourceRequest.ts';
import EnableBankingSourceResponse from '../../../../shared/schema/EnableBankingSourceResponse.ts';
import EnableBankingSourceState from '../../../../shared/schema/EnableBankingSourceState.ts';
import type EnableBankingSourceUpdate from '../../../../shared/schema/EnableBankingSourceUpdate.ts';
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
  return EnableBankingSourceResponse.decode({
    id,
    type: 'enablebanking',
    name:
      name ||
      [bankName, !bankCountry ? undefined : `(${bankCountry})`]
        .filter(Boolean)
        .join(' ') ||
      undefined,
    appID,
    bankCountry,
    bankName,
    psuType,
    tokenValidityDays,
    sessionID,
    sessionValidUntil,
    setupRequired: !bankCountry || !bankName || !psuType || !tokenValidityDays,
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

export function applyEnableBankingSourceUpdate(
  {
    appID,
    privateKey,
    sessionID,
    sessionValidUntil,
  }: output<typeof EnableBankingSourceState>,
  {
    name,
    bankCountry,
    bankName,
    psuType,
    tokenValidityDays,
  }: output<typeof EnableBankingSourceUpdate>,
): output<typeof EnableBankingSourceState> {
  return EnableBankingSourceState.decode({
    type: 'enablebanking',
    name,
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
