// ?�� ?�스??모드: 로그???�이??채팅�??�스??가??import { useEffect, useState } from "react";
import { getFirestore, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function ChatTestMode() {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const db = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        console.log("??로그?�된 ?�용??", user.uid);
      } else {
        console.log("?�️ 로그?�되지 ?�음 - ?�스??모드�?진행");
        // ?�� ?�스??모드: 로그?????�어 ?�어???�과
        setChats([
          { 
            id: "demo-1", 
            productTitle: "?�스???�품 1", 
            lastMessage: "?�녕?�세?? ?�품??관?�이 ?�어??,
            participants: ["demo-user-1", "demo-user-2"]
          },
          { 
            id: "demo-2", 
            productTitle: "?�스???�품 2", 
            lastMessage: "가�??�상 가?�한가??",
            participants: ["demo-user-1", "demo-user-3"]
          }
        ]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    console.log("?�� 채팅�?목록 로딩 ?�작 - ?�용??", user.uid);

    // ???�제 Firestore?�서 ?�이??가?�오�?    const q = query(collection(db, "chats"), orderBy("lastMessageAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChats(data);
        setLoading(false);
        console.log("???�제 채팅�?로딩 ?�공:", data.length, "�?);
      },
      (error) => {
        console.error("??Firestore ?�러:", error);
        console.error("?�류 코드:", error.code);
        console.error("?�류 메시지:", error.message);
        
        // ?�러 발생 ???�모 ?�이?�로 ?�백
        setChats([
          { 
            id: "error-demo", 
            productTitle: "Firestore ?�결 ?�류", 
            lastMessage: "?�제 ?�이?��? 불러?????�습?�다",
            participants: ["error-user"]
          }
        ]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, db]);

  if (loading) return (
    <div className="p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p>?�� 채팅방을 불러?�는 �?..</p>
    </div>
  );

  return (
    <div className="p-4 space-y-2">
      <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-3 mb-4">
        <div className="flex items-center">
          <span className="text-yellow-600 text-xl mr-2">?�️</span>
          <div>
            <h3 className="font-semibold text-yellow-800">?�스??모드</h3>
            <p className="text-sm text-yellow-700">
              {user ? "?�제 Firestore ?�이?? : "?�모 ?�이???�시 �?}
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-3">
        ?�� 채팅�?목록 ({chats.length}�?
      </h2>
      
      {chats.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">?��</div>
          <p className="text-gray-600">?�록??채팅방이 ?�습?�다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className="border rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">
                    {chat.productTitle || "?�목 ?�음"}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    마�?�?메시지: {chat.lastMessage || "?�음"}
                  </p>
                  <p className="text-xs text-gray-400">
                    참여?? {chat.participants?.join(", ") || "?�음"}
                  </p>
                </div>
                <div className="ml-4">
                  <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">?�� ?�스???�보</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>??로그???�태: {user ? `??${user.email}` : "??로그???�됨"}</li>
          <li>??Firestore ?�결: {user ? "?�제 ?�이?? : "?�모 ?�이??}</li>
          <li>???��??�이?? http://127.0.0.1:54011/firestore</li>
        </ul>
      </div>
    </div>
  );
}
