import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProduct } from '../features/market/productService';
import type { ProductInput } from '../features/market/types';

const CATEGORIES = ['축구화','유니폼','보호대','볼','의류','야구','농구','테니스','골프','기타'];
const box: React.CSSProperties = { maxWidth: 720, margin: '24px auto', padding: 16 };
const label: React.CSSProperties = { fontSize: 13, color: '#555', marginTop: 10 };
const row: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' };

export default function MarketNew() {
  const nav = useNavigate();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [condition, setCondition] = useState<'new'|'like-new'|'used'>('used');
  const [priceText, setPriceText] = useState('');
  const price = useMemo(() => Number(priceText.replace(/[^\d]/g, '')) || 0, [priceText]);

  const [desc, setDesc] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files ? Array.from(e.target.files) : [];
    if (!list.length) return;
    const merged = [...files, ...list].slice(0, 10);
    setFiles(merged);
    e.target.value = '';
  }
  function removeAt(i: number) { setFiles(prev => prev.filter((_, idx) => idx !== i)); }

  function validate(): string | null {
    if (!title.trim()) return '제목을 입력해 주세요.';
    if (price <= 0) return '가격을 입력해 주세요.';
    if (!files.length) return '이미지를 한 장 이상 첨부해 주세요.';
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    const v = validate(); if (v) { setErr(v); return; }

    const input: ProductInput = { title, category, condition, price, description: desc, images: files };
    try {
      setBusy(true);
      await createProduct(input);
      alert('등록되었습니다!');
      nav('/market');
    } catch (e: any) {
      setErr(e?.message || '등록 중 오류가 발생했습니다.');
    } finally { setBusy(false); }
  }

  return (
    <div style={box}>
      <h2>상품 등록</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
        <div style={label}>사진 (최대 10장)</div>
        <div style={{ border: '1px dashed #bbb', borderRadius: 10, padding: 12, display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <label style={{ border:'1px solid #ddd', borderRadius:8, padding:'8px 12px', background:'#f8f8f8', cursor:'pointer' }}>
            + 이미지 추가
            <input type="file" accept="image/*" multiple hidden onChange={onPick}/>
          </label>
          {files.map((f, i) => (
            <div key={i} style={{ position:'relative' }}>
              <img src={URL.createObjectURL(f)} alt="" width={96} height={96}
                   style={{objectFit:'cover', borderRadius:8, border:'1px solid #eee'}} />
              <button type="button" onClick={()=>removeAt(i)}
                style={{ position:'absolute', right:-8, top:-8, background:'#fff', border:'1px solid #ddd', borderRadius:999, width:22, height:22, cursor:'pointer' }}>
                ×
              </button>
            </div>
          ))}
        </div>

        <div style={label}>제목</div>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="예: 나이키 팬텀 GX 275mm" />

        <div style={label}>카테고리 / 상태</div>
        <div style={row}>
          <select value={category} onChange={e=>setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={condition} onChange={e=>setCondition(e.target.value as any)}>
            <option value="new">새상품</option>
            <option value="like-new">사용감 적음</option>
            <option value="used">중고</option>
          </select>
        </div>

        <div style={label}>가격(원)</div>
        <input
          inputMode="numeric"
          value={priceText}
          onChange={e=>{
            const raw = e.target.value.replace(/[^\d]/g, '');
            const withComma = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            setPriceText(withComma);
          }}
          placeholder="예: 35,000"
        />

        <div style={label}>설명</div>
        <textarea rows={5} value={desc} onChange={e=>setDesc(e.target.value)}
                  placeholder="상세 상태, 사이즈, 거래 희망 위치 등을 입력해 주세요."/>

        {err && <div style={{ color: 'crimson' }}>{err}</div>}
        <button disabled={busy} type="submit" style={{ padding:'10px 14px', borderRadius:8 }}>
          {busy ? '등록 중…' : '등록하기'}
        </button>
      </form>
      <p style={{fontSize:12, color:'#777', marginTop:8}}>
        * 업로드 시 로그인된 계정으로 Firestore/Storage에 저장됩니다.
      </p>
    </div>
  );
} 