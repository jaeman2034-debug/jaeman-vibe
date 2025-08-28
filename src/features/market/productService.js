import { auth, storage, db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
async function uploadOne(file, uid) { const id = crypto.randomUUID(); const r = ref(storage, `market/${uid}/${id}-${file.name}`); await uploadBytes(r, file); return await getDownloadURL(r); }
export async function createProduct(input) { const user = auth.currentUser; if (!user)
    throw new Error('로그?�이 ?�요?�니??'); const urls = []; for (const f of input.images) {
    const url = await uploadOne(f, user.uid);
    urls.push(url);
} const doc = { title: input.title.trim(), category: input.category, condition: input.condition, price: input.price, description: input.description.trim(), imageUrls: urls, ownerUid: user.uid, ownerName: user.displayName ?? user.email, createdAt: serverTimestamp(), }; const refCol = collection(db, 'products'); const { id } = await addDoc(refCol, doc); return { id, ...doc }; }
