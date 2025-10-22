import { useState, useCallback, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase'; // ???¨ì¼ ì§„ì…???¬ìš©

export interface UploadedImage {
  id: string;
  url: string;
  path: string;
  name: string;
  size: number;
  uploadedAt: Date;
}

interface ImageUploaderProps {
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  acceptedTypes?: string[];
  maxSizeMB?: number;
}

export default function ImageUploader({ 
  onImagesChange, 
  maxImages = 10, 
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  maxSizeMB = 5
}: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return 'ì§€?í•˜ì§€ ?ŠëŠ” ?Œì¼ ?•ì‹?…ë‹ˆ??';
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `?Œì¼ ?¬ê¸°??${maxSizeMB}MB ?´í•˜?¬ì•¼ ?©ë‹ˆ??`;
    }
    return null;
  };

  const uploadImage = useCallback(async (file: File): Promise<UploadedImage> => {
    const error = validateFile(file);
    if (error) throw new Error(error);

    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name.replace(/[^\w.\-]/g, '_')}`;
    const path = `uploads/${timestamp}/${fileName}`;
    
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(prev => ({ ...prev, [fileName]: progress }));
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            const uploadedImage: UploadedImage = {
              id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
              url,
              path,
              name: file.name,
              size: file.size,
              uploadedAt: new Date()
            };
            resolve(uploadedImage);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  });

  const handleFiles = useCallback(async (files: FileList) => {
    if (files.length === 0) return;
    
    setUploading(true);
    const fileArray = Array.from(files);
    
    try {
      const uploadPromises = fileArray.map(uploadImage);
      const uploadedImages = await Promise.all(uploadPromises);
      
      onImagesChange(uploadedImages);
    } catch (error) {
      console.error('?´ë?ì§€ ?…ë¡œ???¤íŒ¨:', error);
      alert('?´ë?ì§€ ?…ë¡œ?œì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.');
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  }, [uploadImage, onImagesChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div
      style={{
        border: `2px dashed ${isDragOver ? '#007bff' : '#ddd'}`,
        borderRadius: 8,
        padding: 24,
        textAlign: 'center',
        backgroundColor: isDragOver ? '#f8f9ff' : '#f8f9fa',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <div style={{ fontSize: 48, marginBottom: 16 }}>?“¸</div>
      
      {uploading ? (
        <div>
          <div style={{ marginBottom: 8 }}>?…ë¡œ??ì¤?..</div>
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 12, marginBottom: 2 }}>{fileName}</div>
              <div style={{ 
                width: '100%', 
                height: 4, 
                backgroundColor: '#e9ecef', 
                borderRadius: 2 
              }}>
                <div style={{ 
                  width: `${progress}%`, 
                  height: '100%', 
                  backgroundColor: '#007bff', 
                  borderRadius: 2,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            ?´ë?ì§€ë¥??¬ê¸°???œë˜ê·¸í•˜ê±°ë‚˜ ?´ë¦­?˜ì„¸??
          </div>
          <div style={{ color: '#666', fontSize: 14 }}>
            ìµœë? {maxImages}ê°? {maxSizeMB}MB ?´í•˜
          </div>
          <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
            {acceptedTypes.map(type => type.split('/')[1]).join(', ')} ?•ì‹ ì§€??
          </div>
        </div>
      )}
    </div>
  );
}
