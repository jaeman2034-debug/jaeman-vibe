// ?�� AI ?�록 ?�이지 - STT + ?��?지 ?�식?�로 ?�품 ?�동 ?�성
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, storage } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Mic, MicOff, Camera, Upload, Sparkles, MapPin } from "lucide-react";

type ProductData = {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  location: string;
  imageUrl?: string;
};

export default function AIUploadPage() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [productData, setProductData] = useState<ProductData>({
    title: "",
    description: "",
    price: 0,
    category: "",
    condition: "",
    location: "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ?���?STT 초기??  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new (window as any).webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'ko-KR';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        processVoiceInput(transcript);
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
      setTranscript("");
    }
  };

  // ?�� ?�성 ?�력 처리 (간단??NLU)
  const processVoiceInput = (text: string) => {
    console.log("?���??�성 ?�력:", text);
    
    // 가�?추출 (?�규??
    const priceMatch = text.match(/(\d+)(만원|??천원)/);
    if (priceMatch) {
      let price = parseInt(priceMatch[1]);
      if (priceMatch[2] === '만원') price *= 10000;
      else if (priceMatch[2] === '천원') price *= 1000;
      setProductData(prev => ({ ...prev, price }));
    }

    // 카테고리 추출
    const categories = ['축구', '?�구', '?�구', '배구', '골프', '?�니??, '?�닝', '?�스', '?��?'];
    const foundCategory = categories.find(cat => text.includes(cat));
    if (foundCategory) {
      setProductData(prev => ({ ...prev, category: foundCategory }));
    }

    // ?�태 추출
    if (text.includes('?�것') || text.includes('???�품')) {
      setProductData(prev => ({ ...prev, condition: '?�것' }));
    } else if (text.includes('중고') || text.includes('?�용')) {
      setProductData(prev => ({ ...prev, condition: '중고' }));
    }

    // ?�목?�로 ?�용 (처음 20??
    setProductData(prev => ({ 
      ...prev, 
      title: text.substring(0, 20),
      description: text 
    }));
  };

  // ?�� ?��?지 ?�택
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ?? AI ?�품 ?�록
  const handleAIUpload = async () => {
    if (!productData.title || !selectedImage) {
      alert('?�목�??��?지�?모두 ?�력?�주?�요.');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. ?��?지 ?�로??      const imageRef = ref(storage, `products/${Date.now()}_${selectedImage.name}`);
      const uploadResult = await uploadBytes(imageRef, selectedImage);
      const imageUrl = await getDownloadURL(uploadResult.ref);

      // 2. Firestore???�품 ?�??      const productDoc = {
        title: productData.title,
        description: productData.description,
        price: productData.price || 0,
        category: productData.category || '기�?',
        condition: productData.condition || '중고',
        location: productData.location || '?�치 미등�?,
        imageUrl,
        createdAt: serverTimestamp(),
        coordinates: currentLocation ? {
          lat: currentLocation.lat,
          lng: currentLocation.lng
        } : null,
        aiGenerated: true,
        voiceTranscript: transcript,
      };

      await addDoc(collection(db, "marketItems"), productDoc);

      alert('??AI ?�품 ?�록 ?�료!');
      navigate('/market');
    } catch (error) {
      console.error('???�로???�패:', error);
      alert('?�로?�에 ?�패?�습?�다. ?�시 ?�도?�주?�요.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* ?�더 */}
      <header className="bg-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                ?�� AI ?�품 ?�록
              </h1>
              <p className="text-sm text-gray-600">?�성?�로 말하�??��?지�??�로?�하�??�동?�로 ?�품???�록?�니??/p>
            </div>
            <button
              onClick={() => navigate('/market')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ??마켓?�로 ?�아가�?            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* ?�성 ?�력 ?�션 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Mic className="w-5 h-5 text-blue-600" />
            ?���??�성?�로 ?�품 ?�명?�기
          </h2>
          
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
              {isRecording ? '?�음 중�?' : '?�성 ?�음 ?�작'}
            </button>
            
            {isRecording && (
              <div className="flex items-center gap-2 text-red-500">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">?�고 ?�습?�다...</span>
              </div>
            )}
          </div>

          {transcript && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">?�� ?�식???�성:</h3>
              <p className="text-gray-800">{transcript}</p>
            </div>
          )}
        </div>

        {/* ?��?지 ?�로???�션 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-green-600" />
            ?�� ?�품 ?��?지 ?�로??          </h2>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
            >
              <Upload className="w-5 h-5" />
              ?��?지 ?�택
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            
            {selectedImage && (
              <span className="text-sm text-gray-600">
                ??{selectedImage.name} ?�택??              </span>
            )}
          </div>

          {imagePreview && (
            <div className="mt-4">
              <img
                src={imagePreview}
                alt="?�품 미리보기"
                className="w-64 h-48 object-cover rounded-lg border"
              />
            </div>
          )}
        </div>

        {/* AI 분석 결과 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            ?�� AI 분석 결과
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">?�목</label>
              <input
                type="text"
                value={productData.title}
                onChange={(e) => setProductData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="?�품 ?�목???�력?�세??
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">가�?(??</label>
              <input
                type="number"
                value={productData.price || ''}
                onChange={(e) => setProductData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="가격을 ?�력?�세??
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
              <select
                value={productData.category}
                onChange={(e) => setProductData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">카테고리 ?�택</option>
                <option value="축구">축구</option>
                <option value="?�구">?�구</option>
                <option value="?�구">?�구</option>
                <option value="배구">배구</option>
                <option value="골프">골프</option>
                <option value="?�니??>?�니??/option>
                <option value="?�닝">?�닝</option>
                <option value="?�스">?�스</option>
                <option value="?��?">?��?</option>
                <option value="기�?">기�?</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">?�태</label>
              <select
                value={productData.condition}
                onChange={(e) => setProductData(prev => ({ ...prev, condition: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">?�태 ?�택</option>
                <option value="?�것">?�것</option>
                <option value="중고">중고</option>
                <option value="거의 ?�것">거의 ?�것</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">?�세 ?�명</label>
            <textarea
              value={productData.description}
              onChange={(e) => setProductData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="?�품???�???�세???�명???�력?�세??
            />
          </div>
        </div>

        {/* ?�치 ?�보 */}
        {currentLocation && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" />
              ?�� ?�재 ?�치
            </h2>
            <p className="text-sm text-gray-600">
              ?�도: {currentLocation.lat.toFixed(5)}, 경도: {currentLocation.lng.toFixed(5)}
            </p>
          </div>
        )}

        {/* ?�록 버튼 */}
        <div className="text-center">
          <button
            onClick={handleAIUpload}
            disabled={isProcessing || !productData.title || !selectedImage}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
              isProcessing || !productData.title || !selectedImage
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                AI ?�록 �?..
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                ?? AI ?�품 ?�록?�기
              </div>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
