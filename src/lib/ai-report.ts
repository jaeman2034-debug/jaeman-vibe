import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

/**
 * AI 리포???�성 (OpenAI GPT-4o-mini)
 * @param stats ?�정 ?�계 ?�이?? * @returns AI ?�성 ?�약 ?�스?? */
export async function generateReportAI(stats: any): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error("??VITE_OPENAI_API_KEY가 ?�정?��? ?�았?�니??);
    return "OpenAI API ?��? ?�정?��? ?�았?�니??";
  }

  try {
    console.log("?�� AI 리포???�성 ?�작:", stats);

    const prompt = `
?�신?� ?�포�??� 관리자�??�한 AI 리포???�성 ?�문가?�니??
?�래 ?�계 ?�이?��? 바탕?�로 ?�간 ?�동 ?�약 리포?��? ?�성?�세??

?�계 ?�이??
- �??�정: ${stats.totalEvents}�?- 경기: ${stats.matches}�?- ?�카?��? ?�동: ${stats.academies}�?- ?�?? ${stats.tournaments}�?
?�구?�항:
1. ?�체?�인 ?�동 ?�약 (2-3문장)
2. 주요 ?�동 ?�이?�이??3. ?�음 ??권장 ?�항
4. 긍정?�이�??�기부?�되????
?�식: 간결?�고 ?�기 ?�게, ?�모지 ?�함 가??`;

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
            content: "?�신?� ?�포�??�???�한 AI 리포???�성 ?�문가?�니??",
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
      console.error("??OpenAI API ?�류:", error);
      return `AI ?�약 ?�성 ?�패: ${error.error?.message || "?????�는 ?�류"}`;
    }

    const data = await response.json();
    const summary = data.choices[0]?.message?.content || "?�약 ?�성 ?�패";
    
    console.log("??AI 리포???�성 ?�료:", summary.substring(0, 100) + "...");
    
    return summary;
  } catch (error: any) {
    console.error("??AI 리포???�성 ?�류:", error);
    return `?�류 발생: ${error.message}`;
  }
}

/**
 * ?�성??리포???�?? * @param summary AI ?�성 ?�약
 * @param stats ?�계 ?�이?? * @param type 리포???�?? */
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
      teamId: "all", // ?�체 리포??      week: type === "weekly" 
        ? `${new Date().getFullYear()}-W${getWeekNumber(new Date())}`
        : undefined,
      month: type === "monthly"
        ? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
        : undefined,
    });
    
    console.log("??리포???�???�료:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("??리포???�???�류:", error);
    throw error;
  }
}

/**
 * ISO 주차 계산
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
 * Firestore?�서 ?�정 목록 조회
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

