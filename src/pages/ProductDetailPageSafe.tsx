import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage, auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function ProductDetailPageSafe() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ??로그??체크
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
      console.log("?�� 로그???�태 변�?", user ? user.uid : "로그?�웃");
    });
    return () => unsubscribe();
  }, []);

  // ???�품 ?�이??불러?�기
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError("?�품 ID가 ?�습?�다.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // ???�바�?컬렉?�명 ?�용
        const productRef = doc(db, "marketItems", id);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          const data = productSnap.data();
          const productData = { id: productSnap.id, ...data };
          setProduct(productData);
          
          // ??sellerId ?�인 �?isOwner ?�정
          const currentUser = auth.currentUser;
          const ownerCheck = currentUser && data.sellerId === currentUser.uid;
          setIsOwner(!!ownerCheck);
          
          console.log("?�� ?�품 로드 ?�료:", productData.title);
          console.log("?�� ?�재 ?�용??", currentUser?.uid);
          console.log("?�� ?�품 ?�유??", data.sellerId);
          console.log("?�� ?�유???�인:", ownerCheck);
        } else {
          setError("?�품??찾을 ???�습?�다.");
          console.warn("???�품 ?�음:", id);
        }
      } catch (error) {
        console.error("???�품 불러?�기 ?�패:", error);
        setError("?�품??불러?�는 �??�류가 발생?�습?�다.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // ???�품 ??��
  const handleDelete = async () => {
    if (!isOwner) {
      alert("??�� 권한???�습?�다.");
      return;
    }

    if (!product) {
      alert("?�품 ?�보가 ?�습?�다.");
      return;
    }

    if (!window.confirm("?�말�????�품????��?�시겠습?�까?")) {
      return;
    }

    try {
      // ???��?지 ??�� (Storage)
      if (product.imagePath) {
        try {
          const imageRef = ref(storage, product.imagePath);
          await deleteObject(imageRef);
          console.log("???��?지 ??�� ?�료");
        } catch (imageError) {
          console.warn("?�️ ?��?지 ??�� ?�패 (계속 진행):", imageError);
        }
      }

      // ??Firestore 문서 ??��
      await deleteDoc(doc(db, "marketItems", id!));
      console.log("???�품 ??�� ?�료");

      alert("?�품????��?�었?�니??");
      navigate("/market");
    } catch (error) {
      console.error("???�품 ??�� ?�류:", error);
      alert("?�품 ??�� �??�류가 발생?�습?�다.");
    }
  };

  // ???�태 변�?  const toggleStatus = async () => {
    if (!isOwner) {
      alert("?�태 변�?권한???�습?�다.");
      return;
    }

    if (!product) {
      alert("?�품 ?�보가 ?�습?�다.");
      return;
    }

    try {
      // ???�재 ?�로?�트 ?�태 체계 ?�용
      const statusCycle = {
        "open": "reserved",
        "reserved": "sold", 
        "sold": "open"
      };

      const currentStatus = product.status || "open";
      const newStatus = statusCycle[currentStatus as keyof typeof statusCycle] || "open";

      await updateDoc(doc(db, "marketItems", id!), { 
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      setProduct({ ...product, status: newStatus });
      
      const statusText = {
        "open": "?�매�?,
        "reserved": "거래�?,
        "sold": "거래?�료"
      };

      alert(`?�품 ?�태가 '${statusText[newStatus as keyof typeof statusText]}'?�로 변경되?�습?�다.`);
      console.log("???�태 변�??�료:", newStatus);
    } catch (error) {
      console.error("???�태 변�??�류:", error);
      alert("?�품 ?�태 변�?�??�류가 발생?�습?�다.");
    }
  };

  // ??로딩 ?�태
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">?�품 ?�보�?불러?�는 �?..</p>
        </div>
      </div>
    );
  }

  // ???�러 ?�태
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">??/div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">{error}</h2>
          <button
            onClick={() => navigate("/market")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition"
          >
            마켓?�로 ?�동
          </button>
        </div>
      </div>
    );
  }

  // ???�품 ?�음
  if (!product) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">?��</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">?�품??찾을 ???�습?�다</h2>
          <button
            onClick={() => navigate("/market")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition"
          >
            마켓?�로 ?�동
          </button>
        </div>
      </div>
    );
  }

  // ???�태�??�상 �??�스??  const getStatusInfo = (status?: string) => {
    switch (status) {
      case "open":
        return { color: "text-green-600", text: "?�매�?, bgColor: "bg-green-100" };
      case "reserved":
        return { color: "text-yellow-600", text: "거래�?, bgColor: "bg-yellow-100" };
      case "sold":
        return { color: "text-gray-600", text: "거래?�료", bgColor: "bg-gray-100" };
      default:
        return { color: "text-blue-600", text: "?�태불명", bgColor: "bg-blue-100" };
    }
  };

  const statusInfo = getStatusInfo(product.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ?�더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/market")}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              ??마켓?�로 ?�아가�?            </button>
            <h1 className="text-xl font-bold text-gray-800">?�품 ?�세</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* ?��?지 */}
          {product.imageUrl && (
            <div className="aspect-video bg-gray-100">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6">
            {/* ?�태 배�? */}
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                ??{statusInfo.text}
              </span>
              <div className="text-sm text-gray-500">
                ?�록?? {product.createdAt?.toDate?.()?.toLocaleDateString("ko-KR") || "?�짜 ?�음"}
              </div>
            </div>

            {/* ?�목 */}
            <h1 className="text-2xl font-bold mb-4">{product.title}</h1>

            {/* 가�?*/}
            <div className="text-3xl font-bold text-blue-600 mb-4">
              {product.price?.toLocaleString()}??            </div>

            {/* ?�명 */}
            <p className="text-gray-700 mb-6 whitespace-pre-wrap">
              {product.desc || "?�명 ?�음"}
            </p>

            {/* ??관리자 메뉴 (본인�?보이�? */}
            {isOwner ? (
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate(`/product/edit/${product.id}`)}
                  className="px-6 py-3 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 transition"
                >
                  ?�️ ?�정?�기
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  ?���???��?�기
                </button>
                <button
                  onClick={toggleStatus}
                  className={`px-6 py-3 text-white rounded-lg transition ${
                    product.status === "open" ? "bg-green-500 hover:bg-green-600" :
                    product.status === "reserved" ? "bg-yellow-500 hover:bg-yellow-600" :
                    "bg-gray-500 hover:bg-gray-600"
                  }`}
                >
                  ?�� ?�태 변�?({statusInfo.text})
                </button>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg text-center">
                <p className="text-gray-600 mb-3">?�️ ?�반 ?�용??(관�?권한 ?�음)</p>
                {userId ? (
                  <button
                    onClick={() => navigate(`/chat/${product.id}`)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition"
                  >
                    ?�� ?�매?�에�??�락?�기
                  </button>
                ) : (
                  <p className="text-sm text-gray-500">로그?????�락?????�습?�다.</p>
                )}
              </div>
            )}

            {/* ?�버�??�보 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm">
              <h3 className="font-semibold text-blue-800 mb-2">?�� ?�버�??�보</h3>
              <p><strong>?�재 로그??UID:</strong> {userId || "로그???�됨"}</p>
              <p><strong>?�품 sellerId:</strong> {product.sellerId || "?�음"}</p>
              <p><strong>isOwner:</strong> {isOwner ? "???? : "???�니??}</p>
              <p><strong>?�품 ID:</strong> {product.id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
