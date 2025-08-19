import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function uploadBlobToStorage(blob: Blob, pathPrefix = "uploads/products") {
  const storage = getStorage();
  const name = `${pathPrefix}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
  const r = ref(storage, name);
  await uploadBytes(r, blob, { contentType: "image/jpeg" });
  return getDownloadURL(r);
} 