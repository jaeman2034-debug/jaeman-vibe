import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface TeamMember {
  id: string;
  name: string;
  position: string;
  phone: string;
  feeStatus: "?�납" | "미납" | "부분납";
  joinDate: string;
}

interface FinanceRecord {
  id: string;
  date: string;
  type: "?�입" | "지�?;
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

  // ?�원 관�??�태
  const [newMember, setNewMember] = useState({
    name: "",
    position: "",
    phone: "",
    feeStatus: "미납" as const,
  });

  // ?�계 관�??�태
  const [newFinanceRecord, setNewFinanceRecord] = useState({
    date: new Date().toISOString().split('T')[0],
    type: "?�입" as const,
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
      
      // ?�원 목록 로드
      const membersQuery = query(collection(db, "teams", teamId!, "members"));
      const membersSnapshot = await getDocs(membersQuery);
      const membersData = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TeamMember[];
      setMembers(membersData);

      // ?�계 기록 로드
      const financeQuery = query(collection(db, "teams", teamId!, "finance"));
      const financeSnapshot = await getDocs(financeQuery);
      const financeData = financeSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FinanceRecord[];
      setFinanceRecords(financeData);

    } catch (error) {
      console.error("?� ?�이??로드 ?�류:", error);
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
      
      setNewMember({ name: "", position: "", phone: "", feeStatus: "미납" });
      loadTeamData();
    } catch (error) {
      console.error("?�원 추�? ?�류:", error);
    }
  };

  const addFinanceRecord = async () => {
    if (!newFinanceRecord.category || newFinanceRecord.amount <= 0) return;

    try {
      await addDoc(collection(db, "teams", teamId!, "finance"), newFinanceRecord);
      
      setNewFinanceRecord({
        date: new Date().toISOString().split('T')[0],
        type: "?�입",
        category: "",
        amount: 0,
        member: "",
        description: "",
      });
      loadTeamData();
    } catch (error) {
      console.error("?�계 기록 추�? ?�류:", error);
    }
  };

  const deleteMember = async (memberId: string) => {
    if (!window.confirm("?�말 ??��?�시겠습?�까?")) return;

    try {
      await deleteDoc(doc(db, "teams", teamId!, "members", memberId));
      loadTeamData();
    } catch (error) {
      console.error("?�원 ??�� ?�류:", error);
    }
  };

