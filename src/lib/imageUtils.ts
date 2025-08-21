/**
 * 이미지 전처리 유틸리티
 * 리사이즈, 압축, WebP 변환 등을 지원합니다.
 */

/**
 * 이미지 리사이즈 및 압축
 * @param file 원본 이미지 파일
 * @param maxW 최대 너비 (기본값: 1600px)
 * @param maxH 최대 높이 (기본값: 1600px)
 * @param q 품질 (0.0 ~ 1.0, 기본값: 0.86)
 * @returns 처리된 WebP 이미지 파일
 */
export async function resizeImage(
  file: File, 
  maxW: number = 1600, 
  maxH: number = 1600, 
  q: number = 0.86
): Promise<File> {
  try {
    // ImageBitmap 생성
    const img = await createImageBitmap(file);
    
    // 스케일 계산 (원본보다 크게 하지 않음)
    const scale = Math.min(maxW / img.width, maxH / img.height, 1);
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    
    // OffscreenCanvas 사용 (메인 스레드 블로킹 방지)
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d')!;
    
    // 이미지 그리기
    ctx.drawImage(img, 0, 0, w, h);
    
    // WebP로 변환 및 압축
    const blob = await canvas.convertToBlob({ 
      type: 'image/webp', 
      quality: q 
    });
    
    // 파일명을 .webp로 변경
    const newFileName = file.name.replace(/\.\w+$/, '.webp');
    
    return new File([blob], newFileName, { type: 'image/webp' });
    
  } catch (error) {
    console.error('이미지 리사이즈 실패:', error);
    throw new Error('이미지 처리 중 오류가 발생했습니다.');
  }
}

/**
 * 이미지 품질 체크 (Laplacian variance 기반)
 * @param file 이미지 파일
 * @returns 품질 점수 (0.0 ~ 1.0)
 */
export async function checkImageQuality(file: File): Promise<number> {
  try {
    const img = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d')!;
    
    // 이미지를 캔버스에 그리기
    ctx.drawImage(img, 0, 0);
    
    // 이미지 데이터 추출
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;
    
    // 그레이스케일 변환 및 Laplacian 필터 적용
    let variance = 0;
    let count = 0;
    
    for (let y = 1; y < img.height - 1; y++) {
      for (let x = 1; x < img.width - 1; x++) {
        const idx = (y * img.width + x) * 4;
        
        // 그레이스케일 값 계산
        const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        
        // Laplacian 필터 적용
        const laplacian = Math.abs(
          gray - 
          (data[idx - 4] * 0.299 + data[idx - 3] * 0.587 + data[idx - 2] * 0.114) -
          (data[idx + 4] * 0.299 + data[idx + 3] * 0.587 + data[idx + 2] * 0.114) -
          (data[(y - 1) * img.width * 4 + x * 4] * 0.299 + 
           data[(y - 1) * img.width * 4 + x * 4 + 1] * 0.587 + 
           data[(y - 1) * img.width * 4 + x * 4 + 2] * 0.114) -
          (data[(y + 1) * img.width * 4 + x * 4] * 0.299 + 
           data[(y + 1) * img.width * 4 + x * 4 + 1] * 0.587 + 
           data[(y + 1) * img.width * 4 + x * 4 + 2] * 0.114)
        );
        
        variance += laplacian * laplacian;
        count++;
      }
    }
    
    // 평균 분산 계산
    const avgVariance = variance / count;
    
    // 품질 점수 정규화 (0.0 ~ 1.0)
    // 높은 분산 = 선명한 이미지 = 높은 품질
    const quality = Math.min(avgVariance / 1000, 1.0);
    
    return quality;
    
  } catch (error) {
    console.error('이미지 품질 체크 실패:', error);
    return 0.5; // 기본값
  }
}

/**
 * 이미지 메타데이터 추출
 * @param file 이미지 파일
 * @returns 이미지 메타데이터
 */
export async function getImageMetadata(file: File): Promise<{
  width: number;
  height: number;
  aspectRatio: number;
  fileSize: number;
  type: string;
}> {
  try {
    const img = await createImageBitmap(file);
    
    return {
      width: img.width,
      height: img.height,
      aspectRatio: img.width / img.height,
      fileSize: file.size,
      type: file.type
    };
    
  } catch (error) {
    console.error('이미지 메타데이터 추출 실패:', error);
    throw new Error('이미지 정보를 읽을 수 없습니다.');
  }
}

