import { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { checkinCall } from "@/api/checkin";

export default function CheckinPage() {
  const { id: eventId } = useParams();
  const q = new URLSearchParams(useLocation().search);
  const nonce = q.get("nonce") || "";
  const [state, setState] = useState<"idle"|"ok"|"err">("idle");
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    (async () => {
      if (!eventId || !nonce) { setState("err"); setMsg("잘못된 링크입니다."); return; }
      try {
        const r = await checkinCall(eventId, nonce);
        if (r.ok) { setState("ok"); setMsg("체크인 완료! 즐거운 경기 되세요 🙌"); }
        else { setState("err"); setMsg("체크인에 실패했습니다."); }
      } catch (e:any) {
        setState("err");
        setMsg(e.message || "체크인 중 오류가 발생했습니다.");
      }
    })();
  }, [eventId, nonce]);

  return (
    <div className="max-w-md mx-auto p-6 border rounded-2xl mt-6">
      <h2 className="text-lg font-semibold mb-2">현장 체크인</h2>
      <p className={state==="ok" ? "text-green-600" : "text-gray-700"}>{msg}</p>
      <div className="mt-4">
        <Link to={`/events/${eventId}`} className="underline">이벤트로 돌아가기</Link>
      </div>
    </div>
  );
}