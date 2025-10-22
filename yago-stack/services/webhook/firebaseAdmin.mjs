import admin from 'firebase-admin';
import { readFile } from 'node:fs/promises';

const SA = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_PATH;

if (!admin.apps.length) {
  const cred = SA ? JSON.parse(await readFile(SA, 'utf8')) : undefined;
  admin.initializeApp({ 
    credential: cred ? admin.credential.cert(cred) : admin.credential.applicationDefault() 
  });
}

export const authAdmin = admin.auth();
export const dbAdmin = admin.firestore();
