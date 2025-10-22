import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  collection, query, where, orderBy, limit, onSnapshot,
  addDoc, serverTimestamp, doc, getDoc, updateDoc, arrayUnion, arrayRemove
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

/** ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
 *  TeamDashboard
 *  - 경로: /group/:teamId  (?�우???�시???�단)
 *  - ?�이?�는 "flat 컬렉??+ teamId ?�드" 방식?�로 간단???�계
 *  - ?�기/?�기 모두 ???�일 ?�에??바로 ?�작
 *  - Tailwind UI (?�플, 모바???�선)
 *  ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?� */

type Team = {
  id: string;
  name: string;
  logo?: string;
  location?: string;
  description?: string;
};

type Member = {
  id: string;
  teamId: string;
  uid?: string;
  name: string;
  position?: string;
  phone?: string;
  role: "coach" | "manager" | "member";
  photoURL?: string;
};

type Schedule = {
  id: string;
  teamId: string;
  date: string;       // ISO(YYYY-MM-DD)�??�??  title: string;
  location?: string;
  type?: string;
  createdBy?: string;
  attendance?: string[]; // 참석 uid 배열
  createdAt?: any;
};

type Fee = {
  id: string;
  teamId: string;
  memberId: string;
  month: string;      // "2025-10"
  amount: number;
  status: "paid" | "unpaid";
  note?: string;
};

type Notice = {
  id: string;
  teamId: string;
  title: string;
  content: string;
  author: string;
  createdAt?: any;
};

type Report = {
  id: string;
  teamId: string;
  week: string; // "2025-W41"
  summary: string;
  aiSentiment?: "positive" | "neutral" | "negative";
  highlights?: string[];
  createdAt?: any;
};

