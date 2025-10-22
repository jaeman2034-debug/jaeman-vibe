import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export async function createClubBlogPost(db: any, auth: any, clubId: string, { title, content }: { title: string; content: string }) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('로그인이 필요합니다.');

  await addDoc(collection(db, `clubs/${clubId}/blog`), {
    clubId,                 // 디버깅용으로 넣어두면 편함
    title,
    content,
    authorUid: uid,
    published: true,        // ✅ 리스트가 필터 쓰면 꼭 넣기
    pinned: false,
    createdAt: serverTimestamp(),
  });
}
