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

  // ì¹´í…Œê³ ë¦¬ ?•ì˜
  const categories = [
    { id: "all", name: "?„ì²´", icon: "?Ÿï¸? },
    { id: "ì¶•êµ¬", name: "ì¶•êµ¬", icon: "?? },
    { id: "ì¶•êµ¬??, name: "ì¶•êµ¬??, icon: "?‘Ÿ" },
    { id: "? ë‹ˆ??, name: "? ë‹ˆ??, icon: "?‘•" },
    { id: "?´ë™ë³?, name: "?´ë™ë³?, icon: "?½" },
    { id: "ê³¨í‚¤??, name: "ê³¨í‚¤??, icon: "?§¤" },
    { id: "accessories", name: "?©í’ˆ", icon: "?’" },
  ];

  // ?í’ˆ ê°€?¸ì˜¤ê¸?  const fetchProducts = async (keyword?: string, category?: string) => {
    setLoading(true);
    console.log("?” ?í’ˆ ê²€??", { keyword, category });

    try {
      const ref = collection(db, "market-uploads");
      const constraints: QueryConstraint[] = [];

      // ì¹´í…Œê³ ë¦¬ ?„í„°
      if (category && category !== "all") {
        constraints.push(where("tags", "array-contains", category));
      }

      // ?¤ì›Œ??ê²€??(searchKeywords ë°°ì—´ ê²€??
      if (keyword && keyword.trim() !== "") {
        constraints.push(where("searchKeywords", "array-contains", keyword.toLowerCase()));
      }

      // ?•ë ¬
      if (sortBy === "latest") {
        constraints.push(orderBy("createdAt", "desc"));
      }

      // ìµœë? 50ê°?      constraints.push(limit(50));

      const q = query(ref, ...constraints);
      const snap = await getDocs(q);

      const productsList = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Product, "id">)
      }));

      console.log("???í’ˆ ë¡œë“œ ?„ë£Œ:", productsList.length, "ê°?);
      setProducts(productsList);

    } catch (error) {
      console.error("???í’ˆ ë¡œë“œ ?¤ë¥˜:", error);
      alert("?í’ˆ??ë¶ˆëŸ¬?¤ëŠ” ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    } finally {
      setLoading(false);
    }
  };

  // ?§  AI ?ì—°??ê²€??  const handleAISearch = async () => {
    if (!searchQuery.trim()) {
      fetchProducts();
      return;
    }

    setLoading(true);

    try {
      console.log("?§  AI ?¤ì›Œ??ì¶”ì¶œ ?œì‘:", searchQuery);
      
      // Cloud Functions ?¸ì¶œ
      const refineFunc = httpsCallable(functions, "refineSearchKeyword");
      const result = await refineFunc({ query: searchQuery }) as { data: { keywords: string[] } };
      const keywords = result.data.keywords;

      console.log("??ì¶”ì¶œ???¤ì›Œ??", keywords);

      // ì²?ë²ˆì§¸ ?¤ì›Œ?œë¡œ ê²€??      if (keywords.length > 0) {
        await fetchProducts(keywords[0], selectedCategory);
      } else {
        await fetchProducts(searchQuery, selectedCategory);
      }

    } catch (error) {
      console.error("??AI ê²€???¤ë¥˜:", error);
      // Fallback: ?ë³¸ ì¿¼ë¦¬ë¡?ê²€??      await fetchProducts(searchQuery, selectedCategory);
    } finally {
      setLoading(false);
    }
  };

  // ì´ˆê¸° ë¡œë“œ
  useEffect(() => {
    fetchProducts(undefined, selectedCategory);
  }, [selectedCategory, sortBy]);

  // ê²€?????œì¶œ
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAISearch();
  };

  // ?í’ˆ ?íƒœ ë°°ì? ?‰ìƒ
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
      case "open": return "?ë§¤ì¤?;
      case "reserved": return "?ˆì•½ì¤?;
      case "sold": return "ê±°ë˜?„ë£Œ";
      default: return "?íƒœë¯¸ì •";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* ?¤ë” */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-800">??YAGO ?¤í¬ì¸?ë§ˆì¼“</h1>
          <button
            onClick={() => navigate("/market/add")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            + ?í’ˆ ?±ë¡
          </button>
        </div>

        {/* ê²€???ì—­ */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-4">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="?§  AI ê²€?? ?í’ˆëª? ?œê·¸, ?¤ì›Œ?œë¡œ ê²€??.. (?? ì¶•êµ¬?? ? ë‹ˆ??"
            className="flex-1 border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium disabled:bg-gray-400"
          >
            {loading ? "?? : "?”"} ê²€??          </button>
        </form>

        {/* ì¹´í…Œê³ ë¦¬ ?„í„° */}
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

        {/* ?•ë ¬ ?µì…˜ */}
        <div className="flex items-center gap-3 mt-4 text-sm">
          <span className="text-gray-500 font-medium">?•ë ¬:</span>
          <button
            onClick={() => setSortBy("latest")}
            className={`px-3 py-1 rounded-full ${
              sortBy === "latest"
                ? "bg-indigo-100 text-indigo-700 font-semibold"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            ìµœì‹ ??          </button>
          <button
            onClick={() => setSortBy("popular")}
            className={`px-3 py-1 rounded-full ${
              sortBy === "popular"
                ? "bg-indigo-100 text-indigo-700 font-semibold"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            ?¸ê¸°??          </button>
        </div>
      </div>

      {/* ?í’ˆ ëª©ë¡ */}
      <div className="max-w-7xl mx-auto px-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-500">?í’ˆ??ë¶ˆëŸ¬?¤ëŠ” ì¤?..</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-4">ê²€??ê²°ê³¼ê°€ ?†ìŠµ?ˆë‹¤.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                fetchProducts();
              }}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              ?„ì²´ ë³´ê¸°
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              ì´?<span className="font-bold text-indigo-600">{products.length}</span>ê°œì˜ ?í’ˆ
            </p>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => navigate(`/market/${product.filename}`)}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                >
                  {/* ?í’ˆ ?´ë?ì§€ */}
                  <div className="relative">
                    <img
                      src={product.fileUrl}
                      alt={product.title || product.filename}
                      className="w-full h-48 object-cover"
                    />
                    {/* ?íƒœ ë°°ì? */}
                    <span
                      className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(
                        product.status
                      )}`}
                    >
                      {getStatusText(product.status)}
                    </span>
                  </div>

                  {/* ?í’ˆ ?•ë³´ */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 mb-1 truncate">
                      {product.title || "?œëª© ?†ìŒ"}
                    </h3>
                    {product.price && (
                      <p className="text-lg font-bold text-indigo-600 mb-2">
                        {product.price.toLocaleString()}??                      </p>
                    )}
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {product.caption_ko || "?¤ëª… ?†ìŒ"}
                    </p>

                    {/* ?œê·¸ */}
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

