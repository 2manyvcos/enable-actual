import { discriminatedUnion } from 'zod';
import EnableBankingSourceUpdate from './EnableBankingSourceUpdate.ts';

export default discriminatedUnion('type', [EnableBankingSourceUpdate]);
