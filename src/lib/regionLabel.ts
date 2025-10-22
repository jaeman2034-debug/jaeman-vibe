// src/lib/regionLabel.ts
export function regionLabel(item: any): string {
  const parts = [
    item.country ?? 'KR',
    item.regionName ?? item.gu ?? item.city ?? item.region
  ].filter(Boolean);
  
  return parts.length > 1 ? parts.join(' · ') : 'KR';
}

export function krw(price: number): string {
  return price.toLocaleString('ko-KR') + '원';
}
