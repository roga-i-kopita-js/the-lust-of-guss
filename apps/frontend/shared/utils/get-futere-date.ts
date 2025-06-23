export function getFutureISOString(secondsToAdd: number): string {
  const now = Date.now();
  const future = new Date(now + secondsToAdd * 1000);
  return future.toISOString();
}
