// src/lib/timeAgo.ts
export function timeAgoFrom(input?: Date | number | null) {
  if (!input) return "";
  const d = typeof input === "number" ? new Date(input) : input;
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);

  if (sec < 60) return "방금 전";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  return `${day}일 전`;
}

// 기존 코드 호환(있으면)
export const timeAgo = timeAgoFrom;
export default timeAgoFrom; // 선택