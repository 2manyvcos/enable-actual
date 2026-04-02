import crypto from 'crypto';
import express from 'express';
import {
  APP_NAME,
  EB_API,
  EB_APP_ID,
  EB_BANK_COUNTRY,
  EB_BANK_NAME,
  EB_PRIVATE_KEY,
  EB_PRIVATE_KEY_FILE,
  EB_PSU_TYPE,
  EB_TOKEN_VALIDITY,
  PUBLIC_URL,
} from '../config.ts';
import { putState } from '../state.ts';
import sync from '../sync.ts';
import EBClient, { type EBStartAuthorizationResponse } from './EBClient.ts';

const router = express.Router();

let activeAuth:
  | (EBStartAuthorizationResponse & { sessionID?: string })
  | undefined;

router.get('/auth', async (_req, res) => {
  const client = new EBClient({
    api: EB_API,
    appID: EB_APP_ID,
    privateKey: EB_PRIVATE_KEY,
    privateKeyFile: EB_PRIVATE_KEY_FILE,
  });

  const state = crypto.randomUUID();
  console.log(`Initiating EB authorization attempt ${state}…`);
  activeAuth = await client.initAuth({
    state,
    tokenValidity: EB_TOKEN_VALIDITY,
    bankName: EB_BANK_NAME,
    bankCountry: EB_BANK_COUNTRY,
    psuType: EB_PSU_TYPE,
    redirectURL: new URL('eb/callback', PUBLIC_URL).href,
  });

  res.redirect(activeAuth.url);
});

router.get('/callback', async (req, res) => {
  const state = req.query.state?.toString();
  const code = req.query.code?.toString();
  const error = req.query.error?.toString();
  const errorDescription = req.query.error_description?.toString();

  if (!state || !code) {
    let errorMessage = `Something went wrong`;
    if (error) errorMessage += ` (${error})`;
    if (errorDescription) errorMessage += ` - ${errorDescription}`;
    console.log(`EB callback error: ${errorMessage}`);
    res.status(500).send(errorMessage);
    return;
  }

  if (state !== activeAuth?.state) {
    res.status(400).send('Invalid or outdated request');
    return;
  }

  const client = new EBClient({
    api: EB_API,
    appID: EB_APP_ID,
    privateKey: EB_PRIVATE_KEY,
    privateKeyFile: EB_PRIVATE_KEY_FILE,
  });

  const { sessionID, accounts } = await client.authorizeSession({
    code: code.toString(),
  });

  if (state !== activeAuth?.state) {
    res.status(400).send('Invalid or outdated request');
    return;
  }

  activeAuth.sessionID = sessionID;

  res.render('select-accounts', {
    appName: APP_NAME,

    action: new URL(`eb/select?state=${encodeURIComponent(state)}`, PUBLIC_URL)
      .href,

    accountOptions: accounts.map((account) => {
      let description = account.name ?? '';
      if (account.details) description += ` | ${account.details}`;
      if (account.account_id?.iban)
        description += ` (IBAN ${account.account_id.iban})`;
      else if (account.uid) description += ` (UID ${account.uid})`;
      return {
        value: account.uid ?? '',
        attrs: account.uid ? undefined : 'disabled',
        description,
      };
    }),
  });
});

router.post('/select', (req, res) => {
  const state = req.query.state?.toString();

  if (state !== activeAuth?.state) {
    res.status(400).send('Invalid or outdated request');
    return;
  }

  const { validUntil, sessionID } = activeAuth!;
  if (!validUntil || !sessionID) {
    res.status(500).send('Internal server error');
    return;
  }

  const { accounts } = req.body;
  const accountUIDs = Array.isArray(accounts)
    ? accounts
    : accounts
      ? [accounts]
      : [];
  if (!accountUIDs.length) {
    res.status(400).send('No accounts selected');
    return;
  }

  putState({
    source: {
      type: 'eb',
      sessionID,
      sessionExpiry: validUntil,
      accountUIDs,
    },
  });
  activeAuth = undefined;

  console.log('EB authorization done');

  res.send('Done');
});

router.get('/sync', async (_req, res) => {
  await sync();

  res.send('Done');
});

export default router;
