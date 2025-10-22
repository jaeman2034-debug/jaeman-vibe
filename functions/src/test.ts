import * as functions from 'firebase-functions/v1';

export const testFunction = functions.https.onCall(async (data, context) => {
  return { message: 'Hello World!', timestamp: new Date().toISOString() };
});
