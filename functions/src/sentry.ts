import * as functions from 'firebase-functions/v1';

// Sentry 없이 간단한 wrapper
export const wrapCall = <T>(name: string, fn: (data: any, ctx: functions.https.CallableContext) => Promise<T>) => {
  return functions.https.onCall(async (data, ctx) => {
    try {
      const result = await fn(data, ctx);
      return result;
    } catch (e) {
      console.error(`[${name}] Error:`, e);
      throw e;
    }
  });
};

export const wrapRun = <T>(name: string, fn: () => Promise<T>) =>
  async () => {
    try {
      const result = await fn();
      return result;
    } catch (e) {
      console.error(`[${name}] Error:`, e);
      throw e;
    }
  };