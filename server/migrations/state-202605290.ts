/* eslint-disable @typescript-eslint/no-explicit-any */

const payeeTemplate = `{% if data.credit_debit_indicator == "DBIT" -%}
  {% assign payeeID = data.creditor_account.iban | default: data.creditor_account.other.identification -%}
{% else -%}
  {% assign payeeID = data.debtor_account.iban | default: data.debtor_account.other.identification -%}
{% endif -%}
{{ default }} {% if payeeID %}({{ payeeID | mask }}){% endif %}`;

/**
 * This migration function moves the old appendPayeeID option to the new templating system.
 */
export default function state202605290(state: any): unknown {
  if (state?.schedules != null) {
    Object.values(state.schedules).forEach((schedule: any) => {
      if (Object.hasOwn(schedule, 'appendPayeeID')) {
        if (schedule.appendPayeeID && schedule.accounts?.length) {
          schedule.accounts.forEach((account: any) => {
            account.templates ??= {};
            account.templates.payee = payeeTemplate;
          });
        }
        delete schedule.appendPayeeID;
      }
    });
  }

  return state;
}
