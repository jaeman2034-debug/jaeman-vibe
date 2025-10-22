// ?îç AI Í≤Ä???òÏù¥ÏßÄ - ?êÏó∞?¥Î°ú ?ÅÌíà Í≤Ä??import React, { useState, useRef, useEffect } from "react";
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

  // ?éôÔ∏?STT Ï¥àÍ∏∞??  useEffect(() => {
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
        console.error('STT ?§Î•ò:', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  // ?ìç ?ÑÏû¨ ?ÑÏπò Í∞Ä?∏Ïò§Í∏?  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('?ÑÏπò ?ëÍ∑º ?§Ìå®:', error.message);
        }
      );
    }
  }, []);

  // ?éôÔ∏??åÏÑ± ?πÏùå ?úÏûë/Ï§ëÏ?
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('??Î∏åÎùº?∞Ï????åÏÑ± ?∏Ïãù??ÏßÄ?êÌïòÏßÄ ?äÏäµ?àÎã§.');
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

  // ?ß† AI Í≤Ä??Î°úÏßÅ
  const performAISearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    console.log("?îç AI Í≤Ä???úÏûë:", query);

    try {
      // 1. Firestore?êÏÑú Î™®Îì† ?ÅÌíà Í∞Ä?∏Ïò§Í∏?      const marketCollection = collection(db, "marketItems");
      const snapshot = await getDocs(marketCollection);
      const allProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SearchResult[];

      // 2. ?êÏó∞??Ï≤òÎ¶¨Î°??ÑÌÑ∞Îß?      const filteredResults = allProducts.filter(product => {
        const searchText = `${product.title} ${product.description} ${product.category}`.toLowerCase();
        const queryLower = query.toLowerCase();

        // ?§Ïõå??Îß§Ïπ≠
        const keywords = queryLower.split(' ').filter(word => word.length > 1);
        const hasKeyword = keywords.some(keyword => searchText.includes(keyword));

        // ?πÏ†ï ?®ÌÑ¥ Îß§Ïπ≠
        const patterns = [
          { pattern: /(\d+)(ÎßåÏõê|??Ï≤úÏõê)/, field: 'price' },
          { pattern: /(?àÍ≤É|Ï§ëÍ≥†|Í±∞Ïùò ?àÍ≤É)/, field: 'condition' },
          { pattern: /(Ï∂ïÍµ¨|?ºÍµ¨|?çÍµ¨|Î∞∞Íµ¨|Í≥®ÌîÑ|?åÎãà???¨Îãù|?¨Ïä§|?îÍ?)/, field: 'category' }
        ];

        let matchesPattern = false;
        patterns.forEach(({ pattern, field }) => {
          if (pattern.test(queryLower)) {
            const match = queryLower.match(pattern);
            if (match) {
              if (field === 'price') {
                let price = parseInt(match[1]);
                if (match[2] === 'ÎßåÏõê') price *= 10000;
                else if (match[2] === 'Ï≤úÏõê') price *= 1000;
                matchesPattern = matchesPattern || product.price <= price * 1.2; // 20% ?¨Ïú†
              } else {
                matchesPattern = matchesPattern || searchText.includes(match[1]);
              }
            }
          }
        });

        return hasKeyword || matchesPattern;
      });

      // 3. Í±∞Î¶¨ Í≥ÑÏÇ∞ (?ÑÏπòÍ∞Ä ?àÎäî Í≤ΩÏö∞)
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

      // 4. Ï∂îÍ? ?ÑÌÑ∞ ?ÅÏö©
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

      // 5. ?ïÎ†¨ (Í±∞Î¶¨?? Í∞ÄÍ≤©Ïàú)
      finalResults.sort((a, b) => {
        if (a.distance && b.distance) {
          return a.distance - b.distance;
        }
        return a.price - b.price;
      });

      setSearchResults(finalResults);
      console.log("??Í≤Ä???ÑÎ£å:", finalResults.length, "Í∞?Í≤∞Í≥º");

    } catch (error) {
      console.error("??Í≤Ä???§Ìå®:", error);
      alert("Í≤Ä??Ï§??§Î•òÍ∞Ä Î∞úÏÉù?àÏäµ?àÎã§.");
    } finally {
      setIsSearching(false);
    }
  };

  // Í±∞Î¶¨ Í≥ÑÏÇ∞ ?®Ïàò
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // ÏßÄÍµ?Î∞òÏ?Î¶?(ÎØ∏ÌÑ∞)
    const ?1 = lat1 * Math.PI/180;
    const ?2 = lat2 * Math.PI/180;
    const ?? = (lat2-lat1) * Math.PI/180;
    const ?Œª = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(??/2) * Math.sin(??/2) +
              Math.cos(?1) * Math.cos(?2) *
              Math.sin(?Œª/2) * Math.sin(?Œª/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // ÎØ∏ÌÑ∞ ?®ÏúÑ
  };

  // ?çÏä§??Í≤Ä??  const handleTextSearch = () => {
    performAISearch(searchQuery);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* ?§Îçî */}
      <header className="bg-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Search className="w-6 h-6 text-green-600" />
                ?îç AI ?ÅÌíà Í≤Ä??              </h1>
              <p className="text-sm text-gray-600">?åÏÑ±?¥ÎÇò ?çÏä§?∏Î°ú ?êÌïò???ÅÌíà??Ï∞æÏïÑÎ≥¥ÏÑ∏??/p>
            </div>
            <button
              onClick={() => navigate('/market')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ??ÎßàÏºì?ºÎ°ú ?åÏïÑÍ∞ÄÍ∏?            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Í≤Ä???ÖÎ†• ?πÏÖò */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Mic className="w-5 h-5 text-blue-600" />
            ?éôÔ∏??åÏÑ± ?êÎäî ?çÏä§?∏Î°ú Í≤Ä??          </h2>
          
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
              {isRecording ? '?πÏùå Ï§ëÏ?' : '?åÏÑ± Í≤Ä??}
            </button>
            
            {isRecording && (
              <div className="flex items-center gap-2 text-red-500">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">?£Í≥† ?àÏäµ?àÎã§...</span>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="?? Ï∂ïÍµ¨??5ÎßåÏõê ?¥Ìïò, ?àÍ≤É ?çÍµ¨Í≥? ?¨Ïä§??Í∑ºÏ≤ò ?¥Îèô??.."
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
                  Í≤Ä??Ï§?..
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Í≤Ä??                </div>
              )}
            </button>
          </div>

          {voiceTranscript && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">?éØ ?∏Ïãù???åÏÑ±:</h3>
              <p className="text-gray-800">{voiceTranscript}</p>
            </div>
          )}
        </div>

        {/* ?ÑÌÑ∞ ?πÏÖò */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5 text-purple-600" />
            ?îß Í≤Ä???ÑÌÑ∞
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ïπ¥ÌÖåÍ≥†Î¶¨</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">?ÑÏ≤¥</option>
                <option value="Ï∂ïÍµ¨">Ï∂ïÍµ¨</option>
                <option value="?ºÍµ¨">?ºÍµ¨</option>
                <option value="?çÍµ¨">?çÍµ¨</option>
                <option value="Î∞∞Íµ¨">Î∞∞Íµ¨</option>
                <option value="Í≥®ÌîÑ">Í≥®ÌîÑ</option>
                <option value="?åÎãà??>?åÎãà??/option>
                <option value="?¨Îãù">?¨Îãù</option>
                <option value="?¨Ïä§">?¨Ïä§</option>
                <option value="?îÍ?">?îÍ?</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ÏµúÎ? Í∞ÄÍ≤?/label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                placeholder="?? 100000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">?ÅÌÉú</label>
              <select
                value={filters.condition}
                onChange={(e) => setFilters(prev => ({ ...prev, condition: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">?ÑÏ≤¥</option>
                <option value="?àÍ≤É">?àÍ≤É</option>
                <option value="Ï§ëÍ≥†">Ï§ëÍ≥†</option>
                <option value="Í±∞Ïùò ?àÍ≤É">Í±∞Ïùò ?àÍ≤É</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ÏµúÎ? Í±∞Î¶¨</label>
              <select
                value={filters.maxDistance}
                onChange={(e) => setFilters(prev => ({ ...prev, maxDistance: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="1000">1km</option>
                <option value="3000">3km</option>
                <option value="5000">5km</option>
                <option value="10000">10km</option>
                <option value="999999">?ÑÏ≤¥</option>
              </select>
            </div>
          </div>
        </div>

        {/* Í≤Ä??Í≤∞Í≥º */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-green-600" />
            ?îç Í≤Ä??Í≤∞Í≥º ({searchResults.length}Í∞?
          </h2>

          {searchResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">?îç</div>
              <p className="text-gray-500 text-lg">Í≤Ä??Í≤∞Í≥ºÍ∞Ä ?ÜÏäµ?àÎã§.</p>
              <p className="text-gray-400 text-sm mt-2">?§Î•∏ ?§Ïõå?úÎ°ú Í≤Ä?âÌï¥Î≥¥ÏÑ∏??</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/market/${item.id}`)}
                  className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                >
                  {/* ?¥Î?ÏßÄ */}
                  <div className="aspect-[4/3] overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-200 text-gray-400 text-sm">
                        ?¥Î?ÏßÄ ?ÜÏùå
                      </div>
                    )}
                  </div>

                  {/* ?ÅÌíà ?ïÎ≥¥ */}
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
