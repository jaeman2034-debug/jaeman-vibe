import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

interface MarketUpload {
  filename: string;
  fileUrl: string;
  filePath: string;
  contentType?: string;
  size?: number;
  uploadedAt?: string;
  caption?: string;  // ?ˆê±°???¸í™˜??  caption_en?: string;  // ?ì–´ ìº¡ì…˜
  caption_ko?: string;  // ?œêµ­??ìº¡ì…˜
  aiCategory?: string;
  aiBrand?: string;
  aiCondition?: string;
  aiTags?: string[];
  aiSuggestedPrice?: number;
  analyzedAt?: string;
}

interface Props {
  filename: string;
  imageUrl?: string;
}

export default function MarketItemAIAnalysis({ filename, imageUrl }: Props) {
  const [data, setData] = useState<MarketUpload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filename) {
      setLoading(false);
      return;
    }

    console.log("?” AI ë¶„ì„ ê²°ê³¼ êµ¬ë… ?œì‘:", filename);

    try {
      // Firestore onSnapshot?¼ë¡œ ?¤ì‹œê°?êµ¬ë…
      const docRef = doc(db, "market-uploads", filename);
      const unsub = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const uploadData = snap.data() as MarketUpload;
            console.log("??AI ë¶„ì„ ?°ì´???˜ì‹ :", uploadData);
            setData(uploadData);
          } else {
            console.warn("? ï¸ market-uploads ë¬¸ì„œ ?†ìŒ, ai-analysis-results ?•ì¸");
            // ai-analysis-results ì»¬ë ‰?˜ë„ ?•ì¸
            const analysisRef = doc(db, "ai-analysis-results", filename.replace(/[^a-zA-Z0-9_-]/g, '_'));
            const analysisSub = onSnapshot(analysisRef, (analysisSnap) => {
              if (analysisSnap.exists()) {
                console.log("??ai-analysis-results?ì„œ ë°œê²¬:", analysisSnap.data());
                setData(analysisSnap.data() as MarketUpload);
              }
            });
            return () => analysisSub();
          }
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error("??Firestore onSnapshot ?¤ë¥˜:", err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => {
        console.log("?”Œ AI ë¶„ì„ ê²°ê³¼ êµ¬ë… ?´ì œ");
        unsub();
      };
    } catch (err: any) {
      console.error("??êµ¬ë… ?¤ì • ?¤ë¥˜:", err);
      setError(err.message);
      setLoading(false);
    }
  }, [filename]);

  // ë¡œë”© ?íƒœ
  if (loading) {
    return (
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-blue-800 font-medium">?” AI ë¶„ì„ ?°ì´???•ì¸ ì¤?..</p>
        </div>
      </div>
    );
  }

  // ?ëŸ¬ ?íƒœ
  if (error) {
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 font-medium">??AI ë¶„ì„ ?°ì´??ë¡œë“œ ?¤íŒ¨</p>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  // AI ë¶„ì„ ?€ê¸?ì¤?  if (!data || (!data.caption && !data.caption_ko && !data.caption_en && !data.aiCategory)) {
    return (
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-yellow-800 font-medium">??AI ë¶„ì„ ì§„í–‰ ì¤?..</p>
        </div>
        <p className="text-sm text-yellow-700 mt-2">
          ?´ë?ì§€ê°€ ?…ë¡œ?œë˜?ˆìŠµ?ˆë‹¤. AIê°€ ?ë™?¼ë¡œ ë¶„ì„ ì¤‘ì´ë©?ê³?ê²°ê³¼ê°€ ?œì‹œ?©ë‹ˆ??
        </p>
        <p className="text-xs text-yellow-600 mt-1">
          ?’¬ ?ì–´ ë¶„ì„ ???œêµ­??ë²ˆì—­ ?œì„œë¡?ì§„í–‰?©ë‹ˆ??
        </p>
      </div>
    );
  }

  // AI ë¶„ì„ ?„ë£Œ
  return (
    <div className="mt-4 space-y-4">
      {/* ?´ë?ì§€ ë¯¸ë¦¬ë³´ê¸° */}
      {(data.fileUrl || imageUrl) && (
        <div className="w-full">
          <img
            src={data.fileUrl || imageUrl}
            alt={data.filename}
            className="w-full max-w-md rounded-xl shadow-lg mx-auto"
            loading="lazy"
          />
        </div>
      )}

      {/* AI ë¶„ì„ ê²°ê³¼ */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start gap-2 mb-3">
          <span className="text-2xl">?¤–</span>
          <div className="flex-1">
            <p className="text-green-900 font-bold text-lg">AI ë¶„ì„ ?„ë£Œ!</p>
            {data.analyzedAt && (
              <p className="text-sm text-green-700">
                ë¶„ì„ ?œê°„: {new Date(data.analyzedAt).toLocaleString('ko-KR')}
              </p>
            )}
          </div>
        </div>

        {/* ?¤êµ­??ìº¡ì…˜ */}
        <div className="space-y-3 mb-3">
          {/* ?œêµ­??ìº¡ì…˜ */}
          {data.caption_ko ? (
            <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">?‡°?‡·</span>
                <p className="text-sm text-green-700 font-bold">AI ë¶„ì„ ê²°ê³¼ (?œêµ­??</p>
              </div>
              <p className="text-gray-900 font-medium leading-relaxed">{data.caption_ko}</p>
            </div>
          ) : data.caption_en ? (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-yellow-700 font-medium">?‡°?‡· ?œêµ­??ë²ˆì—­ ì¤?..</p>
              </div>
            </div>
          ) : null}

          {/* ?ì–´ ìº¡ì…˜ */}
          {data.caption_en ? (
            <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">?Œ</span>
                <p className="text-sm text-blue-700 font-bold">AI Analysis (English)</p>
              </div>
              <p className="text-gray-800 leading-relaxed">{data.caption_en}</p>
            </div>
          ) : null}

          {/* ?ˆê±°??ìº¡ì…˜ (?¸í™˜?? */}
          {!data.caption_ko && !data.caption_en && data.caption && (
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 font-medium mb-1">?“ ?¤ëª…</p>
              <p className="text-gray-800">{data.caption}</p>
            </div>
          )}
        </div>

        {/* ?ì„¸ ë¶„ì„ ê²°ê³¼ ê·¸ë¦¬??*/}
        <div className="grid grid-cols-2 gap-3">
          {/* ì¹´í…Œê³ ë¦¬ */}
          {data.aiCategory && (
            <div className="p-3 bg-white rounded-lg border border-green-100">
              <p className="text-xs text-gray-500 font-medium mb-1">?·ï¸?ì¹´í…Œê³ ë¦¬</p>
              <p className="text-gray-900 font-semibold">{data.aiCategory}</p>
            </div>
          )}

          {/* ë¸Œëœ??*/}
          {data.aiBrand && (
            <div className="p-3 bg-white rounded-lg border border-green-100">
              <p className="text-xs text-gray-500 font-medium mb-1">?‘” ë¸Œëœ??/p>
              <p className="text-gray-900 font-semibold">{data.aiBrand}</p>
            </div>
          )}

          {/* ?íƒœ */}
          {data.aiCondition && (
            <div className="p-3 bg-white rounded-lg border border-green-100">
              <p className="text-xs text-gray-500 font-medium mb-1">???íƒœ</p>
              <p className="text-gray-900 font-semibold">{data.aiCondition}</p>
            </div>
          )}

          {/* ì¶”ì²œ ê°€ê²?*/}
          {data.aiSuggestedPrice && data.aiSuggestedPrice > 0 && (
            <div className="p-3 bg-white rounded-lg border border-green-100">
              <p className="text-xs text-gray-500 font-medium mb-1">?’° ì¶”ì²œ ê°€ê²?/p>
              <p className="text-gray-900 font-semibold">
                ??data.aiSuggestedPrice.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* ?œê·¸ */}
        {data.aiTags && data.aiTags.length > 0 && (
          <div className="mt-3 p-3 bg-white rounded-lg border border-green-100">
            <p className="text-xs text-gray-500 font-medium mb-2">?·ï¸?AI ?œê·¸</p>
            <div className="flex flex-wrap gap-2">
              {data.aiTags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ?Œì¼ ?•ë³´ */}
        <div className="mt-3 pt-3 border-t border-green-200">
          <div className="flex items-center justify-between text-xs text-green-700">
            <span>?“ {data.filename}</span>
            {data.size && (
              <span>?’¾ {(data.size / 1024).toFixed(1)}KB</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

