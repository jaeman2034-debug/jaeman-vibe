export async function downscaleImage(file: File, maxW = 1280, quality = 0.85): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxW / bmp.width);
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bmp, 0, 0, w, h);
  return await new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', quality);
  });
}
