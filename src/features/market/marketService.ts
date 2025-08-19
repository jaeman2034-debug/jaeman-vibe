// src/features/market/marketService.ts
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { auth, db, storage } from '../../firebase';

export type NewItemInput = {
  title: string;
  price: number;
  category: string;
  condition: '새상품' | '최상' | '상' | '중' | '하';
  description: string;
  images: File[];
  location?: { lat: number; lng: number } | null;
};

export async function uploadImages(files: File[], uid: string) {
  const urls: string[] = [];
  for (const file of files) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const key = `products/${uid}/${id}-${file.name}`;
    const r = ref(storage, key);
    const task = uploadBytesResumable(r, file, { contentType: file.type });

    await new Promise<void>((resolve, reject) => {
      task.on(
        'state_changed',
        undefined,
        reject,
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          urls.push(url);
          resolve();
        }
      );
    });
  }
  return urls;
}

export async function createMarketItem(input: NewItemInput) {
  const user = auth.currentUser;
  if (!user) throw new Error('로그인이 필요합니다.');

  const imageUrls = input.images.length ? await uploadImages(input.images, user.uid) : [];

  const docRef = await addDoc(collection(db, 'market_items'), {
    title: input.title,
    price: input.price,
    category: input.category,
    condition: input.condition,
    description: input.description,
    images: imageUrls,
    uid: user.uid,
    seller: {
      uid: user.uid,
      displayName: user.displayName || null,
      email: user.email || null,
    },
    location: input.location || null,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: docRef.id, images: imageUrls };
} 