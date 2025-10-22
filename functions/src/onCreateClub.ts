import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Firebase Admin SDK 초기화
initializeApp();
const db = getFirestore();

export const onCreateClub = onDocumentCreated(
  "clubs/{clubId}",
  async (event) => {
    const clubId = event.params.clubId;
    const clubData = event.data?.data();

    if (!clubData) {
      console.error("No club data found");
      return;
    }

    const { name, ownerUid } = clubData;

    console.log(`[onCreateClub] Scaffolding club: ${name} (${clubId})`);

    try {
      // 1. 멤버 추가 (소유자)
      await db.collection(`clubs/${clubId}/members`).doc(ownerUid).set({
        role: "owner",
        joinedAt: new Date(),
      });

      // 2. 기본 설정
      await db.collection(`clubs/${clubId}/settings`).doc("main").set({
        visibility: "public",
        allowJoin: true,
        createdAt: new Date(),
      });

      // 3. 기본 팀
      await db.collection(`clubs/${clubId}/teams`).add({
        name: "대표팀",
        isDefault: true,
        createdAt: new Date(),
      });

      // 4. 블로그 첫 글 (blog 경로로 통일: clubs/{clubId}/blog/{postId})
      await db.collection(`clubs/${clubId}/blog`).add({
        clubId,                 // 디버깅용
        title: `${name} 공식 블로그 오픈!`,
        content: "첫 글입니다. 응원해주세요 👋",
        authorUid: ownerUid,
        published: true,
        pinned: false,
        createdAt: new Date(),
      });

      console.log(`[onCreateClub] Scaffolding completed for club: ${clubId}`);
    } catch (error) {
      console.error(`[onCreateClub] Error scaffolding club ${clubId}:`, error);
    }
  }
);
