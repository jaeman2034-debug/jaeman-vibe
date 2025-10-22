import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadPdf(blob: Blob, path: string) {
  const storage = getStorage();
  const r = ref(storage, path);
  await uploadBytes(r, blob, { contentType: 'application/pdf' });
  const url = await getDownloadURL(r);
  return url;
}