  // ?�계 ?�계 계산
  const calculateFinanceStats = () => {
    const income = financeRecords
      .filter(record => record.type === "?�입")
      .reduce((sum, record) => sum + record.amount, 0);
    
    const expense = financeRecords
      .filter(record => record.type === "지�?)
      .reduce((sum, record) => sum + record.amount, 0);

    return {
      income,
      expense,
      balance: income - expense,
    };
  };

  const stats = calculateFinanceStats();

  if (loading) {
    return <div className="p-6 text-center">로딩 �?..</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">?� 관�??�?�보??/h1>
        <button
          onClick={() => navigate("/blogs")}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          블로그로 ?�아가�?        </button>
      </div>

      {/* ???�비게이??*/}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab("members")}
          className={`pb-2 px-1 ${activeTab === "members" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`}
        >
          ?�원 관�?        </button>
        <button
          onClick={() => setActiveTab("finance")}
          className={`pb-2 px-1 ${activeTab === "finance" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`}
        >
          ?�계 관�?        </button>
        <button
          onClick={() => setActiveTab("blog")}
          className={`pb-2 px-1 ${activeTab === "blog" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`}
        >
          블로�?관�?        </button>
      </div>

      {/* ?�원 관�???*/}
      {activeTab === "members" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">?�규 ?�원 ?�록</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="?�름"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="?��???(GK, DF, MF, FW)"
                value={newMember.position}
                onChange={(e) => setNewMember({ ...newMember, position: e.target.value })}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="?�락�?
                value={newMember.phone}
                onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                className="border rounded px-3 py-2"
              />
              <select
                value={newMember.feeStatus}
                onChange={(e) => setNewMember({ ...newMember, feeStatus: e.target.value as any })}
                className="border rounded px-3 py-2"
              >
                <option value="?�납">?�납</option>
                <option value="부분납">부분납</option>
                <option value="미납">미납</option>
              </select>
            </div>
            <button
              onClick={addMember}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
            >
              ?�원 추�?
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">?�원 명단 ({members.length}�?</h2>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">?�름</th>
                    <th className="px-4 py-2 text-left">?��???/th>
                    <th className="px-4 py-2 text-left">?�락�?/th>
                    <th className="px-4 py-2 text-left">?�비 ?�태</th>
                    <th className="px-4 py-2 text-left">가?�일</th>
                    <th className="px-4 py-2 text-left">관�?/th>
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
                          member.feeStatus === "?�납" ? "bg-green-100 text-green-800" :
                          member.feeStatus === "부분납" ? "bg-yellow-100 text-yellow-800" :
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
                          ??��
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

      {/* ?�계 관�???*/}
      {activeTab === "finance" && (
        <div className="space-y-6">
          {/* ?�계 ?�계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-800">�??�입</h3>
              <p className="text-2xl font-bold text-green-600">{stats.income.toLocaleString()}??/p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-800">�?지�?/h3>
              <p className="text-2xl font-bold text-red-600">{stats.expense.toLocaleString()}??/p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800">?�액</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.balance.toLocaleString()}??/p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">???�계 기록</h2>
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
                <option value="?�입">?�입</option>
                <option value="지�?>지�?/option>
              </select>
              <input
                type="text"
                placeholder="카테고리"
                value={newFinanceRecord.category}
                onChange={(e) => setNewFinanceRecord({ ...newFinanceRecord, category: e.target.value })}
                className="border rounded px-3 py-2"
              />
              <input
                type="number"
                placeholder="금액"
                value={newFinanceRecord.amount}
                onChange={(e) => setNewFinanceRecord({ ...newFinanceRecord, amount: Number(e.target.value) })}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="?�원�?
                value={newFinanceRecord.member}
                onChange={(e) => setNewFinanceRecord({ ...newFinanceRecord, member: e.target.value })}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="?�명"
                value={newFinanceRecord.description}
                onChange={(e) => setNewFinanceRecord({ ...newFinanceRecord, description: e.target.value })}
                className="border rounded px-3 py-2"
              />
            </div>
            <button
              onClick={addFinanceRecord}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
            >
              기록 추�?
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">?�계 기록</h2>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">?�짜</th>
                    <th className="px-4 py-2 text-left">구분</th>
                    <th className="px-4 py-2 text-left">카테고리</th>
                    <th className="px-4 py-2 text-left">금액</th>
                    <th className="px-4 py-2 text-left">?�원</th>
                    <th className="px-4 py-2 text-left">?�명</th>
                  </tr>
                </thead>
                <tbody>
                  {financeRecords.map((record) => (
                    <tr key={record.id} className="border-b">
                      <td className="px-4 py-2">{record.date}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-sm ${
                          record.type === "?�입" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
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

      {/* 블로�?관�???*/}
      {activeTab === "blog" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">블로�?관�?/h2>
            <p className="text-gray-600 mb-4">
              ?� 블로그는 공개?�으�??�근 가?�하�? ?� ?�개?� ?�스?��? ?�함?�니??
            </p>
            <div className="space-y-2">
              <button
                onClick={() => navigate(`/blogs`)}
                className="block w-full text-left bg-blue-50 hover:bg-blue-100 p-4 rounded-lg"
              >
                <h3 className="font-semibold">블로�?목록 보기</h3>
                <p className="text-sm text-gray-600">?�체 블로�??�스???�인</p>
              </button>
              <button
                onClick={() => navigate(`/blogs/new`)}
                className="block w-full text-left bg-green-50 hover:bg-green-100 p-4 rounded-lg"
              >
                <h3 className="font-semibold">???�스???�성</h3>
                <p className="text-sm text-gray-600">?� ?�식?�나 경기 ?�기 ?�성</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
