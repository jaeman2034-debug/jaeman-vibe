// 배경 제거 유틸리티
// @imgly/background-removal을 동적 import로 사용

export interface BackgroundRemovalOptions {
  quality?: number; // 0.1 ~ 1.0
  outputFormat?: 'image/png' | 'image/jpeg' | 'image/webp';
  outputSize?: {
    width: number;
    height: number;
  };
}

export interface BackgroundRemovalResult {
  success: boolean;
  dataUrl?: string;
  blob?: Blob;
  error?: string;
  processingTime?: number;
}

// 배경 제거 라이브러리 동적 로드
let backgroundRemovalModule: any = null;

const loadBackgroundRemovalModule = async () => {
  if (backgroundRemovalModule) {
    return backgroundRemovalModule;
  }

  try {
    // 동적 import로 배경 제거 라이브러리 로드
    const module = await import('@imgly/background-removal');
    backgroundRemovalModule = module;
    return module;
  } catch (error) {
    console.error('배경 제거 라이브러리 로드 실패:', error);
    throw new Error('배경 제거 기능을 사용할 수 없습니다.');
  }
};

// File을 dataURL로 변환
const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// dataURL을 Blob으로 변환
const dataURLToBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
};

// 이미지 품질 점수 계산 (간단한 휴리스틱)
export const calculateImageQuality = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let totalBrightness = 0;
      let totalContrast = 0;
      let edgeCount = 0;
      
      // 밝기와 대비 계산
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        const brightness = (r + g + b) / 3;
        totalBrightness += brightness;
        
        // 간단한 엣지 감지
        if (i > 0 && i < data.length - 4) {
          const prevBrightness = (data[i - 4] + data[i - 3] + data[i - 2]) / 3;
          const contrast = Math.abs(brightness - prevBrightness);
          totalContrast += contrast;
          
          if (contrast > 30) {
            edgeCount++;
          }
        }
      }
      
      const avgBrightness = totalBrightness / (data.length / 4);
      const avgContrast = totalContrast / (data.length / 4);
      const edgeDensity = edgeCount / (data.length / 4);
      
      // 품질 점수 계산 (0-100)
      let quality = 0;
      
      // 밝기 점수 (20점)
      if (avgBrightness > 50 && avgBrightness < 200) {
        quality += 20;
      } else if (avgBrightness > 30 && avgBrightness < 220) {
        quality += 15;
      } else {
        quality += 10;
      }
      
      // 대비 점수 (30점)
      if (avgContrast > 20) {
        quality += 30;
      } else if (avgContrast > 10) {
        quality += 20;
      } else {
        quality += 10;
      }
      
      // 엣지 밀도 점수 (30점)
      if (edgeDensity > 0.1) {
        quality += 30;
      } else if (edgeDensity > 0.05) {
        quality += 20;
      } else {
        quality += 10;
      }
      
      // 파일 크기 점수 (20점)
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 0.5 && fileSizeMB < 5) {
        quality += 20;
      } else if (fileSizeMB > 0.1 && fileSizeMB < 10) {
        quality += 15;
      } else {
        quality += 10;
      }
      
      resolve(Math.min(100, Math.max(0, quality)));
    };
    
    img.onerror = () => resolve(0);
    img.src = URL.createObjectURL(file);
  });
};

// 배경 제거 실행
export const removeBackground = async (
  file: File,
  options: BackgroundRemovalOptions = {}
): Promise<BackgroundRemovalResult> => {
  const startTime = Date.now();
  
  try {
    // 배경 제거 라이브러리 로드
    const module = await loadBackgroundRemovalModule();
    
    // 기본 옵션 설정
    const defaultOptions = {
      quality: 0.8,
      outputFormat: 'image/png' as const,
      ...options
    };
    
    // File을 dataURL로 변환
    const dataURL = await fileToDataURL(file);
    
    // 배경 제거 실행
    const result = await module.removeBackground(dataURL, {
      output: {
        format: defaultOptions.outputFormat,
        quality: defaultOptions.quality
      }
    });
    
    // 결과를 Blob으로 변환
    const blob = dataURLToBlob(result);
    
    const processingTime = Date.now() - startTime;
    
    return {
      success: true,
      dataUrl: result,
      blob,
      processingTime
    };
    
  } catch (error: any) {
    console.error('배경 제거 실패:', error);
    
    return {
      success: false,
      error: error.message || '배경 제거에 실패했습니다.',
      processingTime: Date.now() - startTime
    };
  }
};

// 배경 제거 + 리사이즈 통합 함수
export const removeBackgroundAndResize = async (
  file: File,
  backgroundOptions: BackgroundRemovalOptions = {},
  resizeOptions: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<BackgroundRemovalResult> => {
  try {
    // 배경 제거 실행
    const removalResult = await removeBackground(file, backgroundOptions);
    
    if (!removalResult.success || !removalResult.blob) {
      return removalResult;
    }
    
    // Blob을 File로 변환
    const processedFile = new File([removalResult.blob], file.name, {
      type: removalResult.blob.type
    });
    
    // 리사이즈 유틸리티 import 및 실행
    const { resizeImage } = await import('./imageUtils');
    
    const resizedFile = await resizeImage(
      processedFile,
      resizeOptions.maxWidth || 1600,
      resizeOptions.maxHeight || 1600,
      resizeOptions.quality || 0.86
    );
    
    // 최종 결과 반환
    return {
      success: true,
      dataUrl: removalResult.dataUrl,
      blob: resizedFile,
      processingTime: removalResult.processingTime
    };
    
  } catch (error: any) {
    console.error('배경 제거 + 리사이즈 실패:', error);
    
    return {
      success: false,
      error: error.message || '이미지 처리에 실패했습니다.'
    };
  }
};

// 배경 제거 가능 여부 확인
export const isBackgroundRemovalAvailable = async (): Promise<boolean> => {
  try {
    await loadBackgroundRemovalModule();
    return true;
  } catch {
    return false;
  }
};

// 배경 제거 옵션 프리셋
export const BACKGROUND_REMOVAL_PRESETS = {
  fast: {
    quality: 0.6,
    outputFormat: 'image/jpeg' as const
  },
  balanced: {
    quality: 0.8,
    outputFormat: 'image/png' as const
  },
  high: {
    quality: 0.95,
    outputFormat: 'image/png' as const
  }
} as const;

// 배경 제거 진행률 콜백 타입
export type ProgressCallback = (progress: number) => void;

// 배경 제거 진행률 포함 함수
export const removeBackgroundWithProgress = async (
  file: File,
  options: BackgroundRemovalOptions = {},
  onProgress?: ProgressCallback
): Promise<BackgroundRemovalResult> => {
  if (onProgress) {
    onProgress(0);
  }
  
  try {
    // 배경 제거 실행
    const result = await removeBackground(file, options);
    
    if (onProgress) {
      onProgress(100);
    }
    
    return result;
    
  } catch (error: any) {
    if (onProgress) {
      onProgress(0);
    }
    
    return {
      success: false,
      error: error.message || '배경 제거에 실패했습니다.'
    };
  }
}; 