export default function createSetupAlertJob(): () => Promise<void> {
  return async () => {
    console.debug('Running setup alert job');

    console.log('TODO:');
  };
}
