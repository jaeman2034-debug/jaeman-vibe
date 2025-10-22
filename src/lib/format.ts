export const priceKR = (n?: number) => {
  if (typeof n !== 'number') return '가격없음';
  if (n === 0) return '나눔';
  return `${n.toLocaleString('ko-KR')}원`;
};

export function timeAgo(ts?: any) {
  const d =
    ts?.toDate?.() ??
    (typeof ts === 'number' ? new Date(ts) : ts instanceof Date ? ts : null);
  if (!d) return '';
  
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);
  
  if (sec < 60) return '방금 전';
  if (min < 60) return `${min}분 전`;
  if (hour < 24) return `${hour}시간 전`;
  if (day < 7) return `${day}일 전`;
  
  // 7일 이상은 날짜로 표시
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}