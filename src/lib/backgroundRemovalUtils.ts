// src/lib/backgroundRemovalUtils.ts
// 배경 제거(옵션) + 리사이즈 + 간단 품질 점수

export type BackgroundRemovalOptions = {
  quality?: number;
  outputFormat?: string;
};

export type BackgroundRemovalResult = {
  success: boolean;
  blob?: Blob;
  error?: string;
};

type ResizeOpts = { maxW?: number; maxH?: number; quality?: number };

function makeCanvas(w: number, h: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

async function canvasToFile(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  name: string,
  type: string,
  quality = 0.9
): Promise<File> {
  if ('convertToBlob' in canvas) {
    const blob = await (canvas as OffscreenCanvas).convertToBlob({ type, quality });
    return new File([blob], name, { type });
  }
  return new Promise<File>((resolve) => {
    (canvas as HTMLCanvasElement).toBlob((blob) => {
      resolve(new File([blob!], name, { type }));
    }, type, quality);
  });
}

async function fileToImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    // revoke는 그리기 이후에 해도 무방
  }
}

/** (선택) 배경 제거. 라이브러리 없으면 원본을 그대로 사용 */
async function tryRemoveBackground(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    // 패키지를 설치했다면 동작합니다:
    //   npm i @imgly/background-removal
    //   (또는 onnxruntime-web 기반 다른 구현)
    // 예: createWorker → worker.removeBackground(image)
    const mod: any = await import('@imgly/background-removal');
    const worker = await (mod.createWorker ? mod.createWorker() : null);
    if (worker?.removeBackground) {
      const img = await fileToImage(file);
      const blob: Blob = await worker.removeBackground(img);
      return await createImageBitmap(await blob.arrayBuffer().then((b)=>new Blob([b])));
    }
  } catch {
    /* 라이브러리 없으면 무시하고 원본 사용 */
  }
  // fallback: 원본 이미지
  const img = await fileToImage(file);
  return img;
}

/** 배경 제거(가능하면) 후 리사이즈+웹프 변환 */
export async function removeBackgroundAndResize(
  file: File,
  opts: ResizeOpts = {},
  resizeOptions?: { maxWidth: number; maxHeight: number; quality: number }
): Promise<BackgroundRemovalResult> {
  try {
    const maxW = resizeOptions?.maxWidth ?? opts.maxW ?? 1600;
    const maxH = resizeOptions?.maxHeight ?? opts.maxH ?? 1600;
    const q = resizeOptions?.quality ?? opts.quality ?? 0.86;

    const img = await tryRemoveBackground(file);
    const w = (img as any).width, h = (img as any).height;

    const scale = Math.min(maxW / w, maxH / h, 1);
    const nw = Math.round(w * scale), nh = Math.round(h * scale);

    const canvas = makeCanvas(nw, nh);
    const ctx = (canvas as any).getContext('2d') as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, nw, nh);
    ctx.drawImage(img as any, 0, 0, nw, nh);

    const name = file.name.replace(/\.\w+$/, '.webp');
    const resultFile = await canvasToFile(canvas, name, 'image/webp', q);
    
    return {
      success: true,
      blob: resultFile
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

/** 간단 품질 점수(0~1): 밝기 적정 + 대비/선명도 근사 */
export async function calculateImageQuality(file: File): Promise<number> {
  try {
    const img = await fileToImage(file);
    const w = 256, h = Math.max(1, Math.round((img.height / img.width) * 256));
    const canvas = makeCanvas(w, h);
    const ctx = (canvas as any).getContext('2d') as CanvasRenderingContext2D;
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;

    let sum = 0, sumSq = 0;
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      sum += lum; sumSq += lum * lum;
    }
    const n = data.length / 4;
    const mean = sum / n;                   // 0..255
    const variance = Math.max(0, sumSq / n - mean * mean); // 대비/선명도 근사

    // 노출 점수: 128 근처가 최고
    const exposure = 1 - Math.min(1, Math.abs(mean - 128) / 128);
    // 선명도 점수: 50~2000 범위 스케일링 (경험값)
    const sharp = Math.max(0, Math.min(1, (variance - 50) / 1950));

    return Math.max(0, Math.min(1, (exposure * 0.5 + sharp * 0.5)));
  } catch (error) {
    console.error('이미지 품질 계산 실패:', error);
    return 0.5; // 기본값
  }
}

/** (옵션) 단순 리사이즈만 필요할 때 */
export async function resizeImage(
  file: File, maxW = 1600, maxH = 1600, q = 0.86
): Promise<File> {
  const img = await fileToImage(file);
  const scale = Math.min(maxW / img.width, maxH / img.height, 1);
  const nw = Math.round(img.width * scale), nh = Math.round(img.height * scale);
  const canvas = makeCanvas(nw, nh);
  const ctx = (canvas as any).getContext('2d') as CanvasRenderingContext2D;
  ctx.drawImage(img, 0, 0, nw, nh);
  const name = file.name.replace(/\.\w+$/, '.webp');
  return canvasToFile(canvas, name, 'image/webp', q);
}

/** 이미지 포맷 변환 (WebP, AVIF 지원) */
export async function convertImageFormat(
  file: File,
  format: 'webp' | 'avif' | 'jpeg' | 'png',
  quality = 0.9
): Promise<File> {
  const img = await fileToImage(file);
  const canvas = makeCanvas(img.width, img.height);
  const ctx = (canvas as any).getContext('2d') as CanvasRenderingContext2D;
  
  ctx.drawImage(img, 0, 0);
  
  let mimeType: string;
  switch (format) {
    case 'webp':
      mimeType = 'image/webp';
      break;
    case 'avif':
      mimeType = 'image/avif';
      break;
    case 'jpeg':
      mimeType = 'image/jpeg';
      break;
    case 'png':
      mimeType = 'image/png';
      quality = 1; // PNG는 품질 설정 불가
      break;
    default:
      mimeType = 'image/webp';
  }
  
  const name = file.name.replace(/\.\w+$/, `.${format}`);
  return canvasToFile(canvas, name, mimeType, quality);
}

/** 이미지 메타데이터 추출 */
export async function extractImageMetadata(file: File): Promise<{
  width: number;
  height: number;
  size: number;
  type: string;
  lastModified: number;
}> {
  const img = await fileToImage(file);
  
  return {
    width: img.naturalWidth,
    height: img.naturalHeight,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified
  };
} 