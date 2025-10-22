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
      // ì¤‘ë³µ ì²´í¬: ?´ë? ê°™ì? ?œëª©??ê¸€???ˆëŠ”ì§€ ?•ì¸
      const existingQuery = query(
        collection(db, "posts"),
        where("title", "==", "FC88 ê³µì‹ ë¸”ë¡œê·??¤í”ˆ ?‰")
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        const existingPost = existingSnapshot.docs[0];
        setDocId(existingPost.id);
        setSuccess(true);
        console.log("???´ë? FC88 ê¸€??ì¡´ì¬?©ë‹ˆ?? ê¸°ì¡´ ê¸€ ID:", existingPost.id);
        return;
      }

      console.log("?“ ?ˆë¡œ??FC88 ê¸€ ?ì„± ì¤?..");
      
      // 1) ?°ëª¨ ?¬ìŠ¤???ì„± (posts ì»¬ë ‰?˜ì— ?€??
             const ref = await addDoc(collection(db, "posts"), {
               title: "FC88 ê³µì‹ ë¸”ë¡œê·??¤í”ˆ ?‰",
               content:
                 "FC88 ?€ ê³µì‹ ë¸”ë¡œê·¸ê? ?¤í”ˆ?˜ì—ˆ?µë‹ˆ??\n" +
                 "?ìœ¼ë¡??´ê³³?ì„œ ?€ ?Œì‹, ê²½ê¸° ?¼ì •, ? ìˆ˜ ?¸í„°ë·? ?ˆë ¨ ?„ê¸° ?±ì„ ê³µìœ ???ˆì •?…ë‹ˆ??\n" +
                 "ë§ì? ê´€?¬ê³¼ êµ¬ë… ë¶€?ë“œë¦½ë‹ˆ???™Œ",
               authorUid: "demo-admin",
               authorName: "ê´€ë¦¬ì FC88",
               authorIcon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f59e0b'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-family='system-ui, sans-serif' font-size='16' font-weight='bold'%3EFC88%3C/text%3E%3C/svg%3E",
               thumbnailUrl: "https://picsum.photos/400/300?random=fc88", // ?¸ë„¤???´ë?ì§€ ì¶”ê?
               imageUrl: "https://picsum.photos/800/600?random=fc88", // ë©”ì¸ ?´ë?ì§€ ì¶”ê?
               teamId: null, // ?¼ë°˜ ?¬ìŠ¤??               createdAt: Date.now(),
               updatedAt: Date.now(),
               tags: ["ê³µì?", "FC88", "ë¸”ë¡œê·¸ì˜¤??],
               likes: 0,
               views: 0,
             });

      // 2) ?“ê? ?˜í”Œ ì¶”ê?
      const commentsCol = collection(db, "posts", ref.id, "comments");
      await addDoc(commentsCol, {
        content: "FC88 ?”ì´?? ?ìœ¼ë¡?ê¸€ ê¸°ë?? ê²Œ???™Œ",
        authorUid: "user-001",
        authorName: "?ê¸¸??,
               authorIcon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Crect width='50' height='50' fill='%233b82f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-family='system-ui, sans-serif' font-size='12' font-weight='bold'%3EH%3C/text%3E%3C/svg%3E",
        createdAt: Date.now(),
      });
      await addDoc(commentsCol, {
        content: "ê³µì‹ ë¸”ë¡œê·??¤í”ˆ ì¶•í•˜?œë¦½?ˆë‹¤ ?‘",
        authorUid: "user-002",
        authorName: "ê¹€ì² ìˆ˜",
               authorIcon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Crect width='50' height='50' fill='%23ef4444'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-family='system-ui, sans-serif' font-size='12' font-weight='bold'%3EK%3C/text%3E%3C/svg%3E",
        createdAt: Date.now() + 1000,
      });

      console.log("???ˆë¡œ??FC88 ê¸€ ?ì„± ?„ë£Œ:", ref.id);
      setDocId(ref.id);
      setSuccess(true);
    } catch (err) {
      console.error("?°ëª¨ ?°ì´???ì„± ?¤íŒ¨:", err);
      setSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanUpDuplicatePosts = async () => {
    try {
      console.log("?§¹ ì¤‘ë³µ ê¸€ ?•ë¦¬ ?œì‘...");
      setCleanupMessage("?•ë¦¬ ì¤?..");
      
      const snapshot = await getDocs(collection(db, "posts"));
      
      // "FC88 ê³µì‹ ë¸”ë¡œê·??¤í”ˆ ?‰" ê¸€ë§?ì°¾ê¸°
      const duplicates = snapshot.docs.filter(
        d => d.data().title === "FC88 ê³µì‹ ë¸”ë¡œê·??¤í”ˆ ?‰"
      );

      console.log("ì¤‘ë³µ ê°œìˆ˜:", duplicates.length);

      if (duplicates.length <= 1) {
        setCleanupMessage("??ì¤‘ë³µ ê¸€ ?†ìŒ. ?•ë¦¬???„ìš”ê°€ ?†ìŠµ?ˆë‹¤.");
        console.log("??ì¤‘ë³µ ê¸€ ?†ìŒ. ?•ë¦¬???„ìš”ê°€ ?†ìŠµ?ˆë‹¤.");
        return;
      }

      // ì²?ë²ˆì§¸ë§??¨ê¸°ê³??˜ë¨¸ì§€ ?? œ
      let deletedCount = 0;
      for (let i = 1; i < duplicates.length; i++) {
        await deleteDoc(doc(db, "posts", duplicates[i].id));
        console.log("?? œ ?„ë£Œ:", duplicates[i].id);
        deletedCount++;
      }

      setCleanupMessage(`?‰ ?•ë¦¬ ?„ë£Œ! ${deletedCount}ê°?ì¤‘ë³µ ê¸€ ?? œ?? 1ê°œë§Œ ?¨ì•˜?µë‹ˆ??`);
      console.log(`?‰ ?•ë¦¬ ?„ë£Œ! ${deletedCount}ê°?ì¤‘ë³µ ê¸€ ?? œ?? 1ê°œë§Œ ?¨ì•˜?µë‹ˆ??`);
      
    } catch (error) {
      console.error("???•ë¦¬ ì¤??¤ë¥˜ ë°œìƒ:", error);
      setCleanupMessage("???•ë¦¬ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
            ?Œ± ?°ëª¨ ?°ì´???ì„± ?˜ì´ì§€
          </h1>
          
          <div className="text-center mb-8">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              ë²„íŠ¼???´ë¦­?˜ë©´ FC88 ê³µì‹ ë¸”ë¡œê·??¬ìŠ¤?¸ì? ?˜í”Œ ?“ê? 2ê°œê? ?ë™?¼ë¡œ ?ì„±?©ë‹ˆ??
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
                    ?ì„± ì¤?..
                  </div>
                ) : (
                  "?? ?°ëª¨ ?¬ìŠ¤???ì„±?˜ê¸°"
                )}
              </button>
              
              <button
                onClick={cleanUpDuplicatePosts}
                className="px-6 py-4 rounded-lg font-semibold text-lg transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:scale-105 text-white shadow-lg"
              >
                ?§¹ ì¤‘ë³µ ê¸€ ?•ë¦¬?˜ê¸°
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
                  ?±ê³µ!
                </h2>
              </div>
              <div className="space-y-2 text-green-700 dark:text-green-300">
                <p>??FC88 ê³µì‹ ë¸”ë¡œê·??¤í”ˆ ?¬ìŠ¤?¸ê? ?ì„±?˜ì—ˆ?µë‹ˆ??/p>
                <p>???“ê? 2ê°?(?ê¸¸?? ê¹€ì² ìˆ˜)???¨ê»˜ ì¶”ê??˜ì—ˆ?µë‹ˆ??/p>
                <p>???¬ìŠ¤??ID: <code className="bg-green-100 dark:bg-green-800 px-2 py-1 rounded">{docId}</code></p>
              </div>
            </div>
          )}

          {success && (
            <div className="text-center">
              <Link
                to={`/posts/${docId}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors shadow-lg"
              >
                ?“– ê²Œì‹œê¸€ ë³´ê¸°
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            </div>
          )}

          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
              ?“‹ ?ì„±?˜ëŠ” ?°ì´??            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">?“ ?¬ìŠ¤??/h4>
                <ul className="space-y-1 text-blue-600 dark:text-blue-400">
                  <li>???œëª©: "FC88 ê³µì‹ ë¸”ë¡œê·??¤í”ˆ ?‰"</li>
                  <li>???‘ì„±?? ê´€ë¦¬ì FC88</li>
                  <li>???œê·¸: ê³µì?, FC88, ë¸”ë¡œê·¸ì˜¤??/li>
                  <li>??ì¢‹ì•„??ì¡°íšŒ?? 0</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">?’¬ ?“ê?</h4>
                <ul className="space-y-1 text-blue-600 dark:text-blue-400">
                  <li>???ê¸¸?? "FC88 ?”ì´?? ?ìœ¼ë¡?ê¸€ ê¸°ë?? ê²Œ???™Œ"</li>
                  <li>??ê¹€ì² ìˆ˜: "ê³µì‹ ë¸”ë¡œê·??¤í”ˆ ì¶•í•˜?œë¦½?ˆë‹¤ ?‘"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
