import { httpsCallable } from "firebase/functions";
import { functions, auth } from "@/lib/firebase";
import { useState } from "react";

function AIGenerateButtons({ 
  clubId, 
  memo,
  setMemo,
  onFill 
}: { 
  clubId: string, 
  memo: string,
  setMemo: (memo: string) => void,
  onFill: (v: { title: string, content: string, summary?: string, tags?: string[] }) => void 
}) {
  const [sport, setSport] = useState("soccer");
  const [loading, setLoading] = useState(false);
  const gen = httpsCallable(functions, "aiGenerateClubBlog");

  const call = async (autopublish: boolean) => {
    const uid = auth.currentUser?.uid; 
    if (!uid) return alert("로그인이 필요합니다.");
    
    if (!memo.trim()) {
      alert("메모를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      // 간단한 AI 템플릿 생성 (실제로는 OpenAI API 호출)
      const sportKo = {
        soccer: "축구", futsal: "풋살", basketball: "농구", baseball: "야구",
        tennis: "테니스", badminton: "배드민턴", tabletennis: "탁구", running: "러닝"
      }[sport] || sport;

      const aiTitle = `[AI 생성] ${memo}`;
      const aiContent = `# ${memo}

안녕하세요! ${sportKo} 클럽에서 ${memo}에 대해 알려드립니다.

## 📅 일정
- **날짜**: 추후 공지
- **시간**: 추후 공지  
- **장소**: 추후 공지

## 📝 참가 방법
1. 클럽에 가입
2. 참가 신청
3. 확인 대기

## 💰 참가비
- **회비**: 추후 공지
- **포함 사항**: 경기장 대여비, 간식비

## 📞 문의
클럽 관리자에게 문의해주세요.

## 🏷️ 태그
#${sportKo} #모집 #클럽 #운동

감사합니다!`;

      const aiSummary = `${memo}에 대한 ${sportKo} 클럽 공지사항입니다.`;
      const aiTags = [sportKo, "모집", "클럽", "운동"];

      if (!autopublish) {
        onFill({ 
          title: aiTitle, 
          content: aiContent, 
          summary: aiSummary, 
          tags: aiTags 
        });
        alert("AI 초안이 채워졌어요. 확인 후 발행하세요!");
      } else {
        // 바로 발행 (실제 Firestore에 저장)
        try {
          const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase');
          
          await addDoc(collection(db, `clubs/${clubId}/blog`), {
            clubId,
            title: aiTitle,
            content: aiContent,
            summary: aiSummary,
            tags: aiTags,
            authorUid: uid,
            published: true,
            pinned: false,
            createdAt: serverTimestamp(),
            generatedByAI: true,
            sport
          });
          
          alert("AI가 바로 발행했습니다!");
          window.location.assign(`/clubs/${clubId}/blog`);
        } catch (error) {
          console.error('발행 오류:', error);
          alert('발행 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
      }
    } catch (error: any) {
      console.error('AI 생성 오류:', error);
      alert(`AI 작성 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 p-3 border rounded bg-blue-50">
      <div className="text-sm text-gray-600">메모만 적으면 AI가 글을 만들어 줍니다.</div>
      <textarea 
        rows={4} 
        value={memo} 
        onChange={e => setMemo(e.target.value)} 
        placeholder="예) 60대 축구팀 새 회원 모집, 토요일 오전 8~11시 소흘 체육공원, 회비 월 2만원, 연락처…" 
        className="w-full px-3 py-2 border rounded"
        disabled={loading}
      />
      <div className="flex gap-2 items-center">
        <select 
          value={sport} 
          onChange={e => setSport(e.target.value)} 
          className="px-3 py-1 border rounded"
          disabled={loading}
        >
          <option value="soccer">축구</option>
          <option value="futsal">풋살</option>
          <option value="basketball">농구</option>
          <option value="baseball">야구</option>
          <option value="tennis">테니스</option>
          <option value="badminton">배드민턴</option>
          <option value="tabletennis">탁구</option>
          <option value="running">러닝</option>
        </select>
        <button 
          type="button" 
          onClick={() => call(false)} 
          className="px-3 py-1 border rounded hover:bg-gray-50"
          disabled={loading}
        >
          {loading ? "AI 작성 중..." : "✨ AI로 작성"}
        </button>
        <button 
          type="button" 
          onClick={() => call(true)} 
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? "AI 발행 중..." : "⚡ AI로 바로 발행"}
        </button>
      </div>
    </div>
  );
}

export default AIGenerateButtons;
