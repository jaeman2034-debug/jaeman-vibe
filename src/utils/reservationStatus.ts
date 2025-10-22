import { Badge } from "@/components/common/Badge";

export type ReservationStatus = "active" | "canceled" | "no_show" | "attended";

// ?ˆì•½ ?íƒœë³?ë°°ì? ?Œë”ë§?
export function getReservationStatusBadge(status: ReservationStatus) {
  switch (status) {
    case "active":
      return <Badge text="?œì„±" tone="green" />;
    case "canceled":
      return <Badge text="ì·¨ì†Œ?? tone="red" />;
    case "no_show":
      return <Badge text="?¸ì‡¼" tone="red" />;
    case "attended":
      return <Badge text="ì°¸ì„" tone="blue" />;
    default:
      return <Badge text={status} tone="gray" />;
  }
}

// ?ˆì•½ ?íƒœë³??‰ìƒ ?´ë˜??
export function getReservationStatusColor(status: ReservationStatus) {
  switch (status) {
    case "active":
      return "text-green-700 bg-green-50 border-green-200";
    case "canceled":
      return "text-red-700 bg-red-50 border-red-200";
    case "no_show":
      return "text-red-700 bg-red-50 border-red-200";
    case "attended":
      return "text-blue-700 bg-blue-50 border-blue-200";
    default:
      return "text-gray-700 bg-gray-50 border-gray-200";
  }
}

// ?ˆì•½ ?íƒœë³??¤ëª…
export function getReservationStatusDescription(status: ReservationStatus) {
  switch (status) {
    case "active":
      return "?ˆì•½???œì„± ?íƒœ?…ë‹ˆ?? ?œê°„??ë§ì¶° ë°©ë¬¸?´ì£¼?¸ìš”.";
    case "canceled":
      return "?ˆì•½??ì·¨ì†Œ?˜ì—ˆ?µë‹ˆ??";
    case "no_show":
      return "?ˆì•½ ?œê°„??ë°©ë¬¸?˜ì? ?Šì•„ ?¸ì‡¼ë¡?ì²˜ë¦¬?˜ì—ˆ?µë‹ˆ??";
    case "attended":
      return "?ˆì•½ ?œê°„??ë°©ë¬¸?˜ì—¬ ì°¸ì„?¼ë¡œ ì²˜ë¦¬?˜ì—ˆ?µë‹ˆ??";
    default:
      return "?????†ëŠ” ?íƒœ?…ë‹ˆ??";
  }
}

// ?ˆì•½ ?íƒœë³??¡ì…˜ ê°€???¬ë?
export function canPerformAction(status: ReservationStatus, action: "cancel" | "checkin" | "edit") {
  switch (action) {
    case "cancel":
      return status === "active";
    case "checkin":
      return status === "active";
    case "edit":
      return status === "active";
    default:
      return false;
  }
}

// ? ë¢°???ìˆ˜???°ë¥¸ ?±ê¸‰
export function getTrustGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C+';
  if (score >= 40) return 'C';
  if (score >= 30) return 'D+';
  if (score >= 20) return 'D';
  return 'F';
}

// ? ë¢°???±ê¸‰ë³??‰ìƒ
export function getTrustGradeColor(grade: string) {
  switch (grade) {
    case 'A+':
    case 'A':
      return "text-green-700 bg-green-50 border-green-200";
    case 'B+':
    case 'B':
      return "text-blue-700 bg-blue-50 border-blue-200";
    case 'C+':
    case 'C':
      return "text-yellow-700 bg-yellow-50 border-yellow-200";
    case 'D+':
    case 'D':
      return "text-orange-700 bg-orange-50 border-orange-200";
    case 'F':
      return "text-red-700 bg-red-50 border-red-200";
    default:
      return "text-gray-700 bg-gray-50 border-gray-200";
  }
}
