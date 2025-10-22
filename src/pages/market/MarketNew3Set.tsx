import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MarketNew3Set() {
  const nav = useNavigate();

  // === form state ===
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [category, setCategory] = useState<'축구화'|'유니폼'|'공'|'기타'>('기타');
  const [status, setStatus] = useState<'selling'|'reserved'|'soldout'>('selling');
  const [dongCode, setDongCode] = useState('KR-41411560'); // 기본값
  const [desc, setDesc] = useState('');
  const [published, setPublished] = useState(true);

  // === file state ===
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [progress, setProgress] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const canSubmit = useMemo(() => {
    if (!title || title.trim().length < 2) return false;
    if (price === '' || Number(price) <= 0) return false;
    if (!dongCode || dongCode.trim().length < 4) return false;
    return true;
  }, [title, price, dongCode]);

  // 파일 선택
  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    setFiles(list);
    setPreviews(list.map((f) => URL.createObjectURL(f)));
    setProgress(list.map(() => 0));
  };

  const removeOne = (idx: number) => {
    setFiles((arr) => arr.filter((_, i) => i !== idx));
    setPreviews((arr) => arr.filter((_, i) => i !== idx));
    setProgress((arr) => arr.filter((_, i) => i !== idx));
  };

  // === submit ===
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);

    try {
      const { serverTimestamp, addDoc, collection, doc, updateDoc } = (window as any).fs;
      const db = (window as any).db;
      const auth = (window as any).auth;
      const storage = (window as any).storage;

      if (!auth?.currentUser?.uid) {
        alert('로그인이 필요합니다.');
        setSubmitting(false);
        return;
      }

      // 1) 문서 먼저 생성(이미지 경로에 docId가 필요)
      const docRef = await addDoc(collection(db, 'market'), {
        title: title.trim(),
        price: Number(price),
        category,
        status,
        dongCode: dongCode.trim(),
        district: '',               // 필요시 지역명 별도 저장
        country: 'KR',              // 예시
        description: desc.trim(),
        images: [],                 // 공개 URL 배열
        photos: [],                 // 상세 정보 배열
        published,
        sellerUid: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2) 파일 업로드 → URL 수집
      const urls: { url: string; path: string; name: string; size: number }[] = [];
      if (files.length > 0) {
        const { ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');

        // 순차 업로드(진행률 표시 안정적)
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          const path = `market/${auth.currentUser.uid}/${docRef.id}/${i}-${Date.now()}-${f.name}`;
          const storageRef = ref(storage, path);
          const task = uploadBytesResumable(storageRef, f);

          // 진행률
          await new Promise<void>((resolve, reject) => {
            task.on(
              'state_changed',
              (snap) => {
                const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                setProgress((prev) => {
                  const next = [...prev];
                  next[i] = pct;
                  return next;
                });
              },
              reject,
              async () => {
                const url = await getDownloadURL(task.snapshot.ref);
                urls.push({ url, path, name: f.name, size: f.size });
                resolve();
              }
            );
          });
        }
      }

      // 3) 이미지 정보 문서에 반영
      if (urls.length > 0) {
        await updateDoc(docRef, {
          images: urls.map(u => u.url),  // 공개 URL 배열
          photos: urls,                  // 상세 정보 배열
          updatedAt: (window as any).fs.serverTimestamp(),
        });
      }

      // 4) 상세 페이지로 이동
      nav(`/market/${docRef.id}`, { replace: true });
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? '등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-xl mx-auto p-4 space-y-3">
      <h1 className="text-xl font-bold mb-2">상품 등록</h1>

      <input className="w-full border p-2 rounded"
             placeholder="제목"
             value={title} onChange={(e) => setTitle(e.target.value)} />

      <input className="w-full border p-2 rounded"
             type="number" placeholder="가격(원)"
             value={price} onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} />

      <div className="flex gap-2">
        <select className="border p-2 rounded" value={category} onChange={(e) => setCategory(e.target.value as any)}>
          <option value="축구화">축구화</option>
          <option value="유니폼">유니폼</option>
          <option value="공">공</option>
          <option value="기타">기타</option>
        </select>

        <select className="border p-2 rounded" value={status} onChange={(e) => setStatus(e.target.value as any)}>
          <option value="selling">판매중</option>
          <option value="reserved">예약중</option>
          <option value="soldout">판매완료</option>
        </select>
      </div>

      <input className="w-full border p-2 rounded"
             placeholder="KR-41411560 (동 코드)"
             value={dongCode} onChange={(e) => setDongCode(e.target.value)} />

      <textarea className="w-full border p-2 rounded min-h-[120px]"
                placeholder="설명" value={desc} onChange={(e) => setDesc(e.target.value)} />

      {/* 파일 업로드 */}
      <div className="space-y-2">
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={onPickFiles} />
        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative border rounded p-1">
                <img src={src} className="w-full h-24 object-cover rounded" />
                {progress[i] > 0 && (
                  <div className="text-xs mt-1">{progress[i]}%</div>
                )}
                <button type="button"
                        className="absolute -top-2 -right-2 bg-black text-white rounded-full w-6 h-6"
                        onClick={() => removeOne(i)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
        공개(published)
      </label>

      <button type="submit"
              disabled={!canSubmit || submitting}
              className="w-full bg-black text-white p-3 rounded disabled:opacity-50">
        {submitting ? '등록 중…' : '등록하기'}
      </button>
    </form>
  );
}