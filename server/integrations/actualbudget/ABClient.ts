import path from 'path';
import { Worker } from 'worker_threads';
import { v7 as uuid } from 'uuid';
import {
  ABError,
  type ABBudgetConfig,
  type ABBudgetFile,
  type ABConfig,
  type ABErrorResponsible,
  type ABFnAuth,
  type ABFnDownloadBudget,
  type ABFnGetBudgets,
} from './ABClient.types.ts';

const workers: { [serverURL: string]: Worker } = {};

export default class ABClient {
  private connection: Worker;
  private config: ABConfig;

  constructor({ url, password }: { url: string; password: string }) {
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
