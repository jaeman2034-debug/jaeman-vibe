import React, { useState } from "react";
import AdminRoute from "@/components/admin/AdminRoute";
import AdminSlotDashboard from "@/components/admin/AdminSlotDashboard";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useToast } from "@/components/common/Toast";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("slots");
  const { roleInfo, setAdminRole } = useAdminRole();
  const toast = useToast();

  // 권한 ?�정 (?�퍼 관리자�?
  const handleSetRole = async (targetUid: string, newRole: 'admin' | 'user') => {
    try {
      await setAdminRole(targetUid, newRole);
      toast(`?�용??권한??${newRole}�??�정?�었?�니??`);
    } catch (error: any) {
      toast(error.message || "권한 ?�정???�패?�습?�다.");
    }
  };

  return (
    <AdminRoute>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ?�더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">관리자 ?�?�보??/h1>
          <p className="text-gray-500 mt-2">
            ?�재 권한: <span className="font-medium">{roleInfo?.role}</span> · 
            ?�메?? <span className="font-medium">{roleInfo?.email}</span>
          </p>
        </div>

        {/* ???�비게이??*/}
        <div className="flex items-center gap-2 mb-6 overflow-auto">
          <button
            onClick={() => setActiveTab("slots")}
            className={`px-4 py-2 rounded-xl border text-sm whitespace-nowrap transition-colors ${
              activeTab === "slots"
                ? "bg-black text-white border-black"
                : "bg-white/70 dark:bg-white/10 border-gray-200/70 dark:border-white/10 hover:opacity-90"
            }`}
          >
            ?�롯 관�?
          </button>
          {roleInfo?.role === 'superadmin' && (
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 rounded-xl border text-sm whitespace-nowrap transition-colors ${
                activeTab === "users"
                  ? "bg-black text-white border-black"
                  : "bg-white/70 dark:bg-white/10 border-gray-200/70 dark:border-white/10 hover:opacity-90"
              }`}
            >
              ?�용??권한 관�?
            </button>
          )}
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-4 py-2 rounded-xl border text-sm whitespace-nowrap transition-colors ${
              activeTab === "stats"
                ? "bg-black text-white border-black"
                : "bg-white/70 dark:bg-white/10 border-gray-200/70 dark:border-white/10 hover:opacity-90"
            }`}
          >
            ?�계
          </button>
        </div>

        {/* ??콘텐�?*/}
        {activeTab === "slots" && (
          <AdminSlotDashboard />
        )}

        {activeTab === "users" && roleInfo?.role === 'superadmin' && (
          <div className="border rounded-xl p-6">
            <h2 className="text-2xl font-semibold mb-6">?�용??권한 관�?/h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">권한 ?�정 가?�드</h3>
                <p className="text-sm text-blue-800">
                  ?�용??UID�??�력?�고 ?�하??권한???�정?�세?? 
                  권한 변�??�에???�당 ?�용?��? ?�로그인?�야 ?�니??
                </p>
              </div>
              
              <UserRoleManager onSetRole={handleSetRole} />
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="border rounded-xl p-6">
            <h2 className="text-2xl font-semibold mb-6">?�스???�계</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-900">?�성 ?�약</h3>
                <p className="text-2xl font-bold text-green-600">-</p>
                <p className="text-sm text-green-700">?�재 ?�성 ?�태</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900">�??�설</h3>
                <p className="text-2xl font-bold text-blue-600">-</p>
                <p className="text-sm text-blue-700">?�록???�설 ??/p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-medium text-purple-900">�??�용??/h3>
                <p className="text-2xl font-bold text-purple-600">-</p>
                <p className="text-sm text-purple-700">가?�된 ?�용????/p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminRoute>
  );
}

// ?�용??권한 관�?컴포?�트
function UserRoleManager({ onSetRole }: { onSetRole: (uid: string, role: 'admin' | 'user') => Promise<void> }) {
  const [targetUid, setTargetUid] = useState("");
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUid.trim()) return;

    setLoading(true);
    try {
      await onSetRole(targetUid.trim(), newRole);
      setTargetUid("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ?�용??UID
          </label>
          <input
            type="text"
            value={targetUid}
            onChange={(e) => setTargetUid(e.target.value)}
            placeholder="Firebase Auth UID ?�력"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ?�로??권한
          </label>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="user">?�반 ?�용??/option>
            <option value="admin">관리자</option>
          </select>
        </div>
      </div>
      
      <button
        type="submit"
        disabled={loading || !targetUid.trim()}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "?�정 �?.." : "권한 ?�정"}
      </button>
    </form>
  );
}
