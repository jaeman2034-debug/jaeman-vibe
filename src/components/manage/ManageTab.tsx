import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { setEventStatus, pinNotice, kickAttendee } from "@/api/manage";
import QRCode from "qrcode";
import { createCheckinNonce } from "@/api/checkin";

export default function ManageTab() {
  const { id: eventId } = useParams();
  const [status, setStatusState] = useState<"open"|"closed">("open");
  const [notice, setNotice] = useState({ title:"", body:"" });
  const [attendees, setAttendees] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [qrExp, setQrExp] = useState<number>(0);
  const [qrLink, setQrLink] = useState<string>("");

  useEffect(() => {
    if (!eventId) return;
    const u1 = onSnapshot(doc(db,"events",eventId),(s)=>setStatusState((s.data()?.status==="closed")?"closed":"open"));
    const u2 = onSnapshot(doc(db,`events/${eventId}/notice/pinned`),(s:any)=>setNotice({ title:s.data()?.title||"", body:s.data()?.body||"" }));
    const u3 = onSnapshot(query(collection(db,`events/${eventId}/attendees`), orderBy("joinedAt","desc")), (snap)=>setAttendees(snap.docs.map(d=>({id:d.id,...d.data()}))));
    const u4 = onSnapshot(query(collection(db,`events/${eventId}/logs`), orderBy("at","desc")), (snap)=>setLogs(snap.docs.map(d=>({id:d.id,...d.data()}))));
    return ()=>{u1();u2();u3();u4();};
  }, [eventId]);

  const joined = useMemo(()=>attendees.filter(a=>a.status==="joined"),[attendees]);
  const waiting= useMemo(()=>attendees.filter(a=>a.status==="waiting"),[attendees]);

  const onSaveStatus = async (val:"open"|"closed") => {
    if (!eventId) return; setBusy(true);
    try { await setEventStatus(eventId, val); } catch(e:any){ alert(`${e.code||"error"}: ${e.message||""}`);} setBusy(false);
  };
  const onSaveNotice = async () => {
    if (!eventId) return; setBusy(true);
    try { await pinNotice(eventId, notice.title, notice.body); alert("공지 저장 완료"); } catch(e:any){ alert(`${e.code||"error"}: ${e.message||""}`);} setBusy(false);
  };
  const onKick = async (uid:string) => {
    if (!eventId) return; if (!confirm("해당 참가자를 강퇴하시겠습니까?")) return; setBusy(true);
    try { await kickAttendee(eventId, uid, ""); alert("강퇴 완료"); } catch(e:any){ alert(`${e.code||"error"}: ${e.message||""}`);} setBusy(false);
  };

  // 함수: QR 생성
  const onMakeQR = async () => {
    if (!eventId) return;
    setBusy(true);
    try {
      const r = await createCheckinNonce(eventId, 7200); // 2시간 유효
      const link = `${location.origin}/events/${eventId}/checkin?nonce=${r.nonce}`;
      const dataUrl = await QRCode.toDataURL(link, { width: 320, margin: 1 });
      setQrUrl(dataUrl);
      setQrLink(link);
      setQrExp(r.expAt);
    } catch (e: any) {
      alert(`${e.code || "error"}: ${e.message || ""}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="p-4 border rounded-2xl">
        <h3 className="font-semibold mb-3">모집 상태</h3>
        <div className="flex gap-3">
          <label className="flex items-center gap-1">
            <input type="radio" name="status" checked={status==="open"} onChange={()=>onSaveStatus("open")} disabled={busy}/>
            <span>모집 중 (open)</span>
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" name="status" checked={status==="closed"} onChange={()=>onSaveStatus("closed")} disabled={busy}/>
            <span>모집 마감 (closed)</span>
          </label>
        </div>
      </section>

      <section className="p-4 border rounded-2xl">
        <h3 className="font-semibold mb-3">공지 (핀 1개)</h3>
        <div className="grid gap-2">
          <input className="border rounded px-3 py-2" placeholder="공지 제목" value={notice.title} onChange={e=>setNotice(v=>({...v,title:e.target.value}))}/>
          <textarea className="border rounded px-3 py-2 min-h-[120px]" placeholder="공지 내용" value={notice.body} onChange={e=>setNotice(v=>({...v,body:e.target.value}))}/>
          <button className="px-3 py-2 border rounded-xl" onClick={onSaveNotice} disabled={busy}>공지 저장</button>
        </div>
      </section>

      <section className="p-4 border rounded-2xl">
        <h3 className="font-semibold mb-3">참가자 관리</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">참가 중 ({joined.length})</h4>
            <ul className="space-y-2">
              {joined.map(a=>(
                <li key={a.id} className="flex items-center justify-between border rounded px-3 py-2">
                  <span className="truncate">{a.id}</span>
                  <button className="px-2 py-1 border rounded" onClick={()=>onKick(a.id)} disabled={busy}>강퇴</button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">대기 ({waiting.length})</h4>
            <ul className="space-y-2">
              {waiting.map(a=>(
                <li key={a.id} className="flex items-center justify-between border rounded px-3 py-2">
                  <span className="truncate">{a.id}</span>
                  <button className="px-2 py-1 border rounded" onClick={()=>onKick(a.id)} disabled={busy}>강퇴</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="p-4 border rounded-2xl">
        <h3 className="font-semibold mb-3">체크인 QR</h3>
        <p className="text-sm text-gray-600 mb-2">입구에 QR을 비치하세요. 참가자가 스캔하면 본인 계정으로 체크인됩니다.</p>
        <div className="flex items-center gap-3 mb-3">
          <button className="px-3 py-2 border rounded-xl" onClick={onMakeQR} disabled={busy}>
            QR 생성/새로고침
          </button>
          {qrExp ? <span className="text-xs text-gray-500">유효 ~ {new Date(qrExp).toLocaleString()}</span> : null}
        </div>
        {qrUrl ? (
          <div className="flex items-center gap-2">
            <img src={qrUrl} alt="checkin-qr" className="border rounded-xl p-2 bg-white" />
            <button
              className="px-2 py-1 border rounded"
              onClick={() => navigator.clipboard.writeText(qrLink)}
            >
              링크 복사
            </button>
          </div>
        ) : (
          <div className="text-sm text-gray-500">아직 QR이 없습니다. "QR 생성/새로고침"을 눌러주세요.</div>
        )}
      </section>

      <section className="p-4 border rounded-2xl">
        <h3 className="font-semibold mb-3">운영 로그</h3>
        <div className="overflow-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="p-2 text-left">시간</th><th className="p-2 text-left">타입</th><th className="p-2 text-left">정보</th></tr></thead>
            <tbody>
              {logs.map(l=>(
                <tr key={l.id} className="border-t">
                  <td className="p-2">{l.at?.toDate ? l.at.toDate().toLocaleString() : ""}</td>
                  <td className="p-2">{l.type}</td>
                  <td className="p-2 text-gray-600">{JSON.stringify({ uid:l.uid, by:l.by, status:l.status, reason:l.reason })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}