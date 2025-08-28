import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
const isDataUri = (s) => /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(s);
export async function uploadDataUriToStorage(dataUri, path) { const blob = await (await fetch(dataUri)).blob(); const storageRef = ref(storage, path); await uploadBytes(storageRef, blob, { contentType: blob.type }); return await getDownloadURL(storageRef); } /** ?�품 ?�?????��?지 ?�규?? Data URI ???�로?? ?�니�?그�?�?*/
export async function normalizeImagesBeforeSave(productId, images) { const out = []; for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (isDataUri(img)) {
        const url = await uploadDataUriToStorage(img, `markets/${productId}/${Date.now()}_${i}.webp`);
        out.push(url);
    }
} } // ?�는 경로�??�?�하�??�다�?storageRef.fullPath�??�??    } else {      out.push(img);    }  }  return out;}
