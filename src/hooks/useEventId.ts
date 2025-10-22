import { useLocation, useParams } from "react-router-dom";

export function useEventId() {
  const { pathname, search } = useLocation();
  const params = useParams();
  const qs = new URLSearchParams(search);
  
  // ① /events/:id/checkout  ② /checkout?event=...  ③ /events/:eventId/...
  const eventId = (
    qs.get("event") ||
    (params as any).id ||
    (params as any).eventId ||
    // 혹시라도 라우터 설정이 꼬였을 때 pathname에서 추출
    (pathname.match(/^\/events\/([^/]+)/)?.[1] ?? "")
  );
  
  // 플레이스홀더 감지 시 경고만
  if (/%3CID%3e|<id>/i.test(eventId)) {
    console.warn('잘못된 링크 감지: <ID>');
    return '';
  }
  
  return eventId;
}