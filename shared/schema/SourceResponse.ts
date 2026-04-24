import { discriminatedUnion } from 'zod';
import EnableBankingSourceResponse from './EnableBankingSourceResponse.ts';

export default discriminatedUnion('type', [EnableBankingSourceResponse]);
