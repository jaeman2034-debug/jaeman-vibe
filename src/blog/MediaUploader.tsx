import React, { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface MediaUploaderProps {
  clubId: string;
  postId: string;
  onUploadComplete: (url: string, type: 'image' | 'video', fileName: string) => void;
  onError?: (error: string) => void;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  url?: string;
  type: 'image' | 'video';
}

export default function MediaUploader({ clubId, postId, onUploadComplete, onError }: MediaUploaderProps) {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;

    const validFiles = Array.from(files).filter(file => {
      // MIME 타입 검증
      if (!file.type.match(/^(image|video)\//)) {
        onError?.(`${file.name}: 이미지 또는 비디오 파일만 업로드 가능합니다.`);
        return false;
      }
      // 크기 검증 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        onError?.(`${file.name}: 파일 크기는 10MB 이하여야 합니다.`);
        return false;
      }
      return true;
    });

    for (const file of validFiles) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    const fileId = crypto.randomUUID();
    const path = `clubs/${clubId}/blog/${postId}/${fileId}-${file.name}`;
    const storageRef = ref(storage, path);
    const type = file.type.startsWith("image/") ? "image" : "video";

    // 업로드 진행률 추가
    const uploadProgress: UploadProgress = {
      fileName: file.name,
      progress: 0,
      type
    };
    setUploads(prev => [...prev, uploadProgress]);

    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: { clubId, postId, fileId }
    });

    task.on("state_changed",
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploads(prev => prev.map(upload => 
          upload.fileName === file.name 
            ? { ...upload, progress }
            : upload
        ));
      },
      (error) => {
        console.error('업로드 실패:', error);
        onError?.(`${file.name} 업로드 실패: ${error.message}`);
        setUploads(prev => prev.filter(upload => upload.fileName !== file.name));
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        
        // 업로드 완료
        setUploads(prev => prev.map(upload => 
          upload.fileName === file.name 
            ? { ...upload, progress: 100, url }
            : upload
        ));

        // 콜백으로 URL 전달
        onUploadComplete(url, type, file.name);

        // 3초 후 목록에서 제거
        setTimeout(() => {
          setUploads(prev => prev.filter(upload => upload.fileName !== file.name));
        }, 3000);
      }
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* 파일 선택 영역 */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <div className="space-y-2">
          <div className="text-gray-600">
            📁 이미지/영상을 드래그하거나 클릭해서 선택하세요
          </div>
          <div className="text-sm text-gray-500">
            지원 형식: JPG, PNG, GIF, MP4, MOV (최대 10MB)
          </div>
        </div>
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {/* 업로드 진행률 */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">업로드 중...</h4>
          {uploads.map((upload) => (
            <div key={upload.fileName} className="bg-gray-50 rounded p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm truncate">{upload.fileName}</span>
                <span className="text-sm text-gray-500">{upload.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
              {upload.url && (
                <div className="mt-2 text-xs text-green-600">✅ 업로드 완료!</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
