// ?�� AI 검???�이지 - ?�연?�로 ?�품 검??import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { Mic, MicOff, Search, Sparkles, MapPin, Filter } from "lucide-react";

type SearchResult = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  imageUrl?: string;
  location?: string;
  distance?: number;
};

export default function AISearchPage() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [filters, setFilters] = useState({
    category: "",
    maxPrice: "",
    condition: "",
    maxDistance: "5000"
  });
  
  const recognitionRef = useRef<any>(null);

  // ?���?STT 초기??  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new (window as any).webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'ko-KR';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceTranscript(transcript);
        setSearchQuery(transcript);
        performAISearch(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('STT ?�류:', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  // ?�� ?�재 ?�치 가?�오�?  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('?�치 ?�근 ?�패:', error.message);
        }
      );
    }
  }, []);

  // ?���??�성 ?�음 ?�작/중�?
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('??브라?��????�성 ?�식??지?�하지 ?�습?�다.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
      setVoiceTranscript("");
    }
  };

  // ?�� AI 검??로직
  const performAISearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    console.log("?�� AI 검???�작:", query);

    try {
      // 1. Firestore?�서 모든 ?�품 가?�오�?      const marketCollection = collection(db, "marketItems");
      const snapshot = await getDocs(marketCollection);
      const allProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SearchResult[];

      // 2. ?�연??처리�??�터�?      const filteredResults = allProducts.filter(product => {
        const searchText = `${product.title} ${product.description} ${product.category}`.toLowerCase();
        const queryLower = query.toLowerCase();

        // ?�워??매칭
        const keywords = queryLower.split(' ').filter(word => word.length > 1);
        const hasKeyword = keywords.some(keyword => searchText.includes(keyword));

        // ?�정 ?�턴 매칭
        const patterns = [
          { pattern: /(\d+)(만원|??천원)/, field: 'price' },
          { pattern: /(?�것|중고|거의 ?�것)/, field: 'condition' },
          { pattern: /(축구|?�구|?�구|배구|골프|?�니???�닝|?�스|?��?)/, field: 'category' }
        ];

        let matchesPattern = false;
        patterns.forEach(({ pattern, field }) => {
          if (pattern.test(queryLower)) {
            const match = queryLower.match(pattern);
            if (match) {
              if (field === 'price') {
                let price = parseInt(match[1]);
                if (match[2] === '만원') price *= 10000;
                else if (match[2] === '천원') price *= 1000;
                matchesPattern = matchesPattern || product.price <= price * 1.2; // 20% ?�유
              } else {
                matchesPattern = matchesPattern || searchText.includes(match[1]);
              }
            }
          }
        });

        return hasKeyword || matchesPattern;
      });

      // 3. 거리 계산 (?�치가 ?�는 경우)
      let resultsWithDistance = filteredResults;
      if (currentLocation) {
        resultsWithDistance = filteredResults.map(product => {
          if (product.location?.lat && product.location?.lng) {
            const distance = calculateDistance(
              currentLocation.lat,
              currentLocation.lng,
              product.location.lat,
              product.location.lng
            );
            return { ...product, distance };
          }
          return product;
        }).filter(product => 
          !product.distance || product.distance <= parseInt(filters.maxDistance)
        );
      }

      // 4. 추�? ?�터 ?�용
      let finalResults = resultsWithDistance;
      
      if (filters.category) {
        finalResults = finalResults.filter(product => 
          product.category === filters.category
        );
      }
      
      if (filters.maxPrice) {
        finalResults = finalResults.filter(product => 
          product.price <= parseInt(filters.maxPrice)
        );
      }
      
      if (filters.condition) {
        finalResults = finalResults.filter(product => 
          product.condition === filters.condition
        );
      }

      // 5. ?�렬 (거리?? 가격순)
      finalResults.sort((a, b) => {
        if (a.distance && b.distance) {
          return a.distance - b.distance;
        }
        return a.price - b.price;
      });

      setSearchResults(finalResults);
      console.log("??검???�료:", finalResults.length, "�?결과");

    } catch (error) {
      console.error("??검???�패:", error);
      alert("검??�??�류가 발생?�습?�다.");
    } finally {
      setIsSearching(false);
    }
  };

  // 거리 계산 ?�수
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // 지�?반�?�?(미터)
    const ?1 = lat1 * Math.PI/180;
    const ?2 = lat2 * Math.PI/180;
    const ?? = (lat2-lat1) * Math.PI/180;
    const ?λ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(??/2) * Math.sin(??/2) +
              Math.cos(?1) * Math.cos(?2) *
              Math.sin(?λ/2) * Math.sin(?λ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // 미터 ?�위
  };

  // ?�스??검??  const handleTextSearch = () => {
    performAISearch(searchQuery);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* ?�더 */}
      <header className="bg-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Search className="w-6 h-6 text-green-600" />
                ?�� AI ?�품 검??              </h1>
              <p className="text-sm text-gray-600">?�성?�나 ?�스?�로 ?�하???�품??찾아보세??/p>
            </div>
            <button
              onClick={() => navigate('/market')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ??마켓?�로 ?�아가�?            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 검???�력 ?�션 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Mic className="w-5 h-5 text-blue-600" />
            ?���??�성 ?�는 ?�스?�로 검??          </h2>
          
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={toggleRecording}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              {isRecording ? '?�음 중�?' : '?�성 검??}
            </button>
            
            {isRecording && (
              <div className="flex items-center gap-2 text-red-500">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">?�고 ?�습?�다...</span>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="?? 축구??5만원 ?�하, ?�것 ?�구�? ?�스??근처 ?�동??.."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleTextSearch()}
            />
            <button
              onClick={handleTextSearch}
              disabled={isSearching || !searchQuery.trim()}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                isSearching || !searchQuery.trim()
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isSearching ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  검??�?..
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  검??                </div>
              )}
            </button>
          </div>

          {voiceTranscript && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">?�� ?�식???�성:</h3>
              <p className="text-gray-800">{voiceTranscript}</p>
            </div>
          )}
        </div>

        {/* ?�터 ?�션 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5 text-purple-600" />
            ?�� 검???�터
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">?�체</option>
                <option value="축구">축구</option>
                <option value="?�구">?�구</option>
                <option value="?�구">?�구</option>
                <option value="배구">배구</option>
                <option value="골프">골프</option>
                <option value="?�니??>?�니??/option>
                <option value="?�닝">?�닝</option>
                <option value="?�스">?�스</option>
                <option value="?��?">?��?</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">최�? 가�?/label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                placeholder="?? 100000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">?�태</label>
              <select
                value={filters.condition}
                onChange={(e) => setFilters(prev => ({ ...prev, condition: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">?�체</option>
                <option value="?�것">?�것</option>
                <option value="중고">중고</option>
                <option value="거의 ?�것">거의 ?�것</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">최�? 거리</label>
              <select
                value={filters.maxDistance}
                onChange={(e) => setFilters(prev => ({ ...prev, maxDistance: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="1000">1km</option>
                <option value="3000">3km</option>
                <option value="5000">5km</option>
                <option value="10000">10km</option>
                <option value="999999">?�체</option>
              </select>
            </div>
          </div>
        </div>

        {/* 검??결과 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-green-600" />
            ?�� 검??결과 ({searchResults.length}�?
          </h2>

          {searchResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">?��</div>
              <p className="text-gray-500 text-lg">검??결과가 ?�습?�다.</p>
              <p className="text-gray-400 text-sm mt-2">?�른 ?�워?�로 검?�해보세??</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/market/${item.id}`)}
                  className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                >
                  {/* ?��?지 */}
                  <div className="aspect-[4/3] overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-200 text-gray-400 text-sm">
                        ?��?지 ?�음
                      </div>
                    )}
                  </div>

                  {/* ?�품 ?�보 */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-gray-800 truncate">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {item.description}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-green-600 font-bold text-lg">
                        {item.price.toLocaleString()}??                      </span>
                      {item.distance && (
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                          {item.distance < 1000 
                            ? `${item.distance}m` 
                            : `${(item.distance / 1000).toFixed(1)}km`
                          }
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span className="bg-gray-200 px-2 py-1 rounded">
                        {item.category}
                      </span>
                      <span className="bg-gray-200 px-2 py-1 rounded">
                        {item.condition}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
