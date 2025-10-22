import { getApps, initializeApp } from "firebase-admin/app";
export const adminApp = getApps().length ? getApps()[0] : initializeApp();
