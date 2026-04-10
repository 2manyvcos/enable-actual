import fs from 'fs';
import jwt from 'jsonwebtoken';
import type { Response } from 'node-fetch';
import fetch from 'node-fetch';

export type EBASPSPsResponse = {
  aspsps: {
    name: string;
    country: string;
    psu_types: string[];
  }[];
};

export type EBPSUType = 'personal' | 'business';

export type EBStartAuthorizationResponse = {
  state: string;
  validUntil: string;
  url: string;
};

export type EBAccount = {
  account_id?: {
    iban?: string;
  };
  name?: string;
  details?: string;
  uid?: string;
};

export type EBAuthorizeSessionResponse = {
  sessionID: string;
  accounts: EBAccount[];
};

export type EBCreditDebitIndicator = 'CRDT' | 'DBIT';

export type EBTransactionStatus = 'BOOK';

export type EBTransaction = {
  entry_reference?: string;
  transaction_amount: {
    currency: string;
    amount: string;
  };
  creditor?: { name?: string };
  debtor?: { name?: string };
  credit_debit_indicator: EBCreditDebitIndicator;
  status: EBTransactionStatus;
  booking_date?: string;
  value_date?: string;
  transaction_date?: string;
  remittance_information?: string[];
  note?: string;
};

export type EBTransactionsResponse = {
  transactions: EBTransaction[];
  continuationKey?: string;
  next?: () => Promise<EBTransactionsResponse>;
};

export class EBError extends Error {
  readonly code: number;
  readonly status: string;
  readonly description?: string;

  constructor(
    message: string,
    code: number,
    status: string,
    description?: string,
  ) {
    super(
      `${message}: ${code} ${status}${description ? `\n${description}` : ''}`,
    );
    this.code = code;
    this.status = status;
    this.description = description;
  }
}

async function throwStatus(res: Response, message: string) {
  throw new EBError(message, res.status, res.statusText, await res.text());
}

export default class EBClient {
  private api: string;
  private appID: string;
  private privateKey: string;

  constructor({
    api = 'https://api.enablebanking.com',
    appID,
    privateKey,
    privateKeyFile,
  }: {
    api: string;
    appID: string;
    privateKey?: string;
    privateKeyFile?: string;
  }) {
    this.api = api.replace(/\/*$/, '');
    this.appID = appID;
    if (privateKey) this.privateKey = privateKey;
    else if (privateKeyFile)
      this.privateKey = fs.readFileSync(privateKeyFile, 'utf8');
    else throw new Error('Private key missing');
  }

  createJWT(): string {
    const now = Math.floor(Date.now() / 1000);

    try {
      return jwt.sign(
        {
          iss: 'enablebanking.com',
          aud: 'api.enablebanking.com',
          iat: now,
          exp: now + 3600,
        },
        this.privateKey,
        { algorithm: 'RS256', header: { alg: 'RS256', kid: this.appID } },
      );
    } catch (error) {
      throw new EBError(
        'Error signing JWT',
        0,
        'invalid-jwt',
        (error as Error)?.message || error?.toString(),
      );
    }
  }

  async getASPSPs({
    country,
  }: {
    country?: string;
  }): Promise<EBASPSPsResponse> {
    const jwt = this.createJWT();

    const search = new URLSearchParams();
    if (country) search.set('country', country);
    const res = await fetch(`${this.api}/aspsps`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
    });

    if (!res.ok) {
      await throwStatus(res, 'ASPSP request failed');
    }

    return (await res.json()) as EBASPSPsResponse;
  }

  async initAuth({
    state,
    tokenValidity,
    bankName,
    bankCountry,
    psuType,
    redirectURL,
  }: {
    state: string;
    tokenValidity: number;
    bankName: string;
    bankCountry: string;
    psuType: EBPSUType;
    redirectURL: string;
  }): Promise<EBStartAuthorizationResponse> {
    const jwt = this.createJWT();
    const validUntil = new Date(Date.now() + tokenValidity).toISOString();

    const res = await fetch(`${this.api}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        access: { valid_until: validUntil },
        aspsp: { name: bankName, country: bankCountry },
        state,
        redirect_url: redirectURL,
        psu_type: psuType,
      }),
    });

    if (!res.ok) {
      await throwStatus(res, 'Auth request failed');
    }

    const { url } = (await res.json()) as { url: string };
    return { state, validUntil, url };
  }

  async authorizeSession({
    code,
  }: {
    code: string;
  }): Promise<EBAuthorizeSessionResponse> {
    const jwt = this.createJWT();

    const res = await fetch(`${this.api}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ code }),
    });

    if (!res.ok) {
      await throwStatus(res, 'Session request failed');
    }

    const { session_id: sessionID, accounts } = (await res.json()) as {
      session_id: string;
      accounts: EBAccount[];
    };
    return { sessionID, accounts };
  }

  async getTransactions({
    accountUID,
    dateFrom,
    dateTo,
    transactionStatus,
    continuationKey,
  }: {
    accountUID: string;
    dateFrom?: string;
    dateTo?: string;
    transactionStatus?: EBTransactionStatus;
    continuationKey?: string;
  }): Promise<EBTransactionsResponse> {
    const jwt = this.createJWT();

    const search = new URLSearchParams();
    if (dateFrom) search.set('date_from', dateFrom);
    if (dateTo) search.set('date_to', dateTo);
    if (transactionStatus) search.set('transaction_status', transactionStatus);
    if (continuationKey) search.set('continuation_key', continuationKey);
    const res = await fetch(
      `${this.api}/accounts/${encodeURIComponent(accountUID)}/transactions?${search.toString()}`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      },
    );

    if (!res.ok) {
      await throwStatus(res, 'Transaction request failed');
    }

    const { transactions, continuation_key: nextContinuationKey } =
      (await res.json()) as {
        transactions: EBTransaction[];
        continuation_key?: string;
      };

    return {
      transactions,
      continuationKey: nextContinuationKey,
      next: nextContinuationKey
        ? async () =>
            this.getTransactions({
              accountUID,
              continuationKey: nextContinuationKey,
            })
        : undefined,
    };
  }
}
