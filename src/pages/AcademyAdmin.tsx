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
      // ?�청 ?�이??가?�오�?      const appsSnapshot = await getDocs(collection(db, "applications"));
      setApplications(
        appsSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Application))
      );
      
      // 강좌 ?�이??가?�오�?      const academiesSnapshot = await getDocs(collection(db, "academies"));
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
      alert(`?�청 ?�태가 '${status}'�?변경되?�습?�다 ??);
    } catch (err) {
      console.error(err);
      alert("?�태 변�?�??�류 발생 ??);
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
        <h2 className="text-2xl font-bold">?�� ?�청??관�?/h2>
        <Link 
          to="/academy-simple" 
          className="text-blue-500 hover:underline"
        >
          ???�카?��?�??�아가�?        </Link>
      </div>
      
      {/* ?�계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-800">{stats.total}</div>
          <div className="text-sm text-blue-600">?�체 ?�청</div>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-800">{stats.pending}</div>
          <div className="text-sm text-yellow-600">?�기중</div>
        </div>
        <div className="bg-green-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-800">{stats.approved}</div>
          <div className="text-sm text-green-600">?�인??/div>
        </div>
        <div className="bg-red-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-800">{stats.rejected}</div>
          <div className="text-sm text-red-600">거절??/div>
        </div>
      </div>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">?�청 ID</th>
            <th className="p-2 border">강좌�?/th>
            <th className="p-2 border">강사</th>
            <th className="p-2 border">가�?/th>
            <th className="p-2 border">?�청??/th>
            <th className="p-2 border">?�태</th>
            <th className="p-2 border">관�?/th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => {
            const academyInfo = getAcademyInfo(app.academyId);
            return (
              <tr key={app.id} className="text-center">
                <td className="p-2 border text-sm">{app.id.substring(0, 8)}...</td>
                <td className="p-2 border">{academyInfo?.title || "강좌 ?�보 ?�음"}</td>
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
                    {app.status === "pending" ? "?�기중" : 
                     app.status === "approved" ? "?�인?? : "거절??}
                  </span>
                </td>
                <td className="p-2 border">
                  <button
                    onClick={() => handleUpdate(app.id, "approved")}
                    className="bg-green-500 text-white px-2 py-1 rounded mr-2 text-sm hover:bg-green-600"
                  >
                    ?�인
                  </button>
                  <button
                    onClick={() => handleUpdate(app.id, "rejected")}
                    className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                  >
                    거절
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
