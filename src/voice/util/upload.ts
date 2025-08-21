import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// 환경변수 체크
const USE_STORAGE = false; // 강제로 false로 설정 (환경변수 문제 우회)
console.log("[VOICE_UPLOAD] USE_STORAGE:", USE_STORAGE);

export async function uploadBlobToStorage(blob: Blob, pathPrefix = "uploads/products") {
  if (!USE_STORAGE) {
    console.log('[VOICE_UPLOAD] Skipping storage upload (USE_STORAGE:', USE_STORAGE, ')');
    return null;
  }
  
  console.log('[VOICE_UPLOAD] Uploading blob to storage...');
  const storage = getStorage();
  const name = `${pathPrefix}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
  const r = ref(storage, name);
  await uploadBytes(r, blob, { contentType: "image/jpeg" });
  return getDownloadURL(r);
} 