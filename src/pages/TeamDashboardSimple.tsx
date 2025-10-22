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
  type: "?˜ì…" | "ì§€ì¶?;
  category: string;
  amount: number;
  member?: string;
}

export default function TeamDashboardSimple() {
  const [tab, setTab] = useState<"blog" | "members" | "finance">("blog");

  const [members, setMembers] = useState<Member[]>([]);
  const [finance, setFinance] = useState<Finance[]>([]);

  const [newMember, setNewMember] = useState<Partial<Member>>({});
  const [newFinance, setNewFinance] = useState<Partial<Finance>>({ type: "?˜ì…" });

  // Firestore teamId ?ˆì‹œ (ë¡œê·¸??? ì? ? í°?ì„œ ê°€?¸ì˜¤?„ë¡ ?•ì¥ ê°€??
  const teamId = "soheul-fc60";

  // ?Œì› êµ¬ë…
  useEffect(() => {
    const q = query(collection(db, "teams", teamId, "members"), orderBy("name"));
    return onSnapshot(q, (snapshot) => {
      setMembers(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Member) })));
    });
  }, []);

  // ?Œê³„ êµ¬ë…
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
      feeStatus: newMember.feeStatus ?? "ë¯¸ë‚©",
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
    setNewFinance({ type: "?˜ì…" });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">?Œí˜FC60 ?€ ?€?œë³´??(?¤ì‹œê°?</h1>

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
            {t === "blog" ? "ë¸”ë¡œê·? : t === "members" ? "?Œì› ê´€ë¦? : "?Œê³„ ê´€ë¦?}
          </button>
        ))}
      </div>

      {tab === "blog" && (
        <div>
          <h2 className="text-xl font-semibold mb-3">?€ ë¸”ë¡œê·?/h2>
          <p>?¬ê¸°???ë™ ?ì„±???Œê°œê¸€/?¬ìŠ¤?¸ê? ?¤ì–´ê°‘ë‹ˆ??</p>
        </div>
      )}

      {tab === "members" && (
        <div>
          <h2 className="text-xl font-semibold mb-3">?Œì› ëª…ë‹¨ ({members.length}ëª?</h2>
          <table className="w-full border mb-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">?´ë¦„</th>
                <th className="p-2 border">?¬ì???/th>
                <th className="p-2 border">?„í™”ë²ˆí˜¸</th>
                <th className="p-2 border">?Œë¹„ ?íƒœ</th>
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

          {/* ?Œì› ì¶”ê? */}
          <div className="flex gap-2 mb-2">
            <input
              placeholder="?´ë¦„"
              value={newMember.name ?? ""}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              className="border rounded px-2 py-1"
            />
            <input
              placeholder="?¬ì???
              value={newMember.position ?? ""}
              onChange={(e) => setNewMember({ ...newMember, position: e.target.value })}
              className="border rounded px-2 py-1"
            />
            <button onClick={addMember} className="bg-green-500 text-white px-3 rounded">
              ì¶”ê?
            </button>
          </div>
        </div>
      )}

      {tab === "finance" && (
        <div>
          <h2 className="text-xl font-semibold mb-3">?Œê³„ ?´ì—­</h2>
          <table className="w-full border mb-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">? ì§œ</th>
                <th className="p-2 border">êµ¬ë¶„</th>
                <th className="p-2 border">??ª©</th>
                <th className="p-2 border">ê¸ˆì•¡</th>
                <th className="p-2 border">ê´€?¨ì</th>
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

          {/* ?Œê³„ ì¶”ê? */}
          <div className="flex gap-2 mb-2">
            <select
              value={newFinance.type}
              onChange={(e) => setNewFinance({ ...newFinance, type: e.target.value as "?˜ì…" | "ì§€ì¶? })}
              className="border rounded px-2 py-1"
            >
              <option value="?˜ì…">?˜ì…</option>
              <option value="ì§€ì¶?>ì§€ì¶?/option>
            </select>
            <input
              placeholder="??ª©"
              value={newFinance.category ?? ""}
              onChange={(e) => setNewFinance({ ...newFinance, category: e.target.value })}
              className="border rounded px-2 py-1"
            />
            <input
              type="number"
              placeholder="ê¸ˆì•¡"
              value={newFinance.amount ?? ""}
              onChange={(e) => setNewFinance({ ...newFinance, amount: Number(e.target.value) })}
              className="border rounded px-2 py-1"
            />
            <button onClick={addFinance} className="bg-green-500 text-white px-3 rounded">
              ì¶”ê?
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
