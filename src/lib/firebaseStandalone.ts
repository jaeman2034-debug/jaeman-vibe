// src/lib/firebaseStandalone.ts
import { app, auth, db, storage } from "@/lib/firebase"; // ← 단일 초기화 파일에서만 가져오기

// Firestore/Storage 헬퍼 (콘솔용)
import {
  doc, getDoc, setDoc, updateDoc, addDoc, collection,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref as sRef, uploadBytes, uploadString, getDownloadURL,
} from "firebase/storage";
import { signInAnonymously, onAuthStateChanged, signOut } from "firebase/auth";

/**
 * 콘솔/개발 편의: 전역 바인딩을 보장하고
 * 중복 초기화 없이 app/auth/db/storage 를 돌려준다.
 */
export function ensureFirebase() {
  const w = window as any;

  // 전역 바인딩 (한 번만)
  w.app = w.app || app;
  w.auth = w.auth || auth;
  w.db = w.db || db;
  w.storage = w.storage || storage;

  w.fs = w.fs || { doc, getDoc, setDoc, updateDoc, addDoc, collection, serverTimestamp };
  w.st = w.st || { ref: sRef, upBytes: uploadBytes, upString: uploadString, getURL: getDownloadURL };
  
  // ★ auth 전역 헬퍼
  w.au = w.au || { signInAnonymously, onAuthStateChanged, signOut };

  // 디버그 로그(중복 호출 안전)
  if (!w.__emu_logged) {
    console.log("✅ [EMU] Firebase Emulators connected successfully");
    w.__emu_logged = true;
  }

  return { app, auth, db, storage };
}

// 필요시 다른 곳에서 바로 쓰도록 재노출
export { app, auth, db, storage };