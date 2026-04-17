export default function createSessionExpiryJob(): () => Promise<void> {
  return async () => {
    console.debug('Running session expiry job');

    console.log('TODO:');
  };
}
