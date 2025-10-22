import { useEffect, useState } from "react";
import { collection, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function AdminProductsPage() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  // ??Firestore ?�시�?구독
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "marketItems"), (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(data);
    });
    return () => unsubscribe();
  }, []);

  // ??관리자 계정�??�근 (개발??- ?�제 ?�영???�메??변�??�요)
  useEffect(() => {
    if (!currentUser) return;
    // 개발?? 모든 ?�용???�근 ?�용 (?�제 ?�영???�래 주석 ?�제)
    // if (currentUser.email !== "admin@yagovibe.com") {
    //   alert("관리자�??�근?????�습?�다.");
    //   navigate("/");
    // }
  }, [currentUser]);

  // ???�태 변�?  const handleStatusChange = async (id, currentStatus) => {
    const next =
      currentStatus === "open"
        ? "reserved"
        : currentStatus === "reserved"
        ? "sold"
        : "open";
    try {
      await updateDoc(doc(db, "marketItems", id), { status: next });
      alert(`?�� ?�태가 '${next}' ?�로 변경되?�습?�다.`);
    } catch (err) {
      console.error("???�태 변�??�류:", err);
    }
  };

  // ???�품 ??��
  const handleDelete = async (id) => {
    if (!window.confirm("?�말 ??��?�시겠습?�까?")) return;
    try {
      await deleteDoc(doc(db, "marketItems", id));
      alert("?���???�� ?�료");
    } catch (err) {
      console.error("????�� ?�류:", err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-6">?�️ 관리자 ?�품 ?�?�보??/h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-4 border rounded-lg shadow-sm bg-white hover:shadow-md transition"
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-48 object-cover rounded-lg mb-3"
            />
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="text-gray-500 mb-1">?�� {item.price?.toLocaleString()}??/p>
            <p className="text-sm text-gray-400 mb-2">
              ?�매?? {item.sellerId?.slice(0, 8) || "?�음"}??            </p>

            <div className="flex justify-between items-center mb-2">
              <span
                className={`text-sm font-semibold ${
                  item.status === "open"
                    ? "text-green-500"
                    : item.status === "reserved"
                    ? "text-yellow-500"
                    : "text-gray-500"
                }`}
              >
                {item.status === "open"
                  ? "?�� ?�매�?
                  : item.status === "reserved"
                  ? "?�� 거래�?
                  : "??거래?�료"}
              </span>
              <button
                onClick={() => handleStatusChange(item.id, item.status)}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-400"
              >
                ?�태 변�?              </button>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => navigate(`/product/${item.id}`)}
                className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-100"
              >
                ?�세보기
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-400"
              >
                ??��
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <p className="text-center text-gray-400 mt-10">?�록???�품???�습?�다.</p>
      )}
    </div>
  );
}
