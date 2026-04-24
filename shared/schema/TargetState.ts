import { discriminatedUnion } from 'zod';
import ActualBudgetTargetState from './ActualBudgetTargetState.ts';

export default discriminatedUnion('type', [ActualBudgetTargetState]);
