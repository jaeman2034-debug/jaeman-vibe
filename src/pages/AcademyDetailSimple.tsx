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
      alert("??? ì²­???„ë£Œ?˜ì—ˆ?µë‹ˆ??");
    } catch (err) {
      console.error(err);
      alert("??? ì²­ ì¤??¤ë¥˜ ë°œìƒ");
    }
  };

  if (!academy) return <p>??ë¡œë”© ì¤?..</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Link 
        to="/academy-simple" 
        className="text-blue-500 hover:underline mb-4 inline-block"
      >
        ??ê°•ì¢Œ ëª©ë¡?¼ë¡œ ?Œì•„ê°€ê¸?      </Link>
      <h2 className="text-2xl font-bold">{academy.title}</h2>
      <p className="text-gray-600">{academy.instructor}</p>
      {academy.thumbnailUrl && (
        <img src={academy.thumbnailUrl} alt={academy.title} className="w-full h-64 object-cover rounded my-3" />
      )}
      <p className="mb-2">{academy.description}</p>
      <p>?“… {academy.date}</p>
      <p>?’° {academy.price.toLocaleString()}??/p>
      <p>?‘¥ ?•ì› {academy.capacity}ëª?/p>

      <button
        onClick={handleApply}
        className="mt-4 bg-green-500 text-white p-2 rounded hover:bg-green-600"
      >
        ê°•ì¢Œ ? ì²­?˜ê¸°
      </button>
    </div>
  );
}
