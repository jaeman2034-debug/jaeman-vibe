import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface TeamMember {
  id: string;
  name: string;
  position: string;
  phone: string;
  feeStatus: "?„ë‚©" | "ë¯¸ë‚©" | "ë¶€ë¶„ë‚©";
  joinDate: string;
}

interface FinanceRecord {
  id: string;
  date: string;
  type: "?˜ì…" | "ì§€ì¶?;
  category: string;
  amount: number;
  member: string;
  description?: string;
}

export default function TeamManagementDashboard() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"members" | "finance" | "blog">("members");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [financeRecords, setFinanceRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // ?Œì› ê´€ë¦??íƒœ
  const [newMember, setNewMember] = useState({
    name: "",
    position: "",
    phone: "",
    feeStatus: "ë¯¸ë‚©" as const,
  });

  // ?Œê³„ ê´€ë¦??íƒœ
  const [newFinanceRecord, setNewFinanceRecord] = useState({
    date: new Date().toISOString().split('T')[0],
    type: "?˜ì…" as const,
    category: "",
    amount: 0,
    member: "",
    description: "",
  });

  useEffect(() => {
    if (teamId) {
      loadTeamData();
    }
  }, [teamId]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      
      // ?Œì› ëª©ë¡ ë¡œë“œ
      const membersQuery = query(collection(db, "teams", teamId!, "members"));
      const membersSnapshot = await getDocs(membersQuery);
      const membersData = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TeamMember[];
      setMembers(membersData);

      // ?Œê³„ ê¸°ë¡ ë¡œë“œ
      const financeQuery = query(collection(db, "teams", teamId!, "finance"));
      const financeSnapshot = await getDocs(financeQuery);
      const financeData = financeSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FinanceRecord[];
      setFinanceRecords(financeData);

    } catch (error) {
      console.error("?€ ?°ì´??ë¡œë“œ ?¤ë¥˜:", error);
    } finally {
      setLoading(false);
    }
  };

  const addMember = async () => {
    if (!newMember.name || !newMember.position) return;

    try {
      await addDoc(collection(db, "teams", teamId!, "members"), {
        ...newMember,
        joinDate: new Date().toISOString().split('T')[0],
      });
      
      setNewMember({ name: "", position: "", phone: "", feeStatus: "ë¯¸ë‚©" });
      loadTeamData();
    } catch (error) {
      console.error("?Œì› ì¶”ê? ?¤ë¥˜:", error);
    }
  };

  const addFinanceRecord = async () => {
    if (!newFinanceRecord.category || newFinanceRecord.amount <= 0) return;

    try {
      await addDoc(collection(db, "teams", teamId!, "finance"), newFinanceRecord);
      
      setNewFinanceRecord({
        date: new Date().toISOString().split('T')[0],
        type: "?˜ì…",
        category: "",
        amount: 0,
        member: "",
        description: "",
      });
      loadTeamData();
    } catch (error) {
      console.error("?Œê³„ ê¸°ë¡ ì¶”ê? ?¤ë¥˜:", error);
    }
  };

  const deleteMember = async (memberId: string) => {
    if (!window.confirm("?•ë§ ?? œ?˜ì‹œê² ìŠµ?ˆê¹Œ?")) return;

    try {
      await deleteDoc(doc(db, "teams", teamId!, "members", memberId));
      loadTeamData();
    } catch (error) {
      console.error("?Œì› ?? œ ?¤ë¥˜:", error);
    }
  };

  // ?Œê³„ ?µê³„ ê³„ì‚°
  const calculateFinanceStats = () => {
    const income = financeRecords
      .filter(record => record.type === "?˜ì…")
      .reduce((sum, record) => sum + record.amount, 0);
    
    const expense = financeRecords
      .filter(record => record.type === "ì§€ì¶?)
      .reduce((sum, record) => sum + record.amount, 0);

    return {
      income,
      expense,
      balance: income - expense,
    };
  };

  const stats = calculateFinanceStats();

  if (loading) {
    return <div className="p-6 text-center">ë¡œë”© ì¤?..</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">?€ ê´€ë¦??€?œë³´??/h1>
        <button
          onClick={() => navigate("/blogs")}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          ë¸”ë¡œê·¸ë¡œ ?Œì•„ê°€ê¸?        </button>
      </div>

      {/* ???¤ë¹„ê²Œì´??*/}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab("members")}
          className={`pb-2 px-1 ${activeTab === "members" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`}
        >
          ?Œì› ê´€ë¦?        </button>
        <button
          onClick={() => setActiveTab("finance")}
          className={`pb-2 px-1 ${activeTab === "finance" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`}
        >
          ?Œê³„ ê´€ë¦?        </button>
        <button
          onClick={() => setActiveTab("blog")}
          className={`pb-2 px-1 ${activeTab === "blog" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`}
        >
          ë¸”ë¡œê·?ê´€ë¦?        </button>
      </div>

      {/* ?Œì› ê´€ë¦???*/}
      {activeTab === "members" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">? ê·œ ?Œì› ?±ë¡</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="?´ë¦„"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="?¬ì???(GK, DF, MF, FW)"
                value={newMember.position}
                onChange={(e) => setNewMember({ ...newMember, position: e.target.value })}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="?°ë½ì²?
                value={newMember.phone}
                onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                className="border rounded px-3 py-2"
              />
              <select
                value={newMember.feeStatus}
                onChange={(e) => setNewMember({ ...newMember, feeStatus: e.target.value as any })}
                className="border rounded px-3 py-2"
              >
                <option value="?„ë‚©">?„ë‚©</option>
                <option value="ë¶€ë¶„ë‚©">ë¶€ë¶„ë‚©</option>
                <option value="ë¯¸ë‚©">ë¯¸ë‚©</option>
              </select>
            </div>
            <button
              onClick={addMember}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
            >
              ?Œì› ì¶”ê?
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">?Œì› ëª…ë‹¨ ({members.length}ëª?</h2>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">?´ë¦„</th>
                    <th className="px-4 py-2 text-left">?¬ì???/th>
                    <th className="px-4 py-2 text-left">?°ë½ì²?/th>
                    <th className="px-4 py-2 text-left">?Œë¹„ ?íƒœ</th>
                    <th className="px-4 py-2 text-left">ê°€?…ì¼</th>
                    <th className="px-4 py-2 text-left">ê´€ë¦?/th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b">
                      <td className="px-4 py-2">{member.name}</td>
                      <td className="px-4 py-2">{member.position}</td>
                      <td className="px-4 py-2">{member.phone}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-sm ${
                          member.feeStatus === "?„ë‚©" ? "bg-green-100 text-green-800" :
                          member.feeStatus === "ë¶€ë¶„ë‚©" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {member.feeStatus}
                        </span>
                      </td>
                      <td className="px-4 py-2">{member.joinDate}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => deleteMember(member.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ?? œ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ?Œê³„ ê´€ë¦???*/}
      {activeTab === "finance" && (
        <div className="space-y-6">
          {/* ?Œê³„ ?µê³„ ì¹´ë“œ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-800">ì´??˜ì…</h3>
              <p className="text-2xl font-bold text-green-600">{stats.income.toLocaleString()}??/p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-800">ì´?ì§€ì¶?/h3>
              <p className="text-2xl font-bold text-red-600">{stats.expense.toLocaleString()}??/p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800">?”ì•¡</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.balance.toLocaleString()}??/p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">???Œê³„ ê¸°ë¡</h2>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <input
                type="date"
                value={newFinanceRecord.date}
                onChange={(e) => setNewFinanceRecord({ ...newFinanceRecord, date: e.target.value })}
                className="border rounded px-3 py-2"
              />
              <select
                value={newFinanceRecord.type}
                onChange={(e) => setNewFinanceRecord({ ...newFinanceRecord, type: e.target.value as any })}
                className="border rounded px-3 py-2"
              >
                <option value="?˜ì…">?˜ì…</option>
                <option value="ì§€ì¶?>ì§€ì¶?/option>
              </select>
              <input
                type="text"
                placeholder="ì¹´í…Œê³ ë¦¬"
                value={newFinanceRecord.category}
                onChange={(e) => setNewFinanceRecord({ ...newFinanceRecord, category: e.target.value })}
                className="border rounded px-3 py-2"
              />
              <input
                type="number"
                placeholder="ê¸ˆì•¡"
                value={newFinanceRecord.amount}
                onChange={(e) => setNewFinanceRecord({ ...newFinanceRecord, amount: Number(e.target.value) })}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="?Œì›ëª?
                value={newFinanceRecord.member}
                onChange={(e) => setNewFinanceRecord({ ...newFinanceRecord, member: e.target.value })}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="?¤ëª…"
                value={newFinanceRecord.description}
                onChange={(e) => setNewFinanceRecord({ ...newFinanceRecord, description: e.target.value })}
                className="border rounded px-3 py-2"
              />
            </div>
            <button
              onClick={addFinanceRecord}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
            >
              ê¸°ë¡ ì¶”ê?
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">?Œê³„ ê¸°ë¡</h2>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">? ì§œ</th>
                    <th className="px-4 py-2 text-left">êµ¬ë¶„</th>
                    <th className="px-4 py-2 text-left">ì¹´í…Œê³ ë¦¬</th>
                    <th className="px-4 py-2 text-left">ê¸ˆì•¡</th>
                    <th className="px-4 py-2 text-left">?Œì›</th>
                    <th className="px-4 py-2 text-left">?¤ëª…</th>
                  </tr>
                </thead>
                <tbody>
                  {financeRecords.map((record) => (
                    <tr key={record.id} className="border-b">
                      <td className="px-4 py-2">{record.date}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-sm ${
                          record.type === "?˜ì…" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {record.type}
                        </span>
                      </td>
                      <td className="px-4 py-2">{record.category}</td>
                      <td className="px-4 py-2">{record.amount.toLocaleString()}??/td>
                      <td className="px-4 py-2">{record.member}</td>
                      <td className="px-4 py-2">{record.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ë¸”ë¡œê·?ê´€ë¦???*/}
      {activeTab === "blog" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">ë¸”ë¡œê·?ê´€ë¦?/h2>
            <p className="text-gray-600 mb-4">
              ?€ ë¸”ë¡œê·¸ëŠ” ê³µê°œ?ìœ¼ë¡??‘ê·¼ ê°€?¥í•˜ë©? ?€ ?Œê°œ?€ ?¬ìŠ¤?¸ë? ?¬í•¨?©ë‹ˆ??
            </p>
            <div className="space-y-2">
              <button
                onClick={() => navigate(`/blogs`)}
                className="block w-full text-left bg-blue-50 hover:bg-blue-100 p-4 rounded-lg"
              >
                <h3 className="font-semibold">ë¸”ë¡œê·?ëª©ë¡ ë³´ê¸°</h3>
                <p className="text-sm text-gray-600">?„ì²´ ë¸”ë¡œê·??¬ìŠ¤???•ì¸</p>
              </button>
              <button
                onClick={() => navigate(`/blogs/new`)}
                className="block w-full text-left bg-green-50 hover:bg-green-100 p-4 rounded-lg"
              >
                <h3 className="font-semibold">???¬ìŠ¤???‘ì„±</h3>
                <p className="text-sm text-gray-600">?€ ?Œì‹?´ë‚˜ ê²½ê¸° ?„ê¸° ?‘ì„±</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
