import {
  getFirestore,
  doc,
  collection,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";

type Preset = "adult-basic" | "youth-basic";

export async function autoCreateTeamsAndBlog(opts: {
  clubId: string;
  clubName: string;
  preset?: Preset;
  lang?: "ko" | "en";
  info?: {
    weeklyDay?: string;
    weeklyTime?: string;
    venue?: string;
    fee?: string;
    contact?: string;
  };
}) {
  const {
    clubId,
    clubName,
    preset = "adult-basic",
    lang = "ko",
    info = {},
  } = opts;

  const db = getFirestore();
  const batch = writeBatch(db);

  const clubRef = doc(db, "clubs", clubId);

  // 1) 팀 프리셋 구성
  const teams =
    preset === "youth-basic"
      ? [
          { name: "U10", level: "Beginner" },
          { name: "U12", level: "Intermediate" },
          { name: "U15", level: "Advanced" },
        ]
      : [
          { name: "정기A팀", level: "Beginner" },
          { name: "정기B팀", level: "Intermediate" },
        ];

  // 2) 팀 문서들 생성 (clubs/{id}/teams)
  for (const t of teams) {
    const tid = doc(collection(clubRef, "teams")).id;
    const teamRef = doc(db, `clubs/${clubId}/teams/${tid}`);
    batch.set(teamRef, {
      name: t.name,
      level: t.level,
      lang,
      weeklyDay: info.weeklyDay ?? "토요일",
      weeklyTime: info.weeklyTime ?? "16:00",
      venue: info.venue ?? "미정",
      fee: info.fee ?? "",
      contact: info.contact ?? "",
      active: true,
      createdAt: serverTimestamp(),
    });
  }

  // 3) 블로그 기본 문서 + 환영글 (blogs/{clubId}/posts/welcome)
  const blogRef = doc(db, "blogs", clubId);
  batch.set(blogRef, {
    clubId,
    title: `${clubName} 공식 블로그`,
    lang,
    theme: "light",
    createdAt: serverTimestamp(),
  });

  const welcomeRef = doc(collection(blogRef, "posts"), "welcome");
  batch.set(welcomeRef, {
    title: "환영합니다!",
    summary: `${clubName} 모임 소식, 일정, 사진을 여기에서 공유합니다.`,
    content:
      `안녕하세요! ${clubName}입니다.\n\n` +
      `정기 모임: ${info.weeklyDay ?? "토요일"} ${info.weeklyTime ?? "16:00"}\n` +
      `장소: ${info.venue ?? "미정"}\n` +
      (info.fee ? `회비: ${info.fee}\n` : "") +
      (info.contact ? `문의: ${info.contact}\n` : ""),
    published: true,
    createdAt: serverTimestamp(),
  });

  // 4) 클럽 메타 업데이트
  batch.set(
    clubRef,
    {
      teamCount: teams.length,
      hasBlog: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();
}
