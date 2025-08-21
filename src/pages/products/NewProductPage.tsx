import { useState } from 'react';
import { addDoc, collection, serverTimestamp, GeoPoint, updateDoc, doc as docRefFs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { downscaleImage } from '../../lib/image';
import AddressField, { AddressValue } from '../../components/address/AddressField';
import { geohashForLocation } from 'geofire-common';
import MultiImageUploader from '../../components/uploader/MultiImageUploader';

export default function NewProductPage() {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<string>('');
  const [category, setCategory] = useState('');
  const [desc, setDesc] = useState('');
  const [loc, setLoc] = useState<AddressValue | null>(null);
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<number>(0);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return alert('제목을 입력하세요');
    if (!loc) return alert('거래 위치를 선택하세요');
    setSaving(true);
    try {
      const payload: any = {
        title,
        price: price ? Number(price) : 0,
        category,
        description: desc,
        address: loc.address,
        location: new GeoPoint(loc.lat, loc.lng),
        region: loc.region ?? null,
        geohash: geohashForLocation([loc.lat, loc.lng]),
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, 'products'), payload);

      // 이미지가 있으면 업로드 → downloadURL 저장
      let urls: string[] = [];
      let done = 0, totalFiles = files.length;
      for (let i=0; i<files.length; i++) {
        const f = files[i];
        // 다운스케일/압축
        const blob = await downscaleImage(f, 1280, 0.85);
        const sref = ref(storage, `products/${docRef.id}/img-${Date.now()}-${i+1}.jpg`);
        const task = uploadBytesResumable(sref, blob, { contentType: 'image/jpeg' });
        await new Promise<void>((resolve, reject) => {
          task.on('state_changed', (snap) => {
            const p = snap.bytesTransferred / snap.totalBytes;
            const overall = ((done + p) / totalFiles) * 100;
            setProgress(Math.round(overall));
          }, reject, async () => {
            done += 1;
            const url = await getDownloadURL(task.snapshot.ref);
            urls.push(url);
            setProgress(Math.round((done/totalFiles)*100));
            resolve();
          });
        });
      }

      if (urls.length) {
        await updateDoc(docRefFs(db, 'products', docRef.id), {
          images: urls,
          thumbnail: urls[0],
        });
      }

      alert('등록 완료!');
      setTitle(''); setPrice(''); setCategory(''); setDesc(''); setLoc(null); setFiles([]); setProgress(0);
    } catch (e:any) {
      alert('등록 실패: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{maxWidth:800, margin:'24px auto', display:'grid', gap:16}}>
      <h2>상품 등록</h2>
      <form onSubmit={onSubmit} style={{display:'grid', gap:12}}>
        <div>
          <label>제목</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} style={{width:'100%', padding:'8px 12px'}} />
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          <div>
            <label>가격</label>
            <input type="number" value={price} onChange={e=>setPrice(e.target.value)} style={{width:'100%', padding:'8px 12px'}} />
          </div>
          <div>
            <label>카테고리</label>
            <input value={category} onChange={e=>setCategory(e.target.value)} style={{width:'100%', padding:'8px 12px'}} />
          </div>
        </div>
        <div>
          <label>이미지(최대 6장, 1번이 썸네일)</label>
          <MultiImageUploader max={6} onChange={setFiles} />
        </div>
        <div>
          <label>설명</label>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={5} style={{width:'100%', padding:'8px 12px'}} />
        </div>

        <AddressField value={loc} onChange={setLoc} />

        {progress > 0 && progress < 100 && (
          <div style={{height:8, background:'#eee', borderRadius:6}}>
            <div style={{width:`${progress}%`, height:'100%', background:'#3b82f6', borderRadius:6}}/>
          </div>
        )}
        <button type="submit" disabled={saving} style={{padding:'10px 14px', fontWeight:600}}>
          {saving ? '등록 중...' : '등록하기'}
        </button>
      </form>
    </div>
  );
}
