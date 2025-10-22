import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  QueryConstraint
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase";

interface Product {
  id: string;
  filename: string;
  fileUrl: string;
  title?: string;
  price?: number;
  caption_ko?: string;
  caption_en?: string;
  tags?: string[];
  searchKeywords?: string[];
  createdAt?: any;
  status?: "open" | "reserved" | "sold";
}

export default function MarketListPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");

  // 카테고리 ?�의
  const categories = [
    { id: "all", name: "?�체", icon: "?���? },
    { id: "축구", name: "축구", icon: "?? },
    { id: "축구??, name: "축구??, icon: "?��" },
    { id: "?�니??, name: "?�니??, icon: "?��" },
    { id: "?�동�?, name: "?�동�?, icon: "?��" },
    { id: "골키??, name: "골키??, icon: "?��" },
    { id: "accessories", name: "?�품", icon: "?��" },
  ];

  // ?�품 가?�오�?  const fetchProducts = async (keyword?: string, category?: string) => {
    setLoading(true);
    console.log("?�� ?�품 검??", { keyword, category });

    try {
      const ref = collection(db, "market-uploads");
      const constraints: QueryConstraint[] = [];

      // 카테고리 ?�터
      if (category && category !== "all") {
        constraints.push(where("tags", "array-contains", category));
      }

      // ?�워??검??(searchKeywords 배열 검??
      if (keyword && keyword.trim() !== "") {
        constraints.push(where("searchKeywords", "array-contains", keyword.toLowerCase()));
      }

      // ?�렬
      if (sortBy === "latest") {
        constraints.push(orderBy("createdAt", "desc"));
      }

      // 최�? 50�?      constraints.push(limit(50));

      const q = query(ref, ...constraints);
      const snap = await getDocs(q);

      const productsList = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Product, "id">)
      }));

      console.log("???�품 로드 ?�료:", productsList.length, "�?);
      setProducts(productsList);

    } catch (error) {
      console.error("???�품 로드 ?�류:", error);
      alert("?�품??불러?�는 �??�류가 발생?�습?�다.");
    } finally {
      setLoading(false);
    }
  };

  // ?�� AI ?�연??검??  const handleAISearch = async () => {
    if (!searchQuery.trim()) {
      fetchProducts();
      return;
    }

    setLoading(true);

    try {
      console.log("?�� AI ?�워??추출 ?�작:", searchQuery);
      
      // Cloud Functions ?�출
      const refineFunc = httpsCallable(functions, "refineSearchKeyword");
      const result = await refineFunc({ query: searchQuery }) as { data: { keywords: string[] } };
      const keywords = result.data.keywords;

      console.log("??추출???�워??", keywords);

      // �?번째 ?�워?�로 검??      if (keywords.length > 0) {
        await fetchProducts(keywords[0], selectedCategory);
      } else {
        await fetchProducts(searchQuery, selectedCategory);
      }

    } catch (error) {
      console.error("??AI 검???�류:", error);
      // Fallback: ?�본 쿼리�?검??      await fetchProducts(searchQuery, selectedCategory);
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    fetchProducts(undefined, selectedCategory);
  }, [selectedCategory, sortBy]);

  // 검?????�출
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAISearch();
  };

  // ?�품 ?�태 배�? ?�상
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "open": return "bg-green-100 text-green-700";
      case "reserved": return "bg-yellow-100 text-yellow-700";
      case "sold": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case "open": return "?�매�?;
      case "reserved": return "?�약�?;
      case "sold": return "거래?�료";
      default: return "?�태미정";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* ?�더 */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-800">??YAGO ?�포�?마켓</h1>
          <button
            onClick={() => navigate("/market/add")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            + ?�품 ?�록
          </button>
        </div>

        {/* 검???�역 */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-4">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="?�� AI 검?? ?�품�? ?�그, ?�워?�로 검??.. (?? 축구?? ?�니??"
            className="flex-1 border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium disabled:bg-gray-400"
          >
            {loading ? "?? : "?��"} 검??          </button>
        </form>

        {/* 카테고리 ?�터 */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-indigo-300"
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* ?�렬 ?�션 */}
        <div className="flex items-center gap-3 mt-4 text-sm">
          <span className="text-gray-500 font-medium">?�렬:</span>
          <button
            onClick={() => setSortBy("latest")}
            className={`px-3 py-1 rounded-full ${
              sortBy === "latest"
                ? "bg-indigo-100 text-indigo-700 font-semibold"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            최신??          </button>
          <button
            onClick={() => setSortBy("popular")}
            className={`px-3 py-1 rounded-full ${
              sortBy === "popular"
                ? "bg-indigo-100 text-indigo-700 font-semibold"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            ?�기??          </button>
        </div>
      </div>

      {/* ?�품 목록 */}
      <div className="max-w-7xl mx-auto px-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-500">?�품??불러?�는 �?..</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-4">검??결과가 ?�습?�다.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                fetchProducts();
              }}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              ?�체 보기
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              �?<span className="font-bold text-indigo-600">{products.length}</span>개의 ?�품
            </p>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => navigate(`/market/${product.filename}`)}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                >
                  {/* ?�품 ?��?지 */}
                  <div className="relative">
                    <img
                      src={product.fileUrl}
                      alt={product.title || product.filename}
                      className="w-full h-48 object-cover"
                    />
                    {/* ?�태 배�? */}
                    <span
                      className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(
                        product.status
                      )}`}
                    >
                      {getStatusText(product.status)}
                    </span>
                  </div>

                  {/* ?�품 ?�보 */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 mb-1 truncate">
                      {product.title || "?�목 ?�음"}
                    </h3>
                    {product.price && (
                      <p className="text-lg font-bold text-indigo-600 mb-2">
                        {product.price.toLocaleString()}??                      </p>
                    )}
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {product.caption_ko || "?�명 ?�음"}
                    </p>

                    {/* ?�그 */}
                    <div className="flex flex-wrap gap-1">
                      {product.tags?.slice(0, 4).map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