/**
 * 이미지 배경 제거 (간단한 시뮬레이션)
 * @param file 이미지 파일
 * @returns 배경이 제거된 이미지 파일
 */
export async function removeBackground(file: File): Promise<File> {
  try {
    // 실제로는 AI 모델을 사용해야 하지만, 여기서는 시뮬레이션
    const img = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d')!;
    
    // 원본 이미지 그리기
    ctx.drawImage(img, 0, 0);
    
    // 간단한 배경 제거 시뮬레이션 (실제로는 AI 모델 사용)
    // 여기서는 투명도만 조정
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // 밝은 픽셀을 투명하게 만들기 (간단한 시뮬레이션)
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (brightness > 240) {
        data[i + 3] = 0; // 투명도 0
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // PNG로 변환 (투명도 지원)
    const blob = await canvas.convertToBlob({ 
      type: 'image/png'
    });
    
    const newFileName = file.name.replace(/\.\w+$/, '.png');
    return new File([blob], newFileName, { type: 'image/png' });
    
  } catch (error) {
    console.error('배경 제거 실패:', error);
    throw new Error('배경 제거 중 오류가 발생했습니다.');
  }
}

/**
 * 이미지 필터 적용
 * @param file 이미지 파일
 * @param filter 필터 타입
 * @returns 필터가 적용된 이미지 파일
 */
export async function applyImageFilter(
  file: File, 
  filter: 'grayscale' | 'sepia' | 'blur' | 'sharpen'
): Promise<File> {
  try {
    const img = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d')!;
    
    // 원본 이미지 그리기
    ctx.drawImage(img, 0, 0);
    
    // 필터 적용
    switch (filter) {
      case 'grayscale':
        ctx.filter = 'grayscale(100%)';
        break;
      case 'sepia':
        ctx.filter = 'sepia(100%)';
        break;
      case 'blur':
        ctx.filter = 'blur(2px)';
        break;
      case 'sharpen':
        ctx.filter = 'contrast(150%) saturate(150%)';
        break;
    }
    
    // 필터 적용된 이미지 다시 그리기
    ctx.drawImage(canvas, 0, 0);
    
    // WebP로 변환
    const blob = await canvas.convertToBlob({ 
      type: 'image/webp', 
      quality: 0.9 
    });
    
    const newFileName = file.name.replace(/\.\w+$/, `-${filter}.webp`);
    return new File([blob], newFileName, { type: 'image/webp' });
    
  } catch (error) {
    console.error('이미지 필터 적용 실패:', error);
    throw new Error('필터 적용 중 오류가 발생했습니다.');
  }
}

/**
 * 이미지 크롭
 * @param file 이미지 파일
 * @param x 시작 X 좌표
 * @param y 시작 Y 좌표
 * @param width 크롭할 너비
 * @param height 크롭할 높이
 * @returns 크롭된 이미지 파일
 */
export async function cropImage(
  file: File,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<File> {
  try {
    const img = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d')!;
    
    // 지정된 영역만 그리기
    ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
    
    // WebP로 변환
    const blob = await canvas.convertToBlob({ 
      type: 'image/webp', 
      quality: 0.9 
    });
    
    const newFileName = file.name.replace(/\.\w+$/, '-cropped.webp');
    return new File([blob], newFileName, { type: 'image/webp' });
    
  } catch (error) {
    console.error('이미지 크롭 실패:', error);
    throw new Error('이미지 크롭 중 오류가 발생했습니다.');
  }
}

/**
 * 이미지 압축률 계산
 * @param originalSize 원본 파일 크기 (bytes)
 * @param compressedSize 압축된 파일 크기 (bytes)
 * @returns 압축률 (0.0 ~ 1.0)
 */
export function calculateCompressionRatio(originalSize: number, compressedSize: number): number {
  if (originalSize === 0) return 0;
  return (originalSize - compressedSize) / originalSize;
}

/**
 * 파일 크기 포맷팅
 * @param bytes 바이트 단위 크기
 * @returns 포맷된 크기 문자열
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 