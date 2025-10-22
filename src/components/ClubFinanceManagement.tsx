import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, doc, getDocs, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";

interface ClubMember {
  id: string;
  userId: string;
  userName: string;
  role: "member" | "admin" | "leader";
  paidUntil: string;
  totalPaid: number;
  duesHistory: Array<{
    month: string;
    amount: number;
    paidAt: any;
  }>;
}

interface ClubFinanceManagementProps {
  clubId: string;
  canManage: boolean;
}

export default function ClubFinanceManagement({ clubId, canManage }: ClubFinanceManagementProps) {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<ClubMember | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(20000);
  const [paymentMonth, setPaymentMonth] = useState("");

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const snap = await getDocs(collection(db, "clubs", clubId, "members"));
        const membersData = snap.docs.map((d) => ({
          id: d.id,
          userId: d.data().userId,
          userName: d.data().userName || d.data().name,
          role: d.data().role || "member",
          paidUntil: d.data().paidUntil || "",
          totalPaid: d.data().totalPaid || 0,
          duesHistory: d.data().duesHistory || []
        }));
        setMembers(membersData);
        setLoading(false);
      } catch (error) {
        console.error("?Œì› ?°ì´??ë¡œë“œ ?¤íŒ¨:", error);
        setLoading(false);
      }
    };

    fetchMembers();
  }, [clubId]);

  const handlePayment = async (memberId: string) => {
    if (!paymentMonth) {
      alert("?©ë? ?”ì„ ? íƒ?´ì£¼?¸ìš”.");
      return;
    }

    try {
      const memberRef = doc(db, "clubs", clubId, "members", memberId);
      const member = members.find(m => m.id === memberId);
      
      if (!member) return;

      await updateDoc(memberRef, {
        paidUntil: paymentMonth,
        totalPaid: (member.totalPaid || 0) + paymentAmount,
        duesHistory: arrayUnion({
          month: paymentMonth,
          amount: paymentAmount,
          paidAt: serverTimestamp(),
        }),
      });

      alert("?Œë¹„ ?©ë? ê¸°ë¡??ì¶”ê??˜ì—ˆ?µë‹ˆ????);
      
      // ?Œì› ëª©ë¡ ?ˆë¡œê³ ì¹¨
      const snap = await getDocs(collection(db, "clubs", clubId, "members"));
      const membersData = snap.docs.map((d) => ({
        id: d.id,
        userId: d.data().userId,
        userName: d.data().userName || d.data().name,
        role: d.data().role || "member",
        paidUntil: d.data().paidUntil || "",
        totalPaid: d.data().totalPaid || 0,
        duesHistory: d.data().duesHistory || []
      }));
      setMembers(membersData);
      setSelectedMember(null);
      
    } catch (error) {
      console.error("?Œë¹„ ?©ë? ì²˜ë¦¬ ?¤íŒ¨:", error);
      alert("?Œë¹„ ?©ë? ì²˜ë¦¬???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
    }
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const isOverdue = (paidUntil: string) => {
    if (!paidUntil) return true;
    const currentMonth = getCurrentMonth();
    return paidUntil < currentMonth;
  };

  const getOverdueMonths = (paidUntil: string) => {
    if (!paidUntil) return "ë¯¸ë‚©";
    
    const currentMonth = getCurrentMonth();
    if (paidUntil >= currentMonth) return "?•ìƒ";
    
    // ë¯¸ë‚© ê°œì›”??ê³„ì‚° (ê°„ë‹¨??ë²„ì „)
    const paid = new Date(paidUntil + "-01");
    const current = new Date(currentMonth + "-01");
    const diffMonths = (current.getFullYear() - paid.getFullYear()) * 12 + 
                      (current.getMonth() - paid.getMonth());
    
    return `${diffMonths}ê°œì›” ë¯¸ë‚©`;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">?Œì› ?•ë³´ë¥?ë¶ˆëŸ¬?¤ëŠ” ì¤?..</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ?Œë¹„ ê´€ë¦??µê³„ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{members.length}</div>
          <div className="text-sm text-gray-600">ì´??Œì›</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {members.filter(m => !isOverdue(m.paidUntil)).length}
          </div>
          <div className="text-sm text-gray-600">?•ìƒ ?©ë?</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">
            {members.filter(m => isOverdue(m.paidUntil)).length}
          </div>
          <div className="text-sm text-gray-600">ë¯¸ë‚©??/div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">
            {members.reduce((sum, m) => sum + (m.totalPaid || 0), 0).toLocaleString()}??          </div>
          <div className="text-sm text-gray-600">ì´??˜ì…</div>
        </div>
      </div>

      {/* ?Œì›ë³??Œë¹„ ?„í™© */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">?Œì›ë³??Œë¹„ ?„í™©</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ?´ë¦„
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ??• 
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ë§ˆì?ë§??©ë???                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ì´??©ë???                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ?©ë? ?íƒœ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ê´€ë¦?                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{member.userName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      member.role === "leader" 
                        ? "bg-red-100 text-red-800"
                        : member.role === "admin"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {member.role === "leader" ? "?Œì¥" : 
                       member.role === "admin" ? "?´ì˜ì§? : "?Œì›"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.paidUntil || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(member.totalPaid || 0).toLocaleString()}??                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isOverdue(member.paidUntil)
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {getOverdueMonths(member.paidUntil)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {canManage && (
                      <button
                        onClick={() => setSelectedMember(member)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        ?©ë? ì²˜ë¦¬
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ?©ë? ì²˜ë¦¬ ëª¨ë‹¬ */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              ?Œë¹„ ?©ë? ì²˜ë¦¬ - {selectedMember.userName}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ?©ë? ??                </label>
                <input
                  type="month"
                  value={paymentMonth}
                  onChange={(e) => setPaymentMonth(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ?©ë? ê¸ˆì•¡
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">
                  <div>?„ì¬ ì´??©ë??? {(selectedMember.totalPaid || 0).toLocaleString()}??/div>
                  <div>?©ë? ??ì´ì•¡: {(selectedMember.totalPaid || 0) + paymentAmount}??/div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedMember(null)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                ì·¨ì†Œ
              </button>
              <button
                onClick={() => handlePayment(selectedMember.id)}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                ?©ë? ì²˜ë¦¬
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
