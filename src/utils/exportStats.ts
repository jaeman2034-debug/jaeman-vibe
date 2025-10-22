// ?“Š ?µê³„ ?°ì´??CSV ?´ë³´?´ê¸° ? í‹¸ë¦¬í‹°
import { collectionGroup, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface MessageData {
  id: string;
  senderId: string;
  senderName: string;
  createdAt: Date;
  isAI: boolean;
  chatRoomId: string;
}

export interface DailyStatsData {
  date: string;
  aiCount: number;
  sellerCount: number;
  totalCount: number;
  avgResponseTime: number;
}

/**
 * ?“Š ëª¨ë“  ë©”ì‹œì§€ ?°ì´?°ë? CSV ?•íƒœë¡??´ë³´?´ê¸°
 */
export const exportMessagesToCSV = async (startDate?: Date, endDate?: Date): Promise<string> => {
  try {
    console.log("?“Š ë©”ì‹œì§€ ?°ì´??CSV ?´ë³´?´ê¸° ?œì‘...");

    // ë©”ì‹œì§€ ì¿¼ë¦¬ ?¤ì •
    let messagesQuery = query(collectionGroup(db, "messages"), orderBy("createdAt", "desc"));
    
    if (startDate) {
      messagesQuery = query(messagesQuery, where("createdAt", ">=", startDate));
    }
    if (endDate) {
      messagesQuery = query(messagesQuery, where("createdAt", "<=", endDate));
    }

    const snapshot = await getDocs(messagesQuery);
    const messages: MessageData[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.createdAt) {
        messages.push({
          id: doc.id,
          senderId: data.senderId || "",
          senderName: data.senderName || "",
          createdAt: data.createdAt.toDate(),
          isAI: data.isAI || data.senderId === "yago-bot" || data.senderId === "AI",
          chatRoomId: doc.ref.parent.parent?.id || "",
        });
      }
    });

    // CSV ?¤ë”
    const csvHeader = "? ì§œ,?œê°„,ì±„íŒ…ë°©ID,ë°œì‹ ?ID,ë°œì‹ ?ëª…,ë©”ì‹œì§€?€??ë©”ì‹œì§€?´ìš©\n";

    // CSV ?°ì´???ì„±
    const csvRows = messages.map((msg) => {
      const date = msg.createdAt.toISOString().split("T")[0];
      const time = msg.createdAt.toTimeString().split(" ")[0];
      const messageType = msg.isAI ? "AI" : "?¬ìš©??;
      const messageContent = `"ë©”ì‹œì§€ ?´ìš©"`; // ?¤ì œ ë©”ì‹œì§€ ?´ìš©?€ ë³´ì•ˆ???œì™¸

      return `${date},${time},${msg.chatRoomId},${msg.senderId},"${msg.senderName}",${messageType},${messageContent}`;
    });

    const csvContent = csvHeader + csvRows.join("\n");

    console.log(`?“Š CSV ?´ë³´?´ê¸° ?„ë£Œ: ${messages.length}ê°?ë©”ì‹œì§€`);
    return csvContent;

  } catch (error) {
    console.error("??CSV ?´ë³´?´ê¸° ?¤íŒ¨:", error);
    throw error;
  }
};

/**
 * ?“Š ?¼ì¼ ?µê³„ ?°ì´?°ë? CSV ?•íƒœë¡??´ë³´?´ê¸°
 */
