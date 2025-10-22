import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export default function AttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [student, setStudent] = useState("");
  const [status, setStatus] = useState("출석");

  // 출석 기록 불러?�기
  useEffect(() => {
    const fetchRecords = async () => {
      const querySnapshot = await getDocs(collection(db, "academy", "attendance", "list"));
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRecords(data);
    };
    fetchRecords();
  }, []);

  // 출석 추�?
  const addRecord = async () => {
    if (!student) return alert("?�생 ?�름???�력?�세??);
    await addDoc(collection(db, "academy", "attendance", "list"), {
      student,
      status,
      date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
      createdAt: new Date(),
    });
    setStudent("");
    setStatus("출석");
    alert("출석??기록?�었?�니??");
    window.location.reload();
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">출석 관�?/h2>

      {/* ?�력 ??*/}
      <div className="mb-6">
        <input
          className="border p-2 mr-2"
          placeholder="?�생 ?�름"
          value={student}
          onChange={(e) => setStudent(e.target.value)}
        />
        <select
          className="border p-2 mr-2"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="출석">출석</option>
          <option value="지�?>지�?/option>
          <option value="결석">결석</option>
        </select>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={addRecord}
        >
          기록 추�?
        </button>
      </div>

      {/* 출석 목록 */}
      <ul className="space-y-2">
        {records.map((r) => (
          <li key={r.id} className="border p-3 rounded">
            <p>
              <span className="font-bold">{r.student}</span> ??{r.status} ({r.date})
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
