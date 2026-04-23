import type { output } from 'zod';
import type ActualBudgetTargetRequest from '../../../shared/schema/ActualBudgetTargetRequest.ts';
import ActualBudgetTargetResponse from '../../../shared/schema/ActualBudgetTargetResponse.ts';
import ActualBudgetTargetState from '../../../shared/schema/ActualBudgetTargetState.ts';
import type ActualBudgetTargetUpdate from '../../../shared/schema/ActualBudgetTargetUpdate.ts';
import type QuickAction from '../../../shared/schema/QuickAction.ts';
import type TargetAccount from '../../../shared/schema/TargetAccount.ts';
import APIError from '../../api/APIError.ts';
import ABClient from './ABClient.ts';
import type { ABError } from './ABClient.types.ts';

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
  const setupRequired = !budgetID;

  try {
    return ActualBudgetTargetResponse.decode({
      id,
      type: 'actualbudget',
      name,
      available: !setupRequired,
      url,
      hasPassword: !!password,
      budgetID,
      hasBudgetPassword: !!budgetPassword,
      setupRequired,
    });
  } catch (error) {
    throw new APIError(error, 500, 'Schema violation');
  }
}

export async function applyActualBudgetTargetRequest({
  name,
  url,
  password,
}: output<typeof ActualBudgetTargetRequest>): Promise<
  output<typeof ActualBudgetTargetState>
> {
  try {
    const client = new ABClient({ url, password });

    await client.auth();
  } catch (error) {
    throw new APIError(
      error,
      (error as ABError)?.responsible === 'client' ? 400 : 500,
    );
  }

  try {
    return ActualBudgetTargetState.decode({
      type: 'actualbudget',
      name,
      url,
      password,
    });
  } catch (error) {
    throw new APIError(error, 500, 'Schema violation');
  }
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

  try {
    const client = new ABClient({ url, password });

    if (!name) {
      const budgets = await client.getBudgets();
      const budget = budgets.find(
        ({ state, groupId: id }) => state === 'remote' && id === budgetID,
      );
      name = budget?.name;
    }

    await client.downloadBudget({ budgetID, budgetPassword });
  } catch (error) {
    throw new APIError(
      error,
      (error as ABError)?.responsible === 'client' ? 400 : 500,
    );
  }

  try {
    return ActualBudgetTargetState.decode({
      type: 'actualbudget',
      name,
      url,
      password,
      budgetID,
      budgetPassword,
    });
  } catch (error) {
    throw new APIError(error, 500, 'Schema violation');
  }
}

export async function getActualBudgetTargetAccounts(
  _id: string,
  {
    url,
    password,
    budgetID,
    budgetPassword,
  }: output<typeof ActualBudgetTargetState>,
): Promise<output<typeof TargetAccount>[]> {
  if (!budgetID) throw new APIError('Setup required', 400);

  try {
    const client = new ABClient({ url, password });

    const accounts = await client.getAccounts({ budgetID, budgetPassword });

    return accounts
      .filter(({ id }) => id)
      .map(({ id, name: accountName, offbudget }) => {
        let name = accountName;
        if (offbudget) name += ` (Off budget)`;
        return { id: id!, name };
      });
  } catch (error) {
    throw new APIError(
      error,
      (error as ABError)?.responsible === 'client' ? 400 : 500,
    );
  }
}

export function getActualBudgetTargetQuickActions(
  id: string,
  state: output<typeof ActualBudgetTargetState>,
): output<typeof QuickAction>[] {
  const data = getActualBudgetTargetResponse(id, state);

  if (data.setupRequired) {
    return [
      {
        description: `Target "${data.name || id}" requires additional setup!`,
        action: 'Details',
        resource: 'targets',
        id,
      },
    ];
  }

  return [];
}
