import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getFirestore, doc, getDoc, collection, addDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

const db = getFirestore(app);

type Academy = {
  id: string;
  title: string;
  description: string;
  instructor: string;
  date: string;
  price: number;
  capacity: number;
  thumbnailUrl: string;
};

export default function AcademyDetailSimple() {
  const { id } = useParams();
  const [academy, setAcademy] = useState<Academy | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const snap = await getDoc(doc(db, "academies", id));
      if (snap.exists()) {
        setAcademy({ id: snap.id, ...snap.data() } as Academy);
      }
    };
    fetchData();
  }, [id]);

  const handleApply = async () => {
    if (!academy) return;
    try {
      await addDoc(collection(db, "applications"), {
        academyId: academy.id,
        appliedAt: new Date(),
        status: "pending",
      });
      alert("???�청???�료?�었?�니??");
    } catch (err) {
      console.error(err);
      alert("???�청 �??�류 발생");
    }
  };

  if (!academy) return <p>??로딩 �?..</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Link 
        to="/academy-simple" 
        className="text-blue-500 hover:underline mb-4 inline-block"
      >
        ??강좌 목록?�로 ?�아가�?      </Link>
      <h2 className="text-2xl font-bold">{academy.title}</h2>
      <p className="text-gray-600">{academy.instructor}</p>
      {academy.thumbnailUrl && (
        <img src={academy.thumbnailUrl} alt={academy.title} className="w-full h-64 object-cover rounded my-3" />
      )}
      <p className="mb-2">{academy.description}</p>
      <p>?�� {academy.date}</p>
      <p>?�� {academy.price.toLocaleString()}??/p>
      <p>?�� ?�원 {academy.capacity}�?/p>

      <button
        onClick={handleApply}
        className="mt-4 bg-green-500 text-white p-2 rounded hover:bg-green-600"
      >
        강좌 ?�청?�기
      </button>
    </div>
  );
}
