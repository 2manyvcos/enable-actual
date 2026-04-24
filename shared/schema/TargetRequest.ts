import { discriminatedUnion } from 'zod';
import ActualBudgetTargetRequest from './ActualBudgetTargetRequest.ts';

export default discriminatedUnion('type', [ActualBudgetTargetRequest]);
