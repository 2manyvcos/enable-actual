import { discriminatedUnion } from 'zod';
import EnableBankingSourceState from './EnableBankingSourceState.ts';

export default discriminatedUnion('type', [EnableBankingSourceState]);
