import path from 'path';
import { Worker } from 'worker_threads';
import { v7 as uuid } from 'uuid';
import {
  ABError,
  type ABAccount,
  type ABBudgetConfig,
  type ABBudgetFile,
  type ABConfig,
  type ABErrorResponsible,
  type ABFnAuth,
  type ABFnDownloadBudget,
  type ABFnGetAccounts,
  type ABFnGetBudgets,
  type ABFnImportTransactions,
  type ABImportResult,
  type ABTransaction,
} from './ABClient.types.ts';

let closed = false;
const workers: { [serverURL: string]: Worker } = {};

export async function closeABWorker(serverURL: string): Promise<void> {
  if (Object.hasOwn(workers, serverURL)) {
    const worker = workers[serverURL];
    delete workers[serverURL];
    const promise = new Promise((resolve) => {
      worker.once('exit', resolve);
    });
    worker.postMessage({ method: 'close' });
    await promise;
  }
}

export async function shutdownABWorkers(): Promise<void> {
  if (closed) return;
  closed = true;

  await Promise.all(Object.keys(workers).map(closeABWorker));
}

export default class ABClient {
  private connection: Worker;
  private config: ABConfig;

  constructor({ url, password }: { url: string; password: string }) {
    if (closed) throw new ABError('Server is shutting down', 'server');

    if (!Object.hasOwn(workers, url)) {
      workers[url] = new Worker(
        path.join(import.meta.dirname, './ABClient.worker.ts'),
      );
    }

    this.connection = workers[url];
    this.config = { serverURL: url, password };
  }

  auth(): Promise<void> {
    return this.send<ABFnAuth>('auth', this.config);
  }

  getBudgets(): Promise<ABBudgetFile[]> {
    return this.send<ABFnGetBudgets>('getBudgets', this.config);
  }

  downloadBudget(budgetConfig: ABBudgetConfig): Promise<void> {
    return this.send<ABFnDownloadBudget>(
      'downloadBudget',
      this.config,
      budgetConfig,
    );
  }

  getAccounts(budgetConfig: ABBudgetConfig): Promise<ABAccount[]> {
    return this.send<ABFnGetAccounts>('getAccounts', this.config, budgetConfig);
  }

  importTransactions(
    budgetConfig: ABBudgetConfig,
    bundles: { accountUID: string; transactions: ABTransaction[] }[],
  ): Promise<ABImportResult> {
    return this.send<ABFnImportTransactions>(
      'importTransactions',
      this.config,
      budgetConfig,
      bundles,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private send<F extends (...args: any[]) => Promise<any>>(
    method: string,
    ...args: Parameters<F>
  ): ReturnType<F> {
    return new Promise((resolve, reject) => {
      const id = uuid();

      const handler = ({
        id: messageID,
        result,
        error,
        responsible,
      }: {
        id: string;
        result: unknown;
        error?: string;
        responsible: ABErrorResponsible;
      }) => {
        if (id !== messageID) return;

        this.connection.removeListener('message', handler);

        if (error) {
          reject(new ABError(error, responsible));
          return;
        }

        resolve(result);
      };

      this.connection.addListener('message', handler);

      this.connection.postMessage({ id, method, args });
    }) as ReturnType<F>;
  }
}
