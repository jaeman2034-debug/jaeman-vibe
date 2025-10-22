// ?§  AI ?±ë¡ ?˜ì´ì§€ - STT + ?´ë?ì§€ ?¸ì‹?¼ë¡œ ?í’ˆ ?ë™ ?ì„±
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

  // ?™ï¸?STT ì´ˆê¸°??  useEffect(() => {
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
        console.error('STT ?¤ë¥˜:', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  // ?“ ?„ì¬ ?„ì¹˜ ê°€?¸ì˜¤ê¸?  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('?„ì¹˜ ?‘ê·¼ ?¤íŒ¨:', error.message);
        }
      );
    }
  }, []);

  // ?™ï¸??Œì„± ?¹ìŒ ?œì‘/ì¤‘ì?
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('??ë¸Œë¼?°ì????Œì„± ?¸ì‹??ì§€?í•˜ì§€ ?ŠìŠµ?ˆë‹¤.');
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

  // ?§  ?Œì„± ?…ë ¥ ì²˜ë¦¬ (ê°„ë‹¨??NLU)
  const processVoiceInput = (text: string) => {
    console.log("?™ï¸??Œì„± ?…ë ¥:", text);
    
    // ê°€ê²?ì¶”ì¶œ (?•ê·œ??
    const priceMatch = text.match(/(\d+)(ë§Œì›|??ì²œì›)/);
    if (priceMatch) {
      let price = parseInt(priceMatch[1]);
      if (priceMatch[2] === 'ë§Œì›') price *= 10000;
      else if (priceMatch[2] === 'ì²œì›') price *= 1000;
      setProductData(prev => ({ ...prev, price }));
    }

    // ì¹´í…Œê³ ë¦¬ ì¶”ì¶œ
    const categories = ['ì¶•êµ¬', '?¼êµ¬', '?êµ¬', 'ë°°êµ¬', 'ê³¨í”„', '?Œë‹ˆ??, '?¬ë‹', '?¬ìŠ¤', '?”ê?'];
    const foundCategory = categories.find(cat => text.includes(cat));
    if (foundCategory) {
      setProductData(prev => ({ ...prev, category: foundCategory }));
    }

    // ?íƒœ ì¶”ì¶œ
    if (text.includes('?ˆê²ƒ') || text.includes('???œí’ˆ')) {
      setProductData(prev => ({ ...prev, condition: '?ˆê²ƒ' }));
    } else if (text.includes('ì¤‘ê³ ') || text.includes('?¬ìš©')) {
      setProductData(prev => ({ ...prev, condition: 'ì¤‘ê³ ' }));
    }

    // ?œëª©?¼ë¡œ ?¬ìš© (ì²˜ìŒ 20??
    setProductData(prev => ({ 
      ...prev, 
      title: text.substring(0, 20),
      description: text 
    }));
  };

  // ?“· ?´ë?ì§€ ? íƒ
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

  // ?? AI ?í’ˆ ?±ë¡
  const handleAIUpload = async () => {
    if (!productData.title || !selectedImage) {
      alert('?œëª©ê³??´ë?ì§€ë¥?ëª¨ë‘ ?…ë ¥?´ì£¼?¸ìš”.');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. ?´ë?ì§€ ?…ë¡œ??      const imageRef = ref(storage, `products/${Date.now()}_${selectedImage.name}`);
      const uploadResult = await uploadBytes(imageRef, selectedImage);
      const imageUrl = await getDownloadURL(uploadResult.ref);

      // 2. Firestore???í’ˆ ?€??      const productDoc = {
        title: productData.title,
        description: productData.description,
        price: productData.price || 0,
        category: productData.category || 'ê¸°í?',
        condition: productData.condition || 'ì¤‘ê³ ',
        location: productData.location || '?„ì¹˜ ë¯¸ë“±ë¡?,
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

      alert('??AI ?í’ˆ ?±ë¡ ?„ë£Œ!');
      navigate('/market');
    } catch (error) {
      console.error('???…ë¡œ???¤íŒ¨:', error);
      alert('?…ë¡œ?œì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤. ?¤ì‹œ ?œë„?´ì£¼?¸ìš”.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* ?¤ë” */}
      <header className="bg-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                ?§  AI ?í’ˆ ?±ë¡
              </h1>
              <p className="text-sm text-gray-600">?Œì„±?¼ë¡œ ë§í•˜ê³??´ë?ì§€ë¥??…ë¡œ?œí•˜ë©??ë™?¼ë¡œ ?í’ˆ???±ë¡?©ë‹ˆ??/p>
            </div>
            <button
              onClick={() => navigate('/market')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ??ë§ˆì¼“?¼ë¡œ ?Œì•„ê°€ê¸?            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* ?Œì„± ?…ë ¥ ?¹ì…˜ */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Mic className="w-5 h-5 text-blue-600" />
            ?™ï¸??Œì„±?¼ë¡œ ?í’ˆ ?¤ëª…?˜ê¸°
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
              {isRecording ? '?¹ìŒ ì¤‘ì?' : '?Œì„± ?¹ìŒ ?œì‘'}
            </button>
            
            {isRecording && (
              <div className="flex items-center gap-2 text-red-500">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">?£ê³  ?ˆìŠµ?ˆë‹¤...</span>
              </div>
            )}
          </div>

          {transcript && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">?¯ ?¸ì‹???Œì„±:</h3>
              <p className="text-gray-800">{transcript}</p>
            </div>
          )}
        </div>

        {/* ?´ë?ì§€ ?…ë¡œ???¹ì…˜ */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-green-600" />
            ?“· ?í’ˆ ?´ë?ì§€ ?…ë¡œ??          </h2>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
            >
              <Upload className="w-5 h-5" />
              ?´ë?ì§€ ? íƒ
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
                ??{selectedImage.name} ? íƒ??              </span>
            )}
          </div>

          {imagePreview && (
            <div className="mt-4">
              <img
                src={imagePreview}
                alt="?í’ˆ ë¯¸ë¦¬ë³´ê¸°"
                className="w-64 h-48 object-cover rounded-lg border"
              />
            </div>
          )}
        </div>

        {/* AI ë¶„ì„ ê²°ê³¼ */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            ?§  AI ë¶„ì„ ê²°ê³¼
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">?œëª©</label>
              <input
                type="text"
                value={productData.title}
                onChange={(e) => setProductData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="?í’ˆ ?œëª©???…ë ¥?˜ì„¸??
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ê°€ê²?(??</label>
              <input
                type="number"
                value={productData.price || ''}
                onChange={(e) => setProductData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ê°€ê²©ì„ ?…ë ¥?˜ì„¸??
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ì¹´í…Œê³ ë¦¬</label>
              <select
                value={productData.category}
                onChange={(e) => setProductData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">ì¹´í…Œê³ ë¦¬ ? íƒ</option>
                <option value="ì¶•êµ¬">ì¶•êµ¬</option>
                <option value="?¼êµ¬">?¼êµ¬</option>
                <option value="?êµ¬">?êµ¬</option>
                <option value="ë°°êµ¬">ë°°êµ¬</option>
                <option value="ê³¨í”„">ê³¨í”„</option>
                <option value="?Œë‹ˆ??>?Œë‹ˆ??/option>
                <option value="?¬ë‹">?¬ë‹</option>
                <option value="?¬ìŠ¤">?¬ìŠ¤</option>
                <option value="?”ê?">?”ê?</option>
                <option value="ê¸°í?">ê¸°í?</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">?íƒœ</label>
              <select
                value={productData.condition}
                onChange={(e) => setProductData(prev => ({ ...prev, condition: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">?íƒœ ? íƒ</option>
                <option value="?ˆê²ƒ">?ˆê²ƒ</option>
                <option value="ì¤‘ê³ ">ì¤‘ê³ </option>
                <option value="ê±°ì˜ ?ˆê²ƒ">ê±°ì˜ ?ˆê²ƒ</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">?ì„¸ ?¤ëª…</label>
            <textarea
              value={productData.description}
              onChange={(e) => setProductData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="?í’ˆ???€???ì„¸???¤ëª…???…ë ¥?˜ì„¸??
            />
          </div>
        </div>

        {/* ?„ì¹˜ ?•ë³´ */}
        {currentLocation && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" />
              ?“ ?„ì¬ ?„ì¹˜
            </h2>
            <p className="text-sm text-gray-600">
              ?„ë„: {currentLocation.lat.toFixed(5)}, ê²½ë„: {currentLocation.lng.toFixed(5)}
            </p>
          </div>
        )}

        {/* ?±ë¡ ë²„íŠ¼ */}
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
                AI ?±ë¡ ì¤?..
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                ?? AI ?í’ˆ ?±ë¡?˜ê¸°
              </div>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
