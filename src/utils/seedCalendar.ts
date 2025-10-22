import { createSchedule } from "../lib/firestore-calendar";

/**
 * ?�스???�이???�드
 * 콘솔?�서 seedDemoSchedules() ?�행
 */
export async function seedDemoSchedules() {
  const base = new Date();
  base.setHours(10, 0, 0, 0);

  console.log("?�� 캘린???�스???�이???�성 �?..");

  // 1. ?�흘FC 60 ?�련
  await createSchedule({
    title: "?�흘FC60 ?�기 ?�련",
    allDay: false,
    start: base,
    end: new Date(base.getTime() + 2 * 60 * 60 * 1000),
    type: "team",
    location: "?�천종합?�동??,
    description: "주간 ?�기 ?�련\n참석 ?�수!",
    createdBy: "system",
    color: "#3b82f6",
    teamId: "soheul60",
  });

  // 2. U-12 ?�카?��? ?�슨
  await createSchedule({
    title: "U-12 ?�카?��? ?�슨",
    allDay: false,
    start: new Date(base.getTime() + 24 * 60 * 60 * 1000),
    end: new Date(base.getTime() + 26 * 60 * 60 * 1000),
    type: "academy",
    location: "?�흘구장 A",
    description: "?�소??축구 기초 ?�련",
    createdBy: "system",
    color: "#8b5cf6",
    teamId: "academy",
  });

  // 3. 모비?�배 ?�선
  await createSchedule({
    title: "모비?�배 ?�선 1차전",
    allDay: true,
    start: new Date(base.getTime() + 3 * 24 * 60 * 60 * 1000),
    end: new Date(base.getTime() + 4 * 24 * 60 * 60 * 1000),
    type: "tournament",
    location: "?�천B 종합?�동??,
    description: "모비?�배 ?�너먼트 ?�선??,
    createdBy: "system",
    color: "#f59e0b",
  });

  // 4. ?�흘FC 88 친선 경기
  await createSchedule({
    title: "?�흘FC88 vs 60 친선경기",
    allDay: false,
    start: new Date(base.getTime() + 5 * 24 * 60 * 60 * 1000),
    end: new Date(base.getTime() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    type: "team",
    location: "?�흘 체육공원",
    description: "친선 경기\n?�천 ??취소",
    createdBy: "system",
    color: "#3b82f6",
    teamId: "soheul88",
  });

  // 5. ?�카?��? ?��?�?미팅
  await createSchedule({
    title: "?�카?��? ?��?�?간담??,
    allDay: false,
    start: new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000),
    end: new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000),
    type: "academy",
    location: "?�흘 커�??�티?�터",
    description: "?��?�?미팅 �??�즌 계획 ?�명",
    createdBy: "system",
    color: "#8b5cf6",
    teamId: "academy",
  });

  console.log("??캘린???�스???�이???�성 ?�료!");
  console.log("?�� ?�이지�??�로고침?�세??");
}

// 브라?��? 콘솔?�서 ?�용 가?�하?�록 ?�역 ?�록
if (typeof window !== "undefined") {
  (window as any).seedDemoSchedules = seedDemoSchedules;
}

