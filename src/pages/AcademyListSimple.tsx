import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFirestore, collection, getDocs } from "firebase/firestore";
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

export default function AcademyListSimple() {
  const [academies, setAcademies] = useState<Academy[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, "academies"));
      setAcademies(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Academy)));
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">?ÑÏπ¥?∞Î? Í∞ïÏ¢å Î™©Î°ù</h2>
        <Link
          to="/academy-simple/new"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          ??Í∞ïÏ¢å ?±Î°ù
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {academies.map((a) => (
          <div key={a.id} className="border rounded shadow p-3">
            {a.thumbnailUrl && (
              <img 
                src={a.thumbnailUrl} 
                alt={a.title} 
                className="w-full h-40 object-cover rounded" 
              />
            )}
            <h3 className="font-bold mt-2">{a.title}</h3>
            <p className="text-sm text-gray-600">{a.instructor}</p>
            <p className="text-sm">{a.description}</p>
            <p className="text-sm">?ìÖ {a.date}</p>
            <p className="text-sm">?í∞ {a.price.toLocaleString()}??/p>
            <p className="text-sm">?ë• ?ïÏõê {a.capacity}Î™?/p>
            <Link
              to={`/academy-simple/${a.id}`}
              className="inline-block mt-2 text-blue-500 hover:underline"
            >
              ?ÅÏÑ∏Î≥¥Í∏∞ ??            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
