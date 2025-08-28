"use strict";
// src/lib/images.tsexport function getFirstImageUrl(item: { images?: string[] }) {  const img = item?.images?.[0];  if (!img) return "/img/placeholder.svg";  // base64 ?�는 http(s) ?�운로드 URL 모두 ?�용  const isBase64 = img.startsWith("data:image");  const isUrl = /^https?:\/\//i.test(img);  return isBase64 || isUrl ? img : "/img/placeholder.svg";}
