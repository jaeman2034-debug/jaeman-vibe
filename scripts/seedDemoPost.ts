import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

async function seedDemoPost() {
  try {
    // 1) 데모 포스트 생성
    const ref = await addDoc(collection(db, "posts"), {
      title: "FC88 공식 블로그 오픈 🎉",
      content:
        "FC88 팀 공식 블로그가 오픈되었습니다!\n" +
        "앞으로 이곳에서 팀 소식, 경기 일정, 선수 인터뷰, 훈련 후기 등을 공유할 예정입니다.\n" +
        "많은 관심과 구독 부탁드립니다 🙌",
      authorUid: "demo-admin",
      authorName: "관리자 FC88",
      authorIcon: "https://placehold.co/100x100?text=FC88", // 팀 로고 URL로 교체 가능
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: ["공지", "FC88", "블로그오픈"],
      likes: 0,
      views: 0,
    });

    // 2) 댓글 샘플 추가
    const commentsCol = collection(db, "posts", ref.id, "comments");
    await addDoc(commentsCol, {
      content: "FC88 화이팅! 앞으로 글 기대할게요 🙌",
      authorUid: "user-001",
      authorName: "홍길동",
      authorIcon: "https://placehold.co/50x50?text=H",
      createdAt: Date.now(),
    });
    await addDoc(commentsCol, {
      content: "공식 블로그 오픈 축하드립니다 👏",
      authorUid: "user-002",
      authorName: "김철수",
      authorIcon: "https://placehold.co/50x50?text=K",
      createdAt: Date.now() + 1000,
    });

    console.log("✅ Demo post created:", ref.id);
    console.log("✅ 댓글 2개도 함께 생성되었습니다!");
  } catch (err) {
    console.error("❌ 데모 데이터 생성 실패:", err);
  }
}

seedDemoPost();
