// src/blog/AIMediaGenerateButtons.tsx
import { httpsCallable } from "firebase/functions";
import { functions, auth } from "@/lib/firebase";
import { useState } from "react";

function AIMediaGenerateButtons({ 
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
  const gen = httpsCallable(functions, "aiGenerateClubMedia");

  const call = async (autopublish: boolean) => {
    const uid = auth.currentUser?.uid; 
    if (!uid) return alert("로그인이 필요합니다.");
    
    if (!memo.trim()) {
      alert("메모를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      // 실제 AI 이미지+영상 생성 함수 호출
      const res: any = await gen({ 
        clubId, 
        memo: memo.trim(), 
        sport, 
        makeVideo: true,  // 영상까지 생성!
        autopublish 
      });
      
      const d = res.data || {};
      if (!autopublish) {
        onFill({ 
          title: d.title, 
          content: d.content || d.content_markdown, 
          summary: d.summary, 
          tags: d.tags 
        });
        alert("AI 미디어 초안이 채워졌어요. 확인 후 발행하세요!");
      } else {
        alert("AI가 실제 이미지+영상과 함께 바로 발행했습니다!");
        window.location.assign(`/clubs/${clubId}/blog`);
      }
    } catch (error: any) {
      console.error('AI 미디어 생성 오류:', error);
      if (error.code === 'functions/rate-limit-exceeded') {
        alert('AI 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.');
      } else if (error.code === 'functions/permission-denied') {
        alert('권한이 없습니다. 클럽 관리자에게 문의하세요.');
      } else {
        alert(`AI 미디어 작성 중 오류가 발생했습니다: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 p-4 border rounded bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="text-sm text-gray-600 font-medium">
            🎨 AI 미디어 생성 - 메모만 적으면 실제 AI 이미지 3장 + 15초 영상 1개가 자동 생성됩니다!
          </div>
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
          className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "AI 미디어 생성 중..." : "🎨 AI로 미디어 작성"}
        </button>
        <button 
          type="button" 
          onClick={() => call(true)} 
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "AI 미디어 발행 중..." : "⚡ AI로 바로 발행"}
        </button>
      </div>
      <div className="text-xs text-gray-500">
        ✨ 히어로 이미지 1장 + 썸네일 2장 + 15초 영상이 자동 생성됩니다
      </div>
    </div>
  );
}

export default AIMediaGenerateButtons;
