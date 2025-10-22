import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { app } from "@/lib/firebase";

const db = getFirestore(app);

type Application = {
  id: string;
  academyId: string;
  appliedAt: any;
  status: string;
};

type Academy = {
  id: string;
  title: string;
  instructor: string;
  price: number;
};

export default function AcademyAdmin() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // ?†Ï≤≠ ?∞Ïù¥??Í∞Ä?∏Ïò§Í∏?      const appsSnapshot = await getDocs(collection(db, "applications"));
      setApplications(
        appsSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Application))
      );
      
      // Í∞ïÏ¢å ?∞Ïù¥??Í∞Ä?∏Ïò§Í∏?      const academiesSnapshot = await getDocs(collection(db, "academies"));
      setAcademies(
        academiesSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Academy))
      );
    };
    fetchData();
  }, []);

  const handleUpdate = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, "applications", id), { status });
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status } : app))
      );
      alert(`?†Ï≤≠ ?ÅÌÉúÍ∞Ä '${status}'Î°?Î≥ÄÍ≤ΩÎêò?àÏäµ?àÎã§ ??);
    } catch (err) {
      console.error(err);
      alert("?ÅÌÉú Î≥ÄÍ≤?Ï§??§Î•ò Î∞úÏÉù ??);
    }
  };

  const getAcademyInfo = (academyId: string) => {
    return academies.find(academy => academy.id === academyId);
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === "pending").length,
    approved: applications.filter(app => app.status === "approved").length,
    rejected: applications.filter(app => app.status === "rejected").length,
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">?ìã ?†Ï≤≠??Í¥ÄÎ¶?/h2>
        <Link 
          to="/academy-simple" 
          className="text-blue-500 hover:underline"
        >
          ???ÑÏπ¥?∞Î?Î°??åÏïÑÍ∞ÄÍ∏?        </Link>
      </div>
      
      {/* ?µÍ≥Ñ Ïπ¥Îìú */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-800">{stats.total}</div>
          <div className="text-sm text-blue-600">?ÑÏ≤¥ ?†Ï≤≠</div>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-800">{stats.pending}</div>
          <div className="text-sm text-yellow-600">?ÄÍ∏∞Ï§ë</div>
        </div>
        <div className="bg-green-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-800">{stats.approved}</div>
          <div className="text-sm text-green-600">?πÏù∏??/div>
        </div>
        <div className="bg-red-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-800">{stats.rejected}</div>
          <div className="text-sm text-red-600">Í±∞Ï†à??/div>
        </div>
      </div>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">?†Ï≤≠ ID</th>
            <th className="p-2 border">Í∞ïÏ¢åÎ™?/th>
            <th className="p-2 border">Í∞ïÏÇ¨</th>
            <th className="p-2 border">Í∞ÄÍ≤?/th>
            <th className="p-2 border">?†Ï≤≠??/th>
            <th className="p-2 border">?ÅÌÉú</th>
            <th className="p-2 border">Í¥ÄÎ¶?/th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => {
            const academyInfo = getAcademyInfo(app.academyId);
            return (
              <tr key={app.id} className="text-center">
                <td className="p-2 border text-sm">{app.id.substring(0, 8)}...</td>
                <td className="p-2 border">{academyInfo?.title || "Í∞ïÏ¢å ?ïÎ≥¥ ?ÜÏùå"}</td>
                <td className="p-2 border">{academyInfo?.instructor || "-"}</td>
                <td className="p-2 border">{academyInfo?.price ? `${academyInfo.price.toLocaleString()}?? : "-"}</td>
                <td className="p-2 border text-sm">
                  {app.appliedAt?.toDate ? app.appliedAt.toDate().toLocaleString() : ""}
                </td>
                <td className="p-2 border">
                  <span className={`px-2 py-1 rounded text-sm ${
                    app.status === "approved" ? "bg-green-100 text-green-800" :
                    app.status === "rejected" ? "bg-red-100 text-red-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>
                    {app.status === "pending" ? "?ÄÍ∏∞Ï§ë" : 
                     app.status === "approved" ? "?πÏù∏?? : "Í±∞Ï†à??}
                  </span>
                </td>
                <td className="p-2 border">
                  <button
                    onClick={() => handleUpdate(app.id, "approved")}
                    className="bg-green-500 text-white px-2 py-1 rounded mr-2 text-sm hover:bg-green-600"
                  >
                    ?πÏù∏
                  </button>
                  <button
                    onClick={() => handleUpdate(app.id, "rejected")}
                    className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                  >
                    Í±∞Ï†à
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
