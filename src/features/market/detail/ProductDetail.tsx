import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Product } from '@/shared/types/product';
import { getProduct, uploadProductImage } from '@/features/market/services/productService';
import { useAuth } from '@/features/auth/AuthContext';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Product | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    getProduct(id).then(setItem);
  }, [id]);

  if (!id) return <main style={{ padding: 24 }}>잘못된 경로</main>;
  if (!item) return <main style={{ padding: 24 }}>로딩 중...</main>;

  const onUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        await uploadProductImage(id, file);
        const refreshed = await getProduct(id);
        setItem(refreshed);
      } catch (e) {
        console.error(e);
        alert('이미지 업로드 실패');
      }
    };
    input.click();
  };

  const isOwner = user?.uid && user.uid === item.ownerId;

  return (
    <main style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ borderRadius: 12, overflow: 'hidden', background: '#f2f2f2', aspectRatio: '1 / 1' }}>
            {item.cover
              ? <img src={item.cover} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>No Image</div>}
          </div>

          {(item.images?.length ?? 0) > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {item.images!.map((im, idx) => (
                <img key={idx} src={im.url} alt={`img${idx}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
              ))}
            </div>
          )}
        </div>

        <div>
          <h1>{item.title}</h1>
          {typeof item.price === 'number' && <h2 style={{ marginTop: 8 }}>{item.price.toLocaleString()} 원</h2>}
          {item.category && <div style={{ color: '#666' }}>카테고리: {item.category}</div>}
          {item.dong && <div style={{ color: '#666' }}>지역: {item.dong}</div>}
          {item.desc && <p style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>{item.desc}</p>}

          {isOwner && (
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button data-voice-action="upload" onClick={onUpload}>이미지 추가하기</button>
              {/* 추후: 편집/삭제 버튼 */}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}