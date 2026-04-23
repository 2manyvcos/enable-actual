import { stringifyError } from '../../shared/utils.ts';

export default class APIError extends Error {
  readonly code: number;

  constructor(
    error: unknown,
    code: number,
    context?: string,
    strict?: boolean,
  ) {
    super(`${context ? `${context}: ` : ''}${stringifyError(error)}`);
    this.code = !strict && error instanceof APIError ? error.code : code;
  }
}
