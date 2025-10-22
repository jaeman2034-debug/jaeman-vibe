import { useState, useCallback } from 'react';
import { deleteObject, ref } from 'firebase/firestore';
import { storage } from '@/lib/firebase'; // ???¨ì¼ ì§„ìž…???¬ìš©
import { updateProduct } from '@/features/market/services/productService';
import type { Product, ProductImage } from '@/shared/types/product';
import ImageGallery from './ImageGallery';

interface ProductImagesManagerProps {
  product: Product;
  onProductUpdate: (updatedProduct: Product) => void;
  ownerId: string;
}

export default function ProductImagesManager({ 
  product, 
  onProductUpdate, 
  ownerId 
}: ProductImagesManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [images, setImages] = useState<ProductImage[]>(product.images || []);
  const [coverImage, setCoverImage] = useState<string>(product.cover || '');

  const handleImagesChange = useCallback(async (newImages: ProductImage[]) => {
    setImages(newImages);
    
    // ?í’ˆ ?…ë°?´íŠ¸
    const updatedProduct = {
      ...product,
      images: newImages,
      cover: newImages.length > 0 ? newImages[0].url : '',
      hasImages: newImages.length > 0
    };
    
    try {
      await updateProduct(product.id, updatedProduct);
      onProductUpdate(updatedProduct);
    } catch (error) {
      console.error('?´ë?ì§€ ?œì„œ ë³€ê²??¤íŒ¨:', error);
      alert('?´ë?ì§€ ?œì„œ ë³€ê²½ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.');
    }
  }, [product, onProductUpdate]);

  const handleCoverChange = useCallback(async (coverImage: ProductImage) => {
    setCoverImage(coverImage.url);
    
    try {
      await updateProduct(product.id, { cover: coverImage.url });
      onProductUpdate({ ...product, cover: coverImage.url });
    } catch (error) {
      console.error('ì»¤ë²„ ?´ë?ì§€ ë³€ê²??¤íŒ¨:', error);
      alert('ì»¤ë²„ ?´ë?ì§€ ë³€ê²½ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.');
    }
  }, [product, onProductUpdate]);

  const handleDeleteImage = useCallback(async (image: ProductImage, index: number) => {
    if (!confirm('???´ë?ì§€ë¥??? œ?˜ì‹œê² ìŠµ?ˆê¹Œ?')) return;
    
    try {
      // Firebase Storage?ì„œ ?? œ
      const storageRef = ref(storage, image.path);
      await deleteObject(storageRef);
      
      // ë¡œì»¬ ?íƒœ?ì„œ ?œê±°
      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
      
      // ì»¤ë²„ ?´ë?ì§€?€?¤ë©´ ì²?ë²ˆì§¸ ?´ë?ì§€ë¥?ì»¤ë²„ë¡??¤ì •
      if (coverImage === image.url && newImages.length > 0) {
        setCoverImage(newImages[0].url);
        await updateProduct(product.id, { 
          images: newImages, 
          cover: newImages[0].url,
          hasImages: newImages.length > 0
        });
      } else {
        await updateProduct(product.id, { 
          images: newImages,
          hasImages: newImages.length > 0
        });
      }
      
      onProductUpdate({ 
        ...product, 
        images: newImages, 
        cover: newImages.length > 0 ? newImages[0].url : '',
        hasImages: newImages.length > 0
      });
      
    } catch (error) {
      console.error('?´ë?ì§€ ?? œ ?¤íŒ¨:', error);
      alert('?´ë?ì§€ ?? œ???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
    }
  }, [images, coverImage, product, onProductUpdate]);

  if (!isEditing) {
    return (
      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => setIsEditing(true)}
          style={{
            padding: '8px 16px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer'
          }}
        >
          ?´ë?ì§€ ê´€ë¦?
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>?´ë?ì§€ ê´€ë¦?/h3>
        <button
          onClick={() => setIsEditing(false)}
          style={{
            padding: '6px 12px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          ?„ë£Œ
        </button>
      </div>
      
      <ImageGallery
        images={images}
        onImagesChange={handleImagesChange}
        onCoverChange={handleCoverChange}
        coverImageId={images.find(img => img.url === coverImage)?.path || ''}
        maxImages={10}
        onDelete={handleDeleteImage}
      />
      
      <div style={{ marginTop: 16, fontSize: 14, color: '#666' }}>
        ?’¡ ?œëž˜ê·????œë¡­?¼ë¡œ ?œì„œë¥?ë³€ê²½í•˜ê³? ì»¤ë²„ ?´ë?ì§€ë¥??¤ì •?????ˆìŠµ?ˆë‹¤.
      </div>
    </div>
  );
}
