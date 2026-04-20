import { PUBLIC_URL } from '../config.ts';
import { getEnableBankingSourceSessionExpiryDays } from '../integrations/enablebanking/sources.ts';
import notify from '../notify.ts';
import { loadState } from '../state.ts';

export default function createSetupAlertJob(): () => Promise<void> {
  return async () => {
    console.debug('Running setup alert job');

    const {
      sources,
      targets,
      notifications: {
        alerts: { sessionExpiryDays },
      },
    } = loadState();

    if (sessionExpiryDays) {
      const expiries = await Promise.all([
        ...Object.entries(sources).map(([sourceID, source]) => {
          if (!source) return;
          try {
            switch (source.type) {
              case 'enablebanking':
                return getEnableBankingSourceSessionExpiryDays(
                  sourceID,
                  source,
                );
            }
          } catch (error) {
            console.debug('Implementation rejection:', error);
            return undefined;
          }
        }),

        ...Object.entries(targets).map(([_targetID, target]) => {
          if (!target) return;
          try {
            switch (target.type) {
              case 'actualbudget':
                return undefined;
            }
          } catch (error) {
            console.debug('Implementation rejection:', error);
            return undefined;
          }
        }),
      ]);

      const expiring = expiries.filter(
        (expiry) => expiry != null && expiry <= sessionExpiryDays,
      ) as number[];

      if (expiring.length) {
        notify({
          message:
            expiring.length === 1
              ? expiring[0] === 1
                ? `One of your account sessions expires tomorrow. Please don't forget to reauthorize in time.`
                : expiring[0] > 0
                  ? `One of your account sessions expires in ${expiring[0].toLocaleString()} days. Please don't forget to reauthorize in time.`
                  : 'One of your account sessions has expired. Please reauthorize as soon as possible.'
              : `${expiring.length.toLocaleString()} of your account sessions have expired or are about to expire. Please reauthorize as soon as possible.`,
          action: PUBLIC_URL,
        });
      }
    }
  };
}
