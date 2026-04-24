import { discriminatedUnion } from 'zod';
import ActualBudgetTargetUpdate from './ActualBudgetTargetUpdate.ts';

export default discriminatedUnion('type', [ActualBudgetTargetUpdate]);
