import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

/**
 * AI ë¦¬í¬???ì„± (OpenAI GPT-4o-mini)
 * @param stats ?¼ì • ?µê³„ ?°ì´?? * @returns AI ?ì„± ?”ì•½ ?ìŠ¤?? */
export async function generateReportAI(stats: any): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error("??VITE_OPENAI_API_KEYê°€ ?¤ì •?˜ì? ?Šì•˜?µë‹ˆ??);
    return "OpenAI API ?¤ê? ?¤ì •?˜ì? ?Šì•˜?µë‹ˆ??";
  }

  try {
    console.log("?§  AI ë¦¬í¬???ì„± ?œì‘:", stats);

    const prompt = `
?¹ì‹ ?€ ?¤í¬ì¸??€ ê´€ë¦¬ìë¥??„í•œ AI ë¦¬í¬???ì„± ?„ë¬¸ê°€?…ë‹ˆ??
?„ë˜ ?µê³„ ?°ì´?°ë? ë°”íƒ•?¼ë¡œ ?”ê°„ ?œë™ ?”ì•½ ë¦¬í¬?¸ë? ?‘ì„±?˜ì„¸??

?µê³„ ?°ì´??
- ì´??¼ì •: ${stats.totalEvents}ê°?- ê²½ê¸°: ${stats.matches}ê°?- ?„ì¹´?°ë? ?œë™: ${stats.academies}ê°?- ?€?? ${stats.tournaments}ê°?
?”êµ¬?¬í•­:
1. ?„ì²´?ì¸ ?œë™ ?”ì•½ (2-3ë¬¸ì¥)
2. ì£¼ìš” ?œë™ ?˜ì´?¼ì´??3. ?¤ìŒ ??ê¶Œì¥ ?¬í•­
4. ê¸ì •?ì´ê³??™ê¸°ë¶€?¬ë˜????
?•ì‹: ê°„ê²°?˜ê³  ?½ê¸° ?½ê²Œ, ?´ëª¨ì§€ ?¬í•¨ ê°€??`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "?¹ì‹ ?€ ?¤í¬ì¸??€???„í•œ AI ë¦¬í¬???ì„± ?„ë¬¸ê°€?…ë‹ˆ??",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("??OpenAI API ?¤ë¥˜:", error);
      return `AI ?”ì•½ ?ì„± ?¤íŒ¨: ${error.error?.message || "?????†ëŠ” ?¤ë¥˜"}`;
    }

    const data = await response.json();
    const summary = data.choices[0]?.message?.content || "?”ì•½ ?ì„± ?¤íŒ¨";
    
    console.log("??AI ë¦¬í¬???ì„± ?„ë£Œ:", summary.substring(0, 100) + "...");
    
    return summary;
  } catch (error: any) {
    console.error("??AI ë¦¬í¬???ì„± ?¤ë¥˜:", error);
    return `?¤ë¥˜ ë°œìƒ: ${error.message}`;
  }
}

/**
 * ?ì„±??ë¦¬í¬???€?? * @param summary AI ?ì„± ?”ì•½
 * @param stats ?µê³„ ?°ì´?? * @param type ë¦¬í¬???€?? */
export async function saveReport(
  summary: string,
  stats: any,
  type: "weekly" | "monthly"
) {
  try {
    const col = collection(db, "reports");
    const docRef = await addDoc(col, {
      summary,
      stats,
      type,
      createdAt: serverTimestamp(),
      generatedBy: "ai-system",
      teamId: "all", // ?„ì²´ ë¦¬í¬??      week: type === "weekly" 
        ? `${new Date().getFullYear()}-W${getWeekNumber(new Date())}`
        : undefined,
      month: type === "monthly"
        ? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
        : undefined,
    });
    
    console.log("??ë¦¬í¬???€???„ë£Œ:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("??ë¦¬í¬???€???¤ë¥˜:", error);
    throw error;
  }
}

/**
 * ISO ì£¼ì°¨ ê³„ì‚°
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

/**
 * Firestore?ì„œ ?¼ì • ëª©ë¡ ì¡°íšŒ
 */
export async function listSchedules() {
  const { collection, getDocs, query, orderBy } = await import("firebase/firestore");
  const q = query(collection(db, "schedules"), orderBy("start", "desc"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title || "",
      type: data.type || "other",
      start: data.start?.toDate() || new Date(),
      end: data.end?.toDate() || new Date(),
      location: data.location || "",
      teamId: data.teamId || "",
    };
  });
}

