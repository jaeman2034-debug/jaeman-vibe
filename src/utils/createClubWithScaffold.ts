import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export async function createClubWithScaffold(uid: string, clubName: string) {
  console.log("[createClubWithScaffold] Starting creation for:", clubName);

  // 클라이언트는 클럽 문서만 생성 (규칙에 맞게 필수 필드 포함)
  const clubRef = await addDoc(collection(db, "clubs"), {
    name: clubName,
    ownerUid: uid,
    admins: [uid], // 규칙에서 요구하는 배열 형태
    active: true,
    createdAt: serverTimestamp(),
  });

  console.log("[createClubWithScaffold] Club document created successfully");
  console.log("[createClubWithScaffold] Cloud Function will handle scaffolding");
  
  return clubRef.id;
}
