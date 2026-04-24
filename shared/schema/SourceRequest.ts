import { discriminatedUnion } from 'zod';
import EnableBankingSourceRequest from './EnableBankingSourceRequest.ts';

export default discriminatedUnion('type', [EnableBankingSourceRequest]);
