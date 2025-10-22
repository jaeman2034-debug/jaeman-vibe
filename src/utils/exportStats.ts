// ?�� ?�계 ?�이??CSV ?�보?�기 ?�틸리티
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
 * ?�� 모든 메시지 ?�이?��? CSV ?�태�??�보?�기
 */
export const exportMessagesToCSV = async (startDate?: Date, endDate?: Date): Promise<string> => {
  try {
    console.log("?�� 메시지 ?�이??CSV ?�보?�기 ?�작...");

    // 메시지 쿼리 ?�정
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

    // CSV ?�더
    const csvHeader = "?�짜,?�간,채팅방ID,발신?�ID,발신?�명,메시지?�??메시지?�용\n";

    // CSV ?�이???�성
    const csvRows = messages.map((msg) => {
      const date = msg.createdAt.toISOString().split("T")[0];
      const time = msg.createdAt.toTimeString().split(" ")[0];
      const messageType = msg.isAI ? "AI" : "?�용??;
      const messageContent = `"메시지 ?�용"`; // ?�제 메시지 ?�용?� 보안???�외

      return `${date},${time},${msg.chatRoomId},${msg.senderId},"${msg.senderName}",${messageType},${messageContent}`;
    });

    const csvContent = csvHeader + csvRows.join("\n");

    console.log(`?�� CSV ?�보?�기 ?�료: ${messages.length}�?메시지`);
    return csvContent;

  } catch (error) {
    console.error("??CSV ?�보?�기 ?�패:", error);
    throw error;
  }
};

/**
 * ?�� ?�일 ?�계 ?�이?��? CSV ?�태�??�보?�기
 */
export const exportDailyStatsToCSV = async (days: number = 30): Promise<string> => {
  try {
    console.log(`?�� ?�일 ?�계 CSV ?�보?�기 ?�작 (${days}??`);

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // 모든 메시지 ?�집
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

      // AI vs ?�용??구분
      if (data.senderId === "yago-bot" || data.senderId === "AI" || data.isAI) {
        dailyStats[dateKey].aiCount++;
      } else {
        dailyStats[dateKey].sellerCount++;
      }

      // ?�답?�간 계산
      if (lastTimestamp) {
        const timeDiff = msgDate.getTime() - lastTimestamp.getTime();
        if (timeDiff > 0 && timeDiff < 30 * 60 * 1000) { // 30�??�내
          totalResponseTime += timeDiff;
          responseCount++;
        }
      }
      lastTimestamp = msgDate;
    });

    // ?�자�??�균 ?�답?�간 계산
    Object.keys(dailyStats).forEach((dateKey) => {
      const dayData = dailyStats[dateKey];
      dayData.avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount / 1000 / 60) : 0;
    });

    // CSV ?�더
    const csvHeader = "?�짜,AI?�답???�매?�응?�수,총메?��????�균?�답?�간(�?,AI?�답�?%)\n";

    // CSV ?�이???�성 (?�짜???�렬)
    const sortedDates = Object.keys(dailyStats).sort();
    const csvRows = sortedDates.map((dateKey) => {
      const stats = dailyStats[dateKey];
      const aiResponseRate = stats.totalCount > 0 ? ((stats.aiCount / stats.totalCount) * 100).toFixed(1) : "0.0";

      return `${stats.date},${stats.aiCount},${stats.sellerCount},${stats.totalCount},${stats.avgResponseTime},${aiResponseRate}`;
    });

    const csvContent = csvHeader + csvRows.join("\n");

    console.log(`?�� ?�일 ?�계 CSV ?�보?�기 ?�료: ${sortedDates.length}??);
    return csvContent;

  } catch (error) {
    console.error("???�일 ?�계 CSV ?�보?�기 ?�패:", error);
    throw error;
  }
};

/**
 * ?�� CSV ?�일 ?�운로드
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
      
      console.log(`?�� CSV ?�운로드 ?�료: ${filename}`);
    }
  } catch (error) {
    console.error("??CSV ?�운로드 ?�패:", error);
    throw error;
  }
};

/**
 * ?�� ?�체 ?�계 ?�약 ?�보?�기
 */
export const exportSummaryStats = async (): Promise<string> => {
  try {
    console.log("?�� ?�체 ?�계 ?�약 ?�보?�기 ?�작...");

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

    const summary = `YAGO VIBE AI 채팅 ?�계 ?�약
?�성?? ${new Date().toLocaleDateString()}
�?메시지 ?? ${totalMessages.toLocaleString()}
AI ?�답 ?? ${aiMessages.toLocaleString()}
?�매???�답 ?? ${sellerMessages.toLocaleString()}
?�균 ?�답?�간: ${avgResponseTime}�?AI ?�답�? ${aiResponseRate}%
`;

    console.log("?�� ?�체 ?�계 ?�약 ?�료");
    return summary;

  } catch (error) {
    console.error("???�체 ?�계 ?�약 ?�패:", error);
    throw error;
  }
};
