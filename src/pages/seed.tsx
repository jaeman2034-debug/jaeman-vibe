import { useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../lib/firebase";
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";

export default function SeedPage() {
  const [docId, setDocId] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cleanupMessage, setCleanupMessage] = useState<string>("");

  const handleSeed = async () => {
    setIsLoading(true);
    try {
      // 중복 체크: ?��? 같�? ?�목??글???�는지 ?�인
      const existingQuery = query(
        collection(db, "posts"),
        where("title", "==", "FC88 공식 블로�??�픈 ?��")
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        const existingPost = existingSnapshot.docs[0];
        setDocId(existingPost.id);
        setSuccess(true);
        console.log("???��? FC88 글??존재?�니?? 기존 글 ID:", existingPost.id);
        return;
      }

      console.log("?�� ?�로??FC88 글 ?�성 �?..");
      
      // 1) ?�모 ?�스???�성 (posts 컬렉?�에 ?�??
             const ref = await addDoc(collection(db, "posts"), {
               title: "FC88 공식 블로�??�픈 ?��",
               content:
                 "FC88 ?� 공식 블로그�? ?�픈?�었?�니??\n" +
                 "?�으�??�곳?�서 ?� ?�식, 경기 ?�정, ?�수 ?�터�? ?�련 ?�기 ?�을 공유???�정?�니??\n" +
                 "많�? 관?�과 구독 부?�드립니???��",
               authorUid: "demo-admin",
               authorName: "관리자 FC88",
               authorIcon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f59e0b'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-family='system-ui, sans-serif' font-size='16' font-weight='bold'%3EFC88%3C/text%3E%3C/svg%3E",
               thumbnailUrl: "https://picsum.photos/400/300?random=fc88", // ?�네???��?지 추�?
               imageUrl: "https://picsum.photos/800/600?random=fc88", // 메인 ?��?지 추�?
               teamId: null, // ?�반 ?�스??               createdAt: Date.now(),
               updatedAt: Date.now(),
               tags: ["공�?", "FC88", "블로그오??],
               likes: 0,
               views: 0,
             });

      // 2) ?��? ?�플 추�?
      const commentsCol = collection(db, "posts", ref.id, "comments");
      await addDoc(commentsCol, {
        content: "FC88 ?�이?? ?�으�?글 기�??�게???��",
        authorUid: "user-001",
        authorName: "?�길??,
               authorIcon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Crect width='50' height='50' fill='%233b82f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-family='system-ui, sans-serif' font-size='12' font-weight='bold'%3EH%3C/text%3E%3C/svg%3E",
        createdAt: Date.now(),
      });
      await addDoc(commentsCol, {
        content: "공식 블로�??�픈 축하?�립?�다 ?��",
        authorUid: "user-002",
        authorName: "김철수",
               authorIcon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Crect width='50' height='50' fill='%23ef4444'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-family='system-ui, sans-serif' font-size='12' font-weight='bold'%3EK%3C/text%3E%3C/svg%3E",
        createdAt: Date.now() + 1000,
      });

      console.log("???�로??FC88 글 ?�성 ?�료:", ref.id);
      setDocId(ref.id);
      setSuccess(true);
    } catch (err) {
      console.error("?�모 ?�이???�성 ?�패:", err);
      setSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanUpDuplicatePosts = async () => {
    try {
      console.log("?�� 중복 글 ?�리 ?�작...");
      setCleanupMessage("?�리 �?..");
      
      const snapshot = await getDocs(collection(db, "posts"));
      
      // "FC88 공식 블로�??�픈 ?��" 글�?찾기
      const duplicates = snapshot.docs.filter(
        d => d.data().title === "FC88 공식 블로�??�픈 ?��"
      );

      console.log("중복 개수:", duplicates.length);

      if (duplicates.length <= 1) {
        setCleanupMessage("??중복 글 ?�음. ?�리???�요가 ?�습?�다.");
        console.log("??중복 글 ?�음. ?�리???�요가 ?�습?�다.");
        return;
      }

      // �?번째�??�기�??�머지 ??��
      let deletedCount = 0;
      for (let i = 1; i < duplicates.length; i++) {
        await deleteDoc(doc(db, "posts", duplicates[i].id));
        console.log("??�� ?�료:", duplicates[i].id);
        deletedCount++;
      }

      setCleanupMessage(`?�� ?�리 ?�료! ${deletedCount}�?중복 글 ??��?? 1개만 ?�았?�니??`);
      console.log(`?�� ?�리 ?�료! ${deletedCount}�?중복 글 ??��?? 1개만 ?�았?�니??`);
      
    } catch (error) {
      console.error("???�리 �??�류 발생:", error);
      setCleanupMessage("???�리 �??�류가 발생?�습?�다.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
            ?�� ?�모 ?�이???�성 ?�이지
          </h1>
          
          <div className="text-center mb-8">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              버튼???�릭?�면 FC88 공식 블로�??�스?��? ?�플 ?��? 2개�? ?�동?�로 ?�성?�니??
            </p>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleSeed}
                disabled={isLoading}
                className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:scale-105"
                } text-white shadow-lg`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ?�성 �?..
                  </div>
                ) : (
                  "?? ?�모 ?�스???�성?�기"
                )}
              </button>
              
              <button
                onClick={cleanUpDuplicatePosts}
                className="px-6 py-4 rounded-lg font-semibold text-lg transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:scale-105 text-white shadow-lg"
              >
                ?�� 중복 글 ?�리?�기
              </button>
            </div>
          </div>

          {cleanupMessage && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-blue-800 dark:text-blue-200 text-center font-medium">
                {cleanupMessage}
              </p>
            </div>
          )}

          {success && docId && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-2xl">??/div>
                <h2 className="text-xl font-semibold text-green-800 dark:text-green-200">
                  ?�공!
                </h2>
              </div>
              <div className="space-y-2 text-green-700 dark:text-green-300">
                <p>??FC88 공식 블로�??�픈 ?�스?��? ?�성?�었?�니??/p>
                <p>???��? 2�?(?�길?? 김철수)???�께 추�??�었?�니??/p>
                <p>???�스??ID: <code className="bg-green-100 dark:bg-green-800 px-2 py-1 rounded">{docId}</code></p>
              </div>
            </div>
          )}

          {success && (
            <div className="text-center">
              <Link
                to={`/posts/${docId}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors shadow-lg"
              >
                ?�� 게시글 보기
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            </div>
          )}

          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
              ?�� ?�성?�는 ?�이??            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">?�� ?�스??/h4>
                <ul className="space-y-1 text-blue-600 dark:text-blue-400">
                  <li>???�목: "FC88 공식 블로�??�픈 ?��"</li>
                  <li>???�성?? 관리자 FC88</li>
                  <li>???�그: 공�?, FC88, 블로그오??/li>
                  <li>??좋아??조회?? 0</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">?�� ?��?</h4>
                <ul className="space-y-1 text-blue-600 dark:text-blue-400">
                  <li>???�길?? "FC88 ?�이?? ?�으�?글 기�??�게???��"</li>
                  <li>??김철수: "공식 블로�??�픈 축하?�립?�다 ?��"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
