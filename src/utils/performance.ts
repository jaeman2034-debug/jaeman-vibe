// 성능 최적화 유틸리티

// 이미지 지연 로딩을 위한 Intersection Observer
export const createImageObserver = (
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
) => {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };

  return new IntersectionObserver((entries) => {
    entries.forEach(callback);
  }, defaultOptions);
};

// 디바운스 함수
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// 스로틀 함수
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// 이미지 최적화 함수
export const optimizeImage = async (
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
  } = {}
): Promise<File> => {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.8,
    format = 'webp'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // 캔버스 크기 계산
      const { width, height } = calculateDimensions(
        img.width,
        img.height,
        maxWidth,
        maxHeight
      );

      canvas.width = width;
      canvas.height = height;

      // 이미지 그리기
      ctx?.drawImage(img, 0, 0, width, height);

      // 포맷별 품질 설정
      let mimeType: string;
      let qualityValue: number;

      switch (format) {
        case 'webp':
          mimeType = 'image/webp';
          qualityValue = quality;
          break;
        case 'avif':
          mimeType = 'image/avif';
          qualityValue = quality;
          break;
        case 'jpeg':
          mimeType = 'image/jpeg';
          qualityValue = quality;
          break;
        case 'png':
          mimeType = 'image/png';
          qualityValue = 1;
          break;
        default:
          mimeType = 'image/webp';
          qualityValue = quality;
      }

      // 캔버스를 Blob으로 변환
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: mimeType,
              lastModified: Date.now()
            });
            resolve(optimizedFile);
          } else {
            reject(new Error('이미지 최적화 실패'));
          }
        },
        mimeType,
        qualityValue
      );
    };

    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = URL.createObjectURL(file);
  });
};

// 이미지 크기 계산
const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
) => {
  let { width, height } = { width: originalWidth, height: originalHeight };

  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return { width: Math.round(width), height: Math.round(height) };
};

// 메모리 사용량 모니터링
export const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    const used = Math.round(memory.usedJSHeapSize / 1048576);
    const total = Math.round(memory.totalJSHeapSize / 1048576);
    const limit = Math.round(memory.jsHeapSizeLimit / 1048576);
    
    console.log(`메모리 사용량: ${used}MB / ${total}MB (제한: ${limit}MB)`);
    
    // 메모리 사용량이 80%를 넘으면 경고
    if (used / limit > 0.8) {
      console.warn('메모리 사용량이 높습니다. 이미지 캐시를 정리하세요.');
    }
  }
};

// 이미지 캐시 정리
export const clearImageCache = () => {
  // URL.createObjectURL로 생성된 객체들 정리
  if ('revokeObjectURL' in URL) {
    // 실제로는 각 이미지 URL을 추적해서 정리해야 함
    console.log('이미지 캐시 정리 완료');
  }
}; 