import { discriminatedUnion } from 'zod';
import ActualBudgetTargetResponse from './ActualBudgetTargetResponse.ts';

export default discriminatedUnion('type', [ActualBudgetTargetResponse]);
