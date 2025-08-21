import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, storage } from '../../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import MultiImageUploader from '../../components/uploader/MultiImageUploader';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { downscaleImage } from '../../lib/image';

export default function EditProductPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<string>('');
  const [address, setAddress] = useState('');
  const [existing, setExisting] = useState<string[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, 'products', String(id)));
      if (!snap.exists()) return nav('/products/near');
      const d = snap.data() as any;
      setTitle(d.title||'');
      setPrice(String(d.price||''));
      setAddress(d.address||'');
      setExisting(Array.isArray(d.images)? d.images : (d.thumbnail?[d.thumbnail]:[]));
    })();
  }, [id]);

  const onRemoveUrl = (url:string) => setRemoved(prev => [...new Set([...prev, url])]);

  const onSave = async (e:any) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1) 삭제 목록 제거
      for (const url of removed) {
        try {
          const path = new URL(url).pathname.split('/o/')[1].split('?')[0]; // encoded path
          const fullPath = decodeURIComponent(path);
          await deleteObject(ref(storage, fullPath));
        } catch {}
      }
      let urls = existing.filter(u => !removed.includes(u));

      // 2) 새 파일 업로드 (순서대로 → 1번이 썸네일)
      for (let i=0;i<files.length;i++){
        const blob = await downscaleImage(files[i], 1280, 0.85);
        const sref = ref(storage, `products/${id}/img-${Date.now()}-${i+1}.jpg`);
        const task = uploadBytesResumable(sref, blob, { contentType:'image/jpeg' });
        await new Promise<void>((resolve,reject)=>{
          task.on('state_changed', undefined, reject, async ()=>{
            const url = await getDownloadURL(task.snapshot.ref);
            urls.push(url);
            resolve();
          });
        });
      }

      // 3) Firestore 업데이트
      await updateDoc(doc(db, 'products', String(id)), {
        title,
        price: price? Number(price):0,
        address,
        images: urls,
        thumbnail: urls[0] || null,
        updatedAt: serverTimestamp(),
      });
      alert('수정 완료');
      nav(`/products/${id}`);
    } catch (e:any) {
      alert('수정 실패: '+e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{maxWidth:800, margin:'24px auto', display:'grid', gap:16}}>
      <h2>상품 수정</h2>
      <form onSubmit={onSave} style={{display:'grid', gap:12}}>
        <div>
          <label>제목</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} style={{width:'100%', padding:'8px 12px'}}/>
        </div>
        <div>
          <label>가격</label>
          <input type="number" value={price} onChange={e=>setPrice(e.target.value)} style={{width:'100%', padding:'8px 12px'}}/>
        </div>
        <div>
          <label>주소</label>
          <input value={address} onChange={e=>setAddress(e.target.value)} style={{width:'100%', padding:'8px 12px'}}/>
        </div>
        <div>
          <label>이미지 관리</label>
          <MultiImageUploader max={10} onChange={setFiles} initialUrls={existing} onRemoveUrl={onRemoveUrl}/>
          <small style={{opacity:.7}}>기존 이미지는 위에서 삭제/재정렬, 아래에서 새 이미지 추가</small>
        </div>
        <button type="submit" disabled={saving} style={{padding:'10px 14px', fontWeight:600}}>
          {saving?'저장 중...':'저장'}
        </button>
      </form>
    </div>
  );
}
