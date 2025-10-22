// src/lib/images.ts
export function getFirstImageUrl(item: { images?: string[]; thumbUrl?: string }) {
  const img = item?.thumbUrl ?? item?.images?.[0];
  if (!img) return "/img/placeholder.svg";
  
  // base64 또는 http(s) 다운로드 URL 모두 사용
  const isBase64 = img.startsWith("data:image");
  const isUrl = /^https?:\/\//i.test(img);
  return isBase64 || isUrl ? img : "/img/placeholder.svg";
}