export const exportDailyStatsToCSV = async (days: number = 30): Promise<string> => {
  try {
    console.log(`?“Š ?¼ì¼ ?µê³„ CSV ?´ë³´?´ê¸° ?œì‘ (${days}??`);

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // ëª¨ë“  ë©”ì‹œì§€ ?˜ì§‘
    const messagesQuery = query(
      collectionGroup(db, "messages"),
      where("createdAt", ">=", startDate),
      where("createdAt", "<=", endDate),
      orderBy("createdAt", "asc")
    );

    const snapshot = await getDocs(messagesQuery);
    const dailyStats: { [key: string]: DailyStatsData } = {};

    let lastTimestamp: Date | null = null;
    let totalResponseTime = 0;
    let responseCount = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const msgDate = data.createdAt?.toDate();
      
      if (!msgDate) return;

      const dateKey = msgDate.toISOString().split("T")[0];
      
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = {
          date: dateKey,
          aiCount: 0,
          sellerCount: 0,
          totalCount: 0,
          avgResponseTime: 0,
        };
      }

      dailyStats[dateKey].totalCount++;

      // AI vs ?¬ìš©??êµ¬ë¶„
      if (data.senderId === "yago-bot" || data.senderId === "AI" || data.isAI) {
        dailyStats[dateKey].aiCount++;
      } else {
        dailyStats[dateKey].sellerCount++;
      }

      // ?‘ë‹µ?œê°„ ê³„ì‚°
      if (lastTimestamp) {
        const timeDiff = msgDate.getTime() - lastTimestamp.getTime();
        if (timeDiff > 0 && timeDiff < 30 * 60 * 1000) { // 30ë¶??´ë‚´
          totalResponseTime += timeDiff;
          responseCount++;
        }
      }
      lastTimestamp = msgDate;
    });

    // ?¼ìë³??‰ê·  ?‘ë‹µ?œê°„ ê³„ì‚°
    Object.keys(dailyStats).forEach((dateKey) => {
      const dayData = dailyStats[dateKey];
      dayData.avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount / 1000 / 60) : 0;
    });

    // CSV ?¤ë”
    const csvHeader = "? ì§œ,AI?‘ë‹µ???ë§¤?ì‘?µìˆ˜,ì´ë©”?œì????‰ê· ?‘ë‹µ?œê°„(ë¶?,AI?‘ë‹µë¥?%)\n";

    // CSV ?°ì´???ì„± (? ì§œ???•ë ¬)
    const sortedDates = Object.keys(dailyStats).sort();
    const csvRows = sortedDates.map((dateKey) => {
      const stats = dailyStats[dateKey];
      const aiResponseRate = stats.totalCount > 0 ? ((stats.aiCount / stats.totalCount) * 100).toFixed(1) : "0.0";

      return `${stats.date},${stats.aiCount},${stats.sellerCount},${stats.totalCount},${stats.avgResponseTime},${aiResponseRate}`;
    });

    const csvContent = csvHeader + csvRows.join("\n");

    console.log(`?“Š ?¼ì¼ ?µê³„ CSV ?´ë³´?´ê¸° ?„ë£Œ: ${sortedDates.length}??);
    return csvContent;

  } catch (error) {
    console.error("???¼ì¼ ?µê³„ CSV ?´ë³´?´ê¸° ?¤íŒ¨:", error);
    throw error;
  }
};

/**
 * ?“ CSV ?Œì¼ ?¤ìš´ë¡œë“œ
 */
export const downloadCSV = (csvContent: string, filename: string) => {
  try {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`?“ CSV ?¤ìš´ë¡œë“œ ?„ë£Œ: ${filename}`);
    }
  } catch (error) {
    console.error("??CSV ?¤ìš´ë¡œë“œ ?¤íŒ¨:", error);
    throw error;
  }
};

/**
 * ?“Š ?„ì²´ ?µê³„ ?”ì•½ ?´ë³´?´ê¸°
 */
export const exportSummaryStats = async (): Promise<string> => {
  try {
    console.log("?“Š ?„ì²´ ?µê³„ ?”ì•½ ?´ë³´?´ê¸° ?œì‘...");

    const messagesQuery = query(collectionGroup(db, "messages"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(messagesQuery);
    
    let totalMessages = 0;
    let aiMessages = 0;
    let sellerMessages = 0;
    let totalResponseTime = 0;
    let responseCount = 0;
    let lastTimestamp: Date | null = null;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const msgDate = data.createdAt?.toDate();
      
      if (!msgDate) return;

      totalMessages++;

      if (data.senderId === "yago-bot" || data.senderId === "AI" || data.isAI) {
        aiMessages++;
      } else {
        sellerMessages++;
      }

      if (lastTimestamp) {
        const timeDiff = msgDate.getTime() - lastTimestamp.getTime();
        if (timeDiff > 0 && timeDiff < 30 * 60 * 1000) {
          totalResponseTime += timeDiff;
          responseCount++;
        }
      }
      lastTimestamp = msgDate;
    });

    const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount / 1000 / 60) : 0;
    const aiResponseRate = totalMessages > 0 ? ((aiMessages / totalMessages) * 100).toFixed(1) : "0.0";

    const summary = `YAGO VIBE AI ì±„íŒ… ?µê³„ ?”ì•½
?ì„±?? ${new Date().toLocaleDateString()}
ì´?ë©”ì‹œì§€ ?? ${totalMessages.toLocaleString()}
AI ?‘ë‹µ ?? ${aiMessages.toLocaleString()}
?ë§¤???‘ë‹µ ?? ${sellerMessages.toLocaleString()}
?‰ê·  ?‘ë‹µ?œê°„: ${avgResponseTime}ë¶?AI ?‘ë‹µë¥? ${aiResponseRate}%
`;

    console.log("?“Š ?„ì²´ ?µê³„ ?”ì•½ ?„ë£Œ");
    return summary;

  } catch (error) {
    console.error("???„ì²´ ?µê³„ ?”ì•½ ?¤íŒ¨:", error);
    throw error;
  }
};