export default function TeamDashboard() {
  const { teamId } = useParams();
  const [me, setMe] = useState<any>(null);        // 로그???�용??  const [myRole, setMyRole] = useState<"admin" | "coach" | "manager" | "member" | null>(null);

  // 기본 ?�보
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  // ???�태
  const [newSchedule, setNewSchedule] = useState<Partial<Schedule>>({ date: "", title: "", location: "" });
  const [newNotice, setNewNotice] = useState<Partial<Notice>>({ title: "", content: "" });
  const [newMember, setNewMember] = useState<Partial<Member>>({ name: "", role: "member", position: "" });
  const [newFee, setNewFee] = useState<Partial<Fee>>({ month: "", amount: 0, memberId: "", status: "paid" });

  // 로그??감�? & ??권한 ?�인
  useEffect(() => {
    const un = onAuthStateChanged(auth, async (user) => {
      setMe(user);
      if (!user || !teamId) { setMyRole(null); return; }
      // users/{uid}.role === "admin" �??�체 관리자.
      // ?� 멤버 ??��?� members?�서 teamId + uid�??�인.
      const uSnap = await getDoc(doc(db, "users", user.uid));
      const isGlobalAdmin = uSnap.exists() && uSnap.data()?.role === "admin";
      if (isGlobalAdmin) { setMyRole("admin"); return; }

      // ?� 멤버 ??��
      const mQ = query(collection(db, "members"),
        where("teamId", "==", teamId),
        where("uid", "==", user.uid));
      const off = onSnapshot(mQ, (snap) => {
        const m = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Member[];
        if (m[0]?.role === "coach") setMyRole("coach");
        else if (m[0]?.role === "manager") setMyRole("manager");
        else if (m[0]) setMyRole("member");
        else setMyRole(null);
      });
      return () => off(); // cleanup
    });
    return () => un();
  }, [teamId]);

  // ?�, 멤버, ?�정, ?�비, 공�?, 리포???�시�?구독
  useEffect(() => {
    if (!teamId) return;
    
    // ?� ?�보 조회 (teams 컬렉?�에 id ?�드가 teamId?� 같�? 문서)
    const offTeam = onSnapshot(
      query(collection(db, "teams"), where("id", "==", teamId), limit(1)),
      (snap) => {
        const t = snap.docs[0]?.data() as Team | undefined;
        setTeam(t ?? null);
      }
    );

    const offMembers = onSnapshot(
      query(collection(db, "members"), where("teamId", "==", teamId), orderBy("name")),
      (snap) => setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Member[])
    );

    const offSchedules = onSnapshot(
      query(collection(db, "schedules"), where("teamId", "==", teamId), orderBy("date"), limit(20)),
      (snap) => setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Schedule[])
    );

    const offFees = onSnapshot(
      query(collection(db, "fees"), where("teamId", "==", teamId), orderBy("month", "desc"), limit(120)),
      (snap) => setFees(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Fee[])
    );

    const offNotices = onSnapshot(
      query(collection(db, "notices"), where("teamId", "==", teamId), orderBy("createdAt", "desc"), limit(10)),
      (snap) => setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Notice[])
    );

    const offReports = onSnapshot(
      query(collection(db, "reports"), where("teamId", "==", teamId), orderBy("createdAt", "desc"), limit(6)),
      (snap) => setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Report[])
    );

    return () => { offTeam(); offMembers(); offSchedules(); offFees(); offNotices(); offReports(); };
  }, [teamId]);

  const isAdminLike = useMemo(() => ["admin", "coach", "manager"].includes(String(myRole)), [myRole]);

  // ?�정 ?�성
  const createSchedule = async () => {
    if (!teamId || !newSchedule.title || !newSchedule.date) return;
    await addDoc(collection(db, "schedules"), {
      teamId, title: newSchedule.title, date: newSchedule.date,
      location: newSchedule.location || "", type: newSchedule.type || "match",
      createdBy: me?.uid || "system", createdAt: serverTimestamp(), attendance: []
    });
    setNewSchedule({ date: "", title: "", location: "" });
  };

  // 출석 ?��?
  const toggleAttendance = async (s: Schedule) => {
    if (!me) return;
    const ref = doc(db, "schedules", s.id);
    const joined = s.attendance?.includes(me.uid);
    await updateDoc(ref, { attendance: joined ? arrayRemove(me.uid) : arrayUnion(me.uid) });
  };

  // 공�? ?�성
  const createNotice = async () => {
    if (!teamId || !newNotice.title) return;
    await addDoc(collection(db, "notices"), {
      teamId, title: newNotice.title, content: newNotice.content || "",
      author: me?.displayName || "관리자", createdAt: serverTimestamp()
    });
    setNewNotice({ title: "", content: "" });
  };

  // 멤버 추�? (간단 버전)
  const createMember = async () => {
    if (!teamId || !newMember.name) return;
    await addDoc(collection(db, "members"), {
      teamId, name: newMember.name, position: newMember.position || "",
      role: newMember.role || "member", phone: newMember.phone || "",
      photoURL: newMember.photoURL || "", uid: newMember.uid || null
    });
    setNewMember({ name: "", role: "member", position: "" });
  };

  // ?�비 기록 추�?
  const createFee = async () => {
    if (!teamId || !newFee.memberId || !newFee.month) return;
    await addDoc(collection(db, "fees"), {
      teamId, memberId: newFee.memberId, month: newFee.month,
      amount: Number(newFee.amount || 0), status: newFee.status || "paid", note: newFee.note || ""
    });
    setNewFee({ month: "", amount: 0, memberId: "", status: "paid" });
  };

  const paidCount = fees.filter(f => f.status === "paid").length;
  const unpaidCount = fees.filter(f => f.status === "unpaid").length;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto pb-24">
      {/* ?�더 */}
      <header className="bg-white rounded-2xl shadow p-4 mb-6 flex items-center gap-4">
        {team?.logo && <img src={team.logo} alt="logo" className="w-12 h-12 rounded-xl object-cover" />}
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold">{team?.name || "?�"}</h1>
          <p className="text-sm text-gray-500">{team?.location || "?�치 ?�보 ?�음"}</p>
        </div>
        {isAdminLike && (
          <Link to={`/group/${teamId}/settings`} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:opacity-90">
            ?�️ 관�?          </Link>
        )}
      </header>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ?�정 */}
        <section className="lg:col-span-2 bg-white rounded-2xl shadow p-4">
          <h2 className="text-lg font-bold mb-3">?�� ?�번/?�음 ?�정</h2>
          <div className="space-y-2">
            {schedules.length === 0 && <p className="text-gray-500 text-sm">?�록???�정???�습?�다.</p>}
            {schedules.map((s) => (
              <div key={s.id} className="flex items-center justify-between border rounded-xl p-3">
                <div>
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-xs text-gray-500">{s.date} · {s.location || "?�소 미정"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">참석 {s.attendance?.length || 0}</span>
                  {me && (
                    <button
                      onClick={() => toggleAttendance(s)}
                      className={`px-3 py-1 rounded-lg text-sm border transition-colors
                        ${s.attendance?.includes(me.uid) ? "bg-green-100 text-green-700 border-green-300" : "hover:bg-gray-50"}`}
                    >
                      {s.attendance?.includes(me.uid) ? "참석취소" : "참석"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isAdminLike && (
            <div className="mt-4 bg-gray-50 rounded-xl p-3">
              <p className="text-sm font-semibold mb-2">+ ?�정 추�?</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <input className="border rounded-lg p-2" placeholder="?�목"
                  value={newSchedule.title || ""} onChange={e => setNewSchedule(v => ({ ...v, title: e.target.value }))}/>
                <input type="date" className="border rounded-lg p-2"
                  value={newSchedule.date || ""} onChange={e => setNewSchedule(v => ({ ...v, date: e.target.value }))}/>
                <input className="border rounded-lg p-2" placeholder="?�소"
                  value={newSchedule.location || ""} onChange={e => setNewSchedule(v => ({ ...v, location: e.target.value }))}/>
                <button onClick={createSchedule} className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">추�?</button>
              </div>
            </div>
          )}
        </section>

        {/* 공�? */}
        <section className="bg-white rounded-2xl shadow p-4">
          <h2 className="text-lg font-bold mb-3">?�� 공�??�항</h2>
          <div className="space-y-3">
            {notices.length === 0 && <p className="text-gray-500 text-sm">공�? ?�음</p>}
            {notices.map(n => (
              <div key={n.id} className="border rounded-xl p-3">
                <p className="font-semibold">{n.title}</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{n.content}</p>
                <p className="text-xs text-gray-400 mt-1">by {n.author}</p>
              </div>
            ))}
          </div>

          {isAdminLike && (
            <div className="mt-4 bg-gray-50 rounded-xl p-3">
              <p className="text-sm font-semibold mb-2">+ 공�? ?�성</p>
              <input className="border rounded-lg p-2 w-full mb-2" placeholder="?�목"
                value={newNotice.title || ""} onChange={e => setNewNotice(v => ({ ...v, title: e.target.value }))}/>
              <textarea className="border rounded-lg p-2 w-full mb-2" rows={3} placeholder="?�용"
                value={newNotice.content || ""} onChange={e => setNewNotice(v => ({ ...v, content: e.target.value }))}/>
              <button onClick={createNotice} className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">?�록</button>
            </div>
          )}
        </section>

        {/* ?�비 */}
        <section className="lg:col-span-3 bg-white rounded-2xl shadow p-4">
          <h2 className="text-lg font-bold mb-3">?�� ?�비 ?�황</h2>
          <p className="text-sm mb-3">???��? {paidCount}�?· ??미납 {unpaidCount}�?/p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {fees.slice(0, 24).map(f => (
              <div key={f.id} className={`rounded-xl p-2 border text-sm ${f.status === "paid" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <p className="font-semibold">{members.find(m => m.id === f.memberId)?.name || "?�원"}</p>
                <p className="text-xs text-gray-500">{f.month}</p>
                <p className="text-xs">{f.amount?.toLocaleString()}??/p>
              </div>
            ))}
          </div>

          {isAdminLike && (
            <div className="mt-4 bg-gray-50 rounded-xl p-3">
              <p className="text-sm font-semibold mb-2">+ ?�비 기록 추�?</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <select className="border rounded-lg p-2"
                  value={newFee.memberId || ""}
                  onChange={e => setNewFee(v => ({ ...v, memberId: e.target.value }))}>
                  <option value="">?�원 ?�택</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <input className="border rounded-lg p-2" placeholder="2025-10"
                  value={newFee.month || ""} onChange={e => setNewFee(v => ({ ...v, month: e.target.value }))}/>
                <input className="border rounded-lg p-2" type="number" placeholder="금액"
                  value={String(newFee.amount ?? "")} onChange={e => setNewFee(v => ({ ...v, amount: Number(e.target.value) }))}/>
                <select className="border rounded-lg p-2"
                  value={newFee.status || "paid"} onChange={e => setNewFee(v => ({ ...v, status: e.target.value as any }))}>
                  <option value="paid">?��?</option>
                  <option value="unpaid">미납</option>
                </select>
                <button onClick={createFee} className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">추�?</button>
              </div>
            </div>
          )}
        </section>

        {/* 멤버 */}
        <section className="lg:col-span-2 bg-white rounded-2xl shadow p-4">
          <h2 className="text-lg font-bold mb-3">?�� ?� 멤버 ({members.length}�?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {members.map(m => (
              <div key={m.id} className="border rounded-xl p-3 flex flex-col items-center gap-2">
                <img src={m.photoURL || "https://placehold.co/48x48"} alt={m.name} className="w-12 h-12 rounded-xl object-cover" />
                <div className="text-center">
                  <p className="font-semibold text-sm">{m.name}</p>
                  <p className="text-xs text-gray-500">{m.position || "?��???미정"}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border inline-block mt-1
                    ${m.role === "coach" ? "border-purple-300 text-purple-700" :
                      m.role === "manager" ? "border-blue-300 text-blue-700" : "border-gray-300 text-gray-600"}`}>
                    {m.role}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {isAdminLike && (
            <div className="mt-4 bg-gray-50 rounded-xl p-3">
              <p className="text-sm font-semibold mb-2">+ 멤버 추�?</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <input className="border rounded-lg p-2" placeholder="?�름"
                  value={newMember.name || ""} onChange={e => setNewMember(v => ({ ...v, name: e.target.value }))}/>
                <input className="border rounded-lg p-2" placeholder="?��???
                  value={newMember.position || ""} onChange={e => setNewMember(v => ({ ...v, position: e.target.value }))}/>
                <select className="border rounded-lg p-2"
                  value={newMember.role || "member"} onChange={e => setNewMember(v => ({ ...v, role: e.target.value as any }))}>
                  <option value="member">member</option>
                  <option value="manager">manager</option>
                  <option value="coach">coach</option>
                </select>
                <input className="border rounded-lg p-2" placeholder="?�화 (?�션)"
                  value={newMember.phone || ""} onChange={e => setNewMember(v => ({ ...v, phone: e.target.value }))}/>
                <button onClick={createMember} className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">추�?</button>
              </div>
            </div>
          )}
        </section>

        {/* 리포??*/}
        <section className="lg:col-span-1 bg-white rounded-2xl shadow p-4">
          <h2 className="text-lg font-bold mb-3">?�� 최근 리포??/h2>
          <div className="space-y-3">
            {reports.length === 0 && <p className="text-sm text-gray-500">리포???�음</p>}
            {reports.map(r => (
              <div key={r.id} className="border rounded-xl p-3">
                <p className="font-semibold">{r.week}</p>
                <p className="text-xs mt-1">{r.summary}</p>
                <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full border
                  ${r.aiSentiment === "positive" ? "border-green-300 text-green-700" :
                    r.aiSentiment === "negative" ? "border-red-300 text-red-700" :
                    "border-blue-300 text-blue-700"}`}>
                  {r.aiSentiment || "neutral"}
                </span>
              </div>
            ))}
          </div>

          <Link to="/admin/chat-report" className="inline-block mt-4 text-sm text-blue-600 hover:underline">
            리포???�?�보?�로 ?�동 ??          </Link>
        </section>
      </div>
    </div>
  );
}
