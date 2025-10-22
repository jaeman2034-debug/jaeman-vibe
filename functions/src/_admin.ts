import { getApps, initializeApp } from "firebase-admin/app";

// 단일 초기화 보장
if (getApps().length === 0) {
  initializeApp();
}