import type { SyncState } from './state';

export type Transaction = {
  id?: string;
  date: string;
  amount: number;
  currency: string;
  payee?: string;
  notes?: string;
};

export type TransactionBundle = {
  state: SyncState;
  transactions: Transaction[];
};
