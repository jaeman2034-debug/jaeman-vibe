import { useEffect } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../lib/firebase";

export const useOnlineStatus = () => {
  useEffect(() => {
    const user = auth.currentUser;
    
    if (!user) {
      console.log("?¹ï¸ ë¡œê·¸?¸í•˜ì§€ ?Šì•„ ?¨ë¼???íƒœ ?…ë°?´íŠ¸ë¥?ê±´ë„ˆ?ë‹ˆ??");
      return;
    }

    const userId = user.uid;

    // ?Ÿ¢ ?¨ë¼???íƒœë¡??¤ì •
    const setOnline = async () => {
      try {
        await updateDoc(doc(db, "users", userId), {
          isOnline: true,
          lastActive: serverTimestamp(),
        });
        console.log("?Ÿ¢ ?¨ë¼???íƒœë¡??¤ì •:", userId);
      } catch (error) {
        console.error("???¨ë¼???íƒœ ?¤ì • ?¤ë¥˜:", error);
      }
    };

    // ?”´ ?¤í”„?¼ì¸ ?íƒœë¡??¤ì •
    const setOffline = async () => {
      try {
        await updateDoc(doc(db, "users", userId), {
          isOnline: false,
          lastActive: serverTimestamp(),
        });
        console.log("?”´ ?¤í”„?¼ì¸ ?íƒœë¡??¤ì •:", userId);
      } catch (error) {
        console.error("???¤í”„?¼ì¸ ?íƒœ ?¤ì • ?¤ë¥˜:", error);
      }
    };

    // ?˜ì´ì§€ ë¡œë“œ ???¨ë¼??    setOnline();

    // ?˜ì´ì§€ ?¸ë¡œ?????¤í”„?¼ì¸
    const handleBeforeUnload = () => {
      setOffline();
    };

    // ?˜ì´ì§€ ê°€?œì„± ë³€ê²???    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline();
      } else {
        setOnline();
      }
    };

    // ?´ë²¤??ë¦¬ìŠ¤???±ë¡
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 5ë¶„ë§ˆ???¨ë¼???íƒœ ê°±ì‹  (?˜íŠ¸ë¹„íŠ¸)
    const heartbeatInterval = setInterval(() => {
      if (!document.hidden) {
        setOnline();
      }
    }, 5 * 60 * 1000);

    // ?´ë¦°??    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(heartbeatInterval);
      setOffline();
    };
  }, []);
};

