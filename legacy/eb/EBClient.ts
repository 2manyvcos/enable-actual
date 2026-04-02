import fs from 'fs';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

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
    psuType: string;
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
      throw new Error(
        `Auth request failed: ${res.status} ${res.statusText}\n${await res.text()}`,
      );
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
      throw new Error(
        `Session request failed: ${res.status} ${res.statusText}\n${await res.text()}`,
      );
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
      throw new Error(
        `Transaction request failed: ${res.status} ${res.statusText}\n${await res.text()}`,
      );
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
