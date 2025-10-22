import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

const db = getFirestore(app);

export default function AcademyQAAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, "academyQA"));
      setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleUpdate = async (id: string, newAnswer: string) => {
    try {
      await updateDoc(doc(db, "academyQA", id), { answer: newAnswer });
      setItems(items.map(i => i.id === id ? { ...i, answer: newAnswer } : i));
      alert("?µë????˜ì •?˜ì—ˆ?µë‹ˆ?? ??);
    } catch (err) {
      console.error(err);
      alert("?˜ì • ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤! ??);
    }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto p-4">
      <p className="text-center text-lg">?“‹ Q&A ?°ì´??ë¡œë”© ì¤?..</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">?“‹ ?„ì¹´?°ë? Q&A ê´€ë¦¬ì</h2>
        <Link 
          to="/academy-simple/qa" 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          ??Q&A ?˜ì´ì§€ë¡?        </Link>
      </div>

      {/* ?µê³„ ?•ë³´ */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{items.length}</div>
            <div className="text-sm text-gray-600">?„ì²´ Q&A</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {items.filter(item => item.answer && item.answer.trim()).length}
            </div>
            <div className="text-sm text-gray-600">?µë? ?„ë£Œ</div>
          </div>
        </div>
      </div>

      {/* Q&A ëª©ë¡ */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">?“­ ?„ì§ Q&Aê°€ ?†ìŠµ?ˆë‹¤.</p>
            <p className="text-sm mt-2">?¬ìš©?ê? ì§ˆë¬¸???˜ë©´ ?¬ê¸°???œì‹œ?©ë‹ˆ??</p>
          </div>
        ) : (
          items.map((q) => (
            <div key={q.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
              <div className="mb-3">
                <p className="font-semibold text-gray-800 mb-2">??{q.question}</p>
                <p className="text-xs text-gray-500">
                  ??{q.createdAt?.toDate ? 
                    q.createdAt.toDate().toLocaleString() : 
                    new Date(q.createdAt).toLocaleString()
                  }
                </p>
              </div>
              
              <textarea
                defaultValue={q.answer || ""}
                className="w-full border border-gray-300 rounded p-2 my-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="?µë????…ë ¥?˜ì„¸??.."
                onBlur={(e) => {
                  if (e.target.value !== q.answer) {
                    handleUpdate(q.id, e.target.value);
                  }
                }}
              />
              
              <div className="text-xs text-gray-400 mt-1">
                ?’¡ ?µë? ?˜ì • ???¤ë¥¸ ê³³ì„ ?´ë¦­?˜ë©´ ?ë™ ?€?¥ë©?ˆë‹¤.
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
