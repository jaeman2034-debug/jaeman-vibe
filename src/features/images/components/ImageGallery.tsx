import { useState, useCallback } from 'react';
import { deleteObject } from 'firebase/storage';
import { ref } from 'firebase/storage';
import { storage } from '@/lib/firebase'; // ???�일 진입???�용
import { UploadedImage } from './ImageUploader';

interface ImageGalleryProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  onCoverChange?: (coverImage: UploadedImage) => void;
  coverImageId?: string;
  maxImages?: number;
}

export default function ImageGallery({ 
  images, 
  onImagesChange, 
  onCoverChange,
  coverImageId,
  maxImages = 10
}: ImageGalleryProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    
    const newImages = [...images];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    
    onImagesChange(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [images, draggedIndex, onImagesChange]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDelete = useCallback(async (image: UploadedImage, index: number) => {
    if (!confirm('???��?지�???��?�시겠습?�까?')) return;
    
    try {
      // Firebase Storage?�서 ??��
      const storageRef = ref(storage, image.path);
      await deleteObject(storageRef);
      
      // 로컬 ?�태?�서 ?�거
      const newImages = images.filter((_, i) => i !== index);
      onImagesChange(newImages);
      
      // 커버 ?��?지?�?�면 �?번째 ?��?지�?커버�??�정
      if (coverImageId === image.id && newImages.length > 0 && onCoverChange) {
        onCoverChange(newImages[0]);
      }
    } catch (error) {
      console.error('?��?지 ??�� ?�패:', error);
      alert('?��?지 ??��???�패?�습?�다.');
    }
  }, [images, coverImageId, onCoverChange, onImagesChange]);

  const handleSetCover = useCallback((image: UploadedImage) => {
    if (onCoverChange) {
      onCoverChange(image);
    }
  }, [onCoverChange]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (images.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: 40, 
        color: '#666',
        border: '1px dashed #ddd',
        borderRadius: 8
      }}>
        ?�로?�된 ?��?지가 ?�습?�다
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
        gap: 16 
      }}>
        {images.map((image, index) => (
          <div
            key={image.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            style={{
              position: 'relative',
              border: `2px solid ${dragOverIndex === index ? '#007bff' : '#eee'}`,
              borderRadius: 8,
              overflow: 'hidden',
              cursor: 'grab',
              opacity: draggedIndex === index ? 0.5 : 1,
              transform: dragOverIndex === index ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.2s ease'
            }}
          >
            {/* 커버 ?�시 */}
            {coverImageId === image.id && (
              <div style={{
                position: 'absolute',
                top: 8,
                left: 8,
                background: '#007bff',
                color: 'white',
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                zIndex: 10
              }}>
                커버
              </div>
            )}
            
            {/* ?��?지 */}
            <img
              src={image.url}
              alt={image.name}
              style={{
                width: '100%',
                height: 200,
                objectFit: 'cover',
                display: 'block'
              }}
            />
            
            {/* ?��?지 ?�보 */}
            <div style={{ padding: 12 }}>
              <div style={{ 
                fontSize: 14, 
                fontWeight: 600, 
                marginBottom: 4,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {image.name}
              </div>
              <div style={{ 
                fontSize: 12, 
                color: '#666', 
                marginBottom: 8 
              }}>
                {formatFileSize(image.size)}
              </div>
              
              {/* ?�션 버튼??*/}
              <div style={{ display: 'flex', gap: 8 }}>
                {coverImageId !== image.id && (
                  <button
                    onClick={() => handleSetCover(image)}
                    style={{
                      padding: '4px 8px',
                      fontSize: 12,
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    커버�?
                  </button>
                )}
                
                <button
                  onClick={() => handleDelete(image, index)}
                  style={{
                    padding: '4px 8px',
                    fontSize: 12,
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  ??��
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* ?��?지 개수 ?�시 */}
      <div style={{ 
        fontSize: 14, 
        color: '#666', 
        textAlign: 'center' 
      }}>
        {images.length} / {maxImages} ?��?지
      </div>
    </div>
  );
}
