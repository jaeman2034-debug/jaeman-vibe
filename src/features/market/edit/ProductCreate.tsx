import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProductWithOptionalImage } from '@/features/market/services/productService';
import { analyzeImage, getFieldLockStatus, applyAISuggestions } from '@/features/ai/aiProvider';
import { useAuth } from '@/features/auth/AuthContext';
import ImageUploader, { UploadedImage } from '@/features/images/components/ImageUploader';
import ImageGallery from '@/features/images/components/ImageGallery';

export default function ProductCreate() {
  const nav = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [desc, setDesc] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [coverImageId, setCoverImageId] = useState<string>('');
  const [autoMode, setAutoMode] = useState(false);
  const [userModifiedFields] = useState(new Set<string>());
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const canSave = useMemo(() => user && !!title, [user, title]);

  if (!user) return <main style={{ padding: 24 }}>ë¡œê·¸???„ìš”</main>;

  const onImagesChange = async (newImages: UploadedImage[]) => {
    setImages(newImages);
    
    // ì²?ë²ˆì§¸ ?´ë?ì§€ê°€ ì»¤ë²„ ?´ë?ì§€ê°€ ?˜ë„ë¡??¤ì •
    if (newImages.length > 0 && !coverImageId) {
      setCoverImageId(newImages[0].id);
    }
    
    // ?ë™ëª¨ë“œê°€ ì¼œì ¸?ˆê³  ì²?ë²ˆì§¸ ?´ë?ì§€ê°€ ?ˆìœ¼ë©?AI ë¶„ì„ ?¤í–‰
    if (autoMode && newImages.length > 0) {
      try {
        // ì²?ë²ˆì§¸ ?´ë?ì§€ë¡?AI ë¶„ì„ (?¤ì œë¡œëŠ” File ê°ì²´ê°€ ?„ìš”?˜ë?ë¡?URL?ì„œ fetch)
        const response = await fetch(newImages[0].url);
        const blob = await response.blob();
        const file = new File([blob], newImages[0].name, { type: newImages[0].url.split(';')[0].split(':')[1] });
        
        const result = await analyzeImage(file);
        setAiAnalysis(result);
        
        // ?„ë“œ ? ê¸ˆ ?íƒœ ?•ì¸
        const fieldLocks = getFieldLockStatus(
          { title, price: typeof price === 'number' ? price : undefined, category, desc },
          userModifiedFields
        );
        
        // AI ?œì•ˆ ?ìš© (? ê¸´ ?„ë“œ??ê±´ë“œë¦¬ì? ?ŠìŒ)
        const suggestions = applyAISuggestions(
          { title, price: typeof price === 'number' ? price : undefined, category, desc },
          result,
          fieldLocks
        );
        
        // ë¹??„ë“œ?ë§Œ ?œì•ˆ ?ìš©
        if (!title && suggestions.title) setTitle(suggestions.title);
        if (!price && suggestions.price) setPrice(suggestions.price);
        if (!category && suggestions.category) setCategory(suggestions.category);
        
      } catch (error) {
        console.error('AI ë¶„ì„ ?¤íŒ¨:', error);
      }
    } else if (newImages.length === 0) {
      setAiAnalysis(null);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    try {
      const id = await createProductWithOptionalImage({
        title,
        price: typeof price === 'number' ? price : undefined,
        category: category || undefined,
        desc: desc || undefined,
        ownerId: user.uid,
        images: images.map(img => img.url),
        coverImageUrl: images.find(img => img.id === coverImageId)?.url || images[0]?.url
      }, null);
      nav(`/product/${id}`);
    } catch (e) {
      console.error(e);
      alert('?±ë¡ ?¤íŒ¨');
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1>???í’ˆ ?±ë¡</h1>
      <p style={{ color: '#666' }}>
        {autoMode ? 
          '?ë™ëª¨ë“œ ON: ?¬ì§„ ? íƒ ??AIê°€ ë¹??„ë“œë¥??ë™?¼ë¡œ ì±„ì›?ˆë‹¤.' :
          '?ë™ëª¨ë“œ OFF: ?¬ì§„ ? íƒ ???„ë¦¬ë·°ë§Œ ?œì‹œ?©ë‹ˆ??'
        }
      </p>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        {/* ?ë™ëª¨ë“œ ? ê? */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label>
            <input
              type="checkbox"
              checked={autoMode}
              onChange={(e) => setAutoMode(e.target.checked)}
            />
            AI ?ë™ëª¨ë“œ
          </label>
          {aiAnalysis && (
            <span style={{ color: '#666', fontSize: 14 }}>
              AI ? ë¢°?? {(aiAnalysis.confidence * 100).toFixed(0)}%
            </span>
          )}
        </div>

        {/* ?´ë?ì§€ ?…ë¡œ??*/}
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            ?´ë?ì§€
          </label>
          <ImageUploader
            onImagesChange={onImagesChange}
            maxImages={10}
            maxSizeMB={5}
          />
          
          {/* ?´ë?ì§€ ê°¤ëŸ¬ë¦?*/}
          {images.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <ImageGallery
                images={images}
                onImagesChange={onImagesChange}
                onCoverChange={(coverImage) => setCoverImageId(coverImage.id)}
                coverImageId={coverImageId}
                maxImages={10}
              />
            </div>
          )}
        </div>

        <input 
          placeholder="?œëª©" 
          value={title} 
          onChange={e => {
            setTitle(e.target.value);
            userModifiedFields.add('title');
          }} 
          required 
        />
        <input 
          placeholder="ê°€ê²???" 
          type="number"
          value={price as any} 
          onChange={e => {
            setPrice(e.target.value ? Number(e.target.value) : '');
            userModifiedFields.add('price');
          }} 
        />
        <input 
          placeholder="ì¹´í…Œê³ ë¦¬" 
          value={category} 
          onChange={e => {
            setCategory(e.target.value);
            userModifiedFields.add('category');
          }} 
        />
        <textarea 
          placeholder="?¤ëª…" 
          rows={5} 
          value={desc} 
          onChange={e => {
            setDesc(e.target.value);
            userModifiedFields.add('desc');
          }} 
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={!canSave}>?±ë¡</button>
          <button type="button" onClick={() => nav(-1)}>ì·¨ì†Œ</button>
        </div>
      </form>
    </main>
  );
}
