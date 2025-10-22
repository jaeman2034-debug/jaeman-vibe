import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

interface Member {
  id: string;
  name: string;
  position: string;
  phone: string;
  feeStatus: string;
}

interface Finance {
  id: string;
  date: string;
  type: "?�입" | "지�?;
  category: string;
  amount: number;
  member?: string;
}

export default function TeamDashboardSimple() {
  const [tab, setTab] = useState<"blog" | "members" | "finance">("blog");

  const [members, setMembers] = useState<Member[]>([]);
  const [finance, setFinance] = useState<Finance[]>([]);

  const [newMember, setNewMember] = useState<Partial<Member>>({});
  const [newFinance, setNewFinance] = useState<Partial<Finance>>({ type: "?�입" });

  // Firestore teamId ?�시 (로그???��? ?�큰?�서 가?�오?�록 ?�장 가??
  const teamId = "soheul-fc60";

  // ?�원 구독
  useEffect(() => {
    const q = query(collection(db, "teams", teamId, "members"), orderBy("name"));
    return onSnapshot(q, (snapshot) => {
      setMembers(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Member) })));
    });
  }, []);

  // ?�계 구독
  useEffect(() => {
    const q = query(collection(db, "teams", teamId, "finance"), orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
      setFinance(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Finance) })));
    });
  }, []);

  const addMember = async () => {
    if (!newMember.name) return;
    await addDoc(collection(db, "teams", teamId, "members"), {
      ...newMember,
      feeStatus: newMember.feeStatus ?? "미납",
    });
    setNewMember({});
  };

  const addFinance = async () => {
    if (!newFinance.amount || !newFinance.category) return;
    await addDoc(collection(db, "teams", teamId, "finance"), {
      ...newFinance,
      date: new Date().toISOString().slice(0, 10),
      amount: Number(newFinance.amount),
    });
    setNewFinance({ type: "?�입" });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">?�흘FC60 ?� ?�?�보??(?�시�?</h1>

      {/* ??*/}
      <div className="flex gap-4 mb-6">
        {["blog", "members", "finance"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-4 py-2 rounded ${
              tab === t ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            {t === "blog" ? "블로�? : t === "members" ? "?�원 관�? : "?�계 관�?}
          </button>
        ))}
      </div>

      {tab === "blog" && (
        <div>
          <h2 className="text-xl font-semibold mb-3">?� 블로�?/h2>
          <p>?�기???�동 ?�성???�개글/?�스?��? ?�어갑니??</p>
        </div>
      )}

      {tab === "members" && (
        <div>
          <h2 className="text-xl font-semibold mb-3">?�원 명단 ({members.length}�?</h2>
          <table className="w-full border mb-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">?�름</th>
                <th className="p-2 border">?��???/th>
                <th className="p-2 border">?�화번호</th>
                <th className="p-2 border">?�비 ?�태</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="text-center">
                  <td className="border p-2">{m.name}</td>
                  <td className="border p-2">{m.position}</td>
                  <td className="border p-2">{m.phone}</td>
                  <td className="border p-2">{m.feeStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ?�원 추�? */}
          <div className="flex gap-2 mb-2">
            <input
              placeholder="?�름"
              value={newMember.name ?? ""}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              className="border rounded px-2 py-1"
            />
            <input
              placeholder="?��???
              value={newMember.position ?? ""}
              onChange={(e) => setNewMember({ ...newMember, position: e.target.value })}
              className="border rounded px-2 py-1"
            />
            <button onClick={addMember} className="bg-green-500 text-white px-3 rounded">
              추�?
            </button>
          </div>
        </div>
      )}

      {tab === "finance" && (
        <div>
          <h2 className="text-xl font-semibold mb-3">?�계 ?�역</h2>
          <table className="w-full border mb-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">?�짜</th>
                <th className="p-2 border">구분</th>
                <th className="p-2 border">??��</th>
                <th className="p-2 border">금액</th>
                <th className="p-2 border">관?�자</th>
              </tr>
            </thead>
            <tbody>
              {finance.map((f) => (
                <tr key={f.id} className="text-center">
                  <td className="border p-2">{f.date}</td>
                  <td className="border p-2">{f.type}</td>
                  <td className="border p-2">{f.category}</td>
                  <td className="border p-2">{f.amount.toLocaleString()} ??/td>
                  <td className="border p-2">{f.member ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ?�계 추�? */}
          <div className="flex gap-2 mb-2">
            <select
              value={newFinance.type}
              onChange={(e) => setNewFinance({ ...newFinance, type: e.target.value as "?�입" | "지�? })}
              className="border rounded px-2 py-1"
            >
              <option value="?�입">?�입</option>
              <option value="지�?>지�?/option>
            </select>
            <input
              placeholder="??��"
              value={newFinance.category ?? ""}
              onChange={(e) => setNewFinance({ ...newFinance, category: e.target.value })}
              className="border rounded px-2 py-1"
            />
            <input
              type="number"
              placeholder="금액"
              value={newFinance.amount ?? ""}
              onChange={(e) => setNewFinance({ ...newFinance, amount: Number(e.target.value) })}
              className="border rounded px-2 py-1"
            />
            <button onClick={addFinance} className="bg-green-500 text-white px-3 rounded">
              추�?
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
