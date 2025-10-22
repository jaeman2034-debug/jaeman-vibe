import React, { useState } from "react";
import AdminRoute from "@/components/admin/AdminRoute";
import AdminSlotDashboard from "@/components/admin/AdminSlotDashboard";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useToast } from "@/components/common/Toast";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("slots");
  const { roleInfo, setAdminRole } = useAdminRole();
  const toast = useToast();

  // ê¶Œí•œ ?¤ì • (?ˆí¼ ê´€ë¦¬ìë§?
  const handleSetRole = async (targetUid: string, newRole: 'admin' | 'user') => {
    try {
      await setAdminRole(targetUid, newRole);
      toast(`?¬ìš©??ê¶Œí•œ??${newRole}ë¡??¤ì •?˜ì—ˆ?µë‹ˆ??`);
    } catch (error: any) {
      toast(error.message || "ê¶Œí•œ ?¤ì •???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
    }
  };

  return (
    <AdminRoute>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ?¤ë” */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">ê´€ë¦¬ì ?€?œë³´??/h1>
          <p className="text-gray-500 mt-2">
            ?„ì¬ ê¶Œí•œ: <span className="font-medium">{roleInfo?.role}</span> Â· 
            ?´ë©”?? <span className="font-medium">{roleInfo?.email}</span>
          </p>
        </div>

        {/* ???¤ë¹„ê²Œì´??*/}
        <div className="flex items-center gap-2 mb-6 overflow-auto">
          <button
            onClick={() => setActiveTab("slots")}
            className={`px-4 py-2 rounded-xl border text-sm whitespace-nowrap transition-colors ${
              activeTab === "slots"
                ? "bg-black text-white border-black"
                : "bg-white/70 dark:bg-white/10 border-gray-200/70 dark:border-white/10 hover:opacity-90"
            }`}
          >
            ?¬ë¡¯ ê´€ë¦?
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
              ?¬ìš©??ê¶Œí•œ ê´€ë¦?
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
            ?µê³„
          </button>
        </div>

        {/* ??ì½˜í…ì¸?*/}
        {activeTab === "slots" && (
          <AdminSlotDashboard />
        )}

        {activeTab === "users" && roleInfo?.role === 'superadmin' && (
          <div className="border rounded-xl p-6">
            <h2 className="text-2xl font-semibold mb-6">?¬ìš©??ê¶Œí•œ ê´€ë¦?/h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">ê¶Œí•œ ?¤ì • ê°€?´ë“œ</h3>
                <p className="text-sm text-blue-800">
                  ?¬ìš©??UIDë¥??…ë ¥?˜ê³  ?í•˜??ê¶Œí•œ???¤ì •?˜ì„¸?? 
                  ê¶Œí•œ ë³€ê²??„ì—???´ë‹¹ ?¬ìš©?ê? ?¬ë¡œê·¸ì¸?´ì•¼ ?©ë‹ˆ??
                </p>
              </div>
              
              <UserRoleManager onSetRole={handleSetRole} />
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="border rounded-xl p-6">
            <h2 className="text-2xl font-semibold mb-6">?œìŠ¤???µê³„</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-900">?œì„± ?ˆì•½</h3>
                <p className="text-2xl font-bold text-green-600">-</p>
                <p className="text-sm text-green-700">?„ì¬ ?œì„± ?íƒœ</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900">ì´??œì„¤</h3>
                <p className="text-2xl font-bold text-blue-600">-</p>
                <p className="text-sm text-blue-700">?±ë¡???œì„¤ ??/p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-medium text-purple-900">ì´??¬ìš©??/h3>
                <p className="text-2xl font-bold text-purple-600">-</p>
                <p className="text-sm text-purple-700">ê°€?…ëœ ?¬ìš©????/p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminRoute>
  );
}

// ?¬ìš©??ê¶Œí•œ ê´€ë¦?ì»´í¬?ŒíŠ¸
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
            ?¬ìš©??UID
          </label>
          <input
            type="text"
            value={targetUid}
            onChange={(e) => setTargetUid(e.target.value)}
            placeholder="Firebase Auth UID ?…ë ¥"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ?ˆë¡œ??ê¶Œí•œ
          </label>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="user">?¼ë°˜ ?¬ìš©??/option>
            <option value="admin">ê´€ë¦¬ì</option>
          </select>
        </div>
      </div>
      
      <button
        type="submit"
        disabled={loading || !targetUid.trim()}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "?¤ì • ì¤?.." : "ê¶Œí•œ ?¤ì •"}
      </button>
    </form>
  );
}
