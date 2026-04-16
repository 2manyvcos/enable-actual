import type { output } from 'zod';
import type ActualBudgetTargetRequest from '../../../../shared/schema/ActualBudgetTargetRequest.ts';
import ActualBudgetTargetResponse from '../../../../shared/schema/ActualBudgetTargetResponse.ts';
import ActualBudgetTargetState from '../../../../shared/schema/ActualBudgetTargetState.ts';
import type ActualBudgetTargetUpdate from '../../../../shared/schema/ActualBudgetTargetUpdate.ts';
import ABClient from '../ABClient.ts';

export function getActualBudgetTargetResponse(
  id: string,
  {
    name,
    url,
    password,
    budgetID,
    budgetPassword,
  }: output<typeof ActualBudgetTargetState>,
): output<typeof ActualBudgetTargetResponse> {
  return ActualBudgetTargetResponse.decode({
    id,
    type: 'actualbudget',
    name,
    url,
    hasPassword: !!password,
    budgetID,
    hasBudgetPassword: !!budgetPassword,
    setupRequired: !budgetID,
  });
}

export async function applyActualBudgetTargetRequest({
  name,
  url,
  password,
}: output<typeof ActualBudgetTargetRequest>): Promise<
  output<typeof ActualBudgetTargetState>
> {
  const client = new ABClient({ url, password });

  await client.auth();

  return ActualBudgetTargetState.decode({
    type: 'actualbudget',
    name,
    url,
    password,
  });
}

export async function applyActualBudgetTargetUpdate(
  {
    password: prevPassword,
    budgetPassword: prevBudgetPassword,
  }: output<typeof ActualBudgetTargetState>,
  {
    name: nextName,
    url,
    password: nextPassword,
    budgetID,
    budgetPassword: nextBudgetPassword,
  }: output<typeof ActualBudgetTargetUpdate>,
): Promise<output<typeof ActualBudgetTargetState>> {
  let name = nextName;
  const password =
    nextPassword !== undefined ? (nextPassword || undefined)! : prevPassword;
  const budgetPassword =
    nextBudgetPassword !== undefined
      ? nextBudgetPassword || undefined
      : prevBudgetPassword;

  const client = new ABClient({ url, password });

  if (!name) {
    const budgets = await client.getBudgets();
    const budget = budgets.find(
      ({ state, groupId: id }) => state === 'remote' && id === budgetID,
    );
    name = budget?.name;
  }

  await client.downloadBudget({ budgetID, budgetPassword });

  return ActualBudgetTargetState.decode({
    type: 'actualbudget',
    name,
    url,
    password,
    budgetID,
    budgetPassword,
  });
}
