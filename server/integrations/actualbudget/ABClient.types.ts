export type ABConfig = {
  serverURL: string;
  password: string;
};

export type ABBudgetConfig = {
  budgetID: string;
  budgetPassword?: string;
};

export type ABBudgetFile = {
  /** The budget's name. */
  name: string;
  /** The id for the budget on the server. This is usually a UUID. */
  cloudFileId: string;
  /** The group id for the budget. */
  groupId: string;
  /** If the file has an encryption key. */
  hasKey: boolean;
  /** The encryption key ID for this file, if it is encrypted. */
  encryptKeyId?: string;
  /** Remote files have this set to "remote". */
  state?: 'remote';
  /** The local budget file's local ID. */
  id?: string;
};

export type ABAccount = {
  id?: string;
  name: string;
  offbudget?: boolean;
  closed?: boolean;
};

export type ABErrorResponsible = 'client' | 'server';

export class ABError extends Error {
  readonly responsible: ABErrorResponsible;

  constructor(message: string, responsible: ABErrorResponsible) {
    super(message);
    this.responsible = responsible;
  }
}

export interface ABFnAuth {
  (config: ABConfig): Promise<void>;
}

export interface ABFnGetBudgets {
  (config: ABConfig): Promise<ABBudgetFile[]>;
}

export interface ABFnDownloadBudget {
  (config: ABConfig, budgetConfig: ABBudgetConfig): Promise<void>;
}

export interface ABFnGetAccounts {
  (config: ABConfig, budgetConfig: ABBudgetConfig): Promise<ABAccount[]>;
}
