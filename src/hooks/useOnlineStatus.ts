import { useEffect } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../lib/firebase";

export const useOnlineStatus = () => {
  useEffect(() => {
    const user = auth.currentUser;
    
    if (!user) {
      console.log("?�️ 로그?�하지 ?�아 ?�라???�태 ?�데?�트�?건너?�니??");
      return;
    }

    const userId = user.uid;

    // ?�� ?�라???�태�??�정
    const setOnline = async () => {
      try {
        await updateDoc(doc(db, "users", userId), {
          isOnline: true,
          lastActive: serverTimestamp(),
        });
        console.log("?�� ?�라???�태�??�정:", userId);
      } catch (error) {
        console.error("???�라???�태 ?�정 ?�류:", error);
      }
    };

    // ?�� ?�프?�인 ?�태�??�정
    const setOffline = async () => {
      try {
        await updateDoc(doc(db, "users", userId), {
          isOnline: false,
          lastActive: serverTimestamp(),
        });
        console.log("?�� ?�프?�인 ?�태�??�정:", userId);
      } catch (error) {
        console.error("???�프?�인 ?�태 ?�정 ?�류:", error);
      }
    };

    // ?�이지 로드 ???�라??    setOnline();

    // ?�이지 ?�로?????�프?�인
    const handleBeforeUnload = () => {
      setOffline();
    };

    // ?�이지 가?�성 변�???    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline();
      } else {
        setOnline();
      }
    };

    // ?�벤??리스???�록
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 5분마???�라???�태 갱신 (?�트비트)
    const heartbeatInterval = setInterval(() => {
      if (!document.hidden) {
        setOnline();
      }
    }, 5 * 60 * 1000);

    // ?�린??    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(heartbeatInterval);
      setOffline();
    };
  }, []);
};

