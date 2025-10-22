import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref as sref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage, auth } from '@/lib/firebase';

type ImgMeta = { url: string; path: string; order: number };

export default function NewItem() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [category, setCategory] = useState('전체');
  const [region, setRegion] = useState('KR');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 미리보기 메모리 정리
  useEffect(() => {
    previews.forEach((u) => URL.revokeObjectURL(u));
    setPreviews(files.map((f) => URL.createObjectURL(f)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files.length]);

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    setFiles(list);
    e.currentTarget.value = '';
  };

  const uploadAll = async (itemId: string, list: File[]): Promise<ImgMeta[]> => {
    const jobs = list.map(async (file, idx) => {
      const path = `market/${itemId}/${crypto.randomUUID()}.jpg`;
      const r = sref(storage, path);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      return { url, path, order: idx };
    });
    return Promise.all(jobs);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert('상품명을 입력해 주세요.');
    if (!auth.currentUser) return alert('로그인이 필요합니다.');

    setSubmitting(true);
    try {
      const itemId = crypto.randomUUID();
      const imgs = files.length ? await uploadAll(itemId, files) : [];
      await setDoc(doc(db, 'market', itemId), {
        title: title.trim(),
        price: Number(price) || 0,
        category,
        region,
        description: description.trim(),
        status: 'selling',
        images: imgs,
        thumbUrl: imgs[0]?.url ?? null,
        createdAt: serverTimestamp(),
        sellerUid: auth.currentUser.uid,
      });
      navigate(`/app/market/${itemId}`);
    } catch (err) {
      console.error('[NewItem] submit failed', err);
      alert('등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-screen-sm mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">상품 등록</h1>

      {/* 미리보기 그리드 */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previews.map((src, i) => (
            <img key={i} src={src} alt={`미리보기 ${i + 1}`} className="w-full h-28 object-cover rounded border" />
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="상품명"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="w-full border rounded px-3 py-2"
          type="number"
          placeholder="가격"
          value={price}
          onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
        />

        <div className="flex gap-2">
          <select className="border rounded px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>전체</option>
            <option>축구화</option>
            <option>유니폼</option>
            <option>공</option>
            <option>기타</option>
          </select>
          <input
            className="border rounded px-3 py-2"
            placeholder="지역 (예: KR)"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          />
        </div>

        <textarea
          className="w-full border rounded px-3 py-2 min-h-28"
          placeholder="설명"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple                      // ✅ 여러 장 선택
          onChange={onPickFiles}
        />

        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            disabled={submitting}
            type="submit"
          >
            {submitting ? '등록 중…' : '등록'}
          </button>
          <button type="button" className="px-4 py-2 rounded border" onClick={() => history.back()}>
            취소
          </button>
        </div>
      </form>
    </main>
  );
}