import { Badge } from "@/components/common/Badge";

export type ReservationStatus = "active" | "canceled" | "no_show" | "attended";

// ?�약 ?�태�?배�? ?�더�?
export function getReservationStatusBadge(status: ReservationStatus) {
  switch (status) {
    case "active":
      return <Badge text="?�성" tone="green" />;
    case "canceled":
      return <Badge text="취소?? tone="red" />;
    case "no_show":
      return <Badge text="?�쇼" tone="red" />;
    case "attended":
      return <Badge text="참석" tone="blue" />;
    default:
      return <Badge text={status} tone="gray" />;
  }
}

// ?�약 ?�태�??�상 ?�래??
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

// ?�약 ?�태�??�명
export function getReservationStatusDescription(status: ReservationStatus) {
  switch (status) {
    case "active":
      return "?�약???�성 ?�태?�니?? ?�간??맞춰 방문?�주?�요.";
    case "canceled":
      return "?�약??취소?�었?�니??";
    case "no_show":
      return "?�약 ?�간??방문?��? ?�아 ?�쇼�?처리?�었?�니??";
    case "attended":
      return "?�약 ?�간??방문?�여 참석?�로 처리?�었?�니??";
    default:
      return "?????�는 ?�태?�니??";
  }
}

// ?�약 ?�태�??�션 가???��?
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

// ?�뢰???�수???�른 ?�급
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

// ?�뢰???�급�??�상
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
