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
  caption?: string;  // ?�거???�환??  caption_en?: string;  // ?�어 캡션
  caption_ko?: string;  // ?�국??캡션
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

    console.log("?�� AI 분석 결과 구독 ?�작:", filename);

    try {
      // Firestore onSnapshot?�로 ?�시�?구독
      const docRef = doc(db, "market-uploads", filename);
      const unsub = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const uploadData = snap.data() as MarketUpload;
            console.log("??AI 분석 ?�이???�신:", uploadData);
            setData(uploadData);
          } else {
            console.warn("?�️ market-uploads 문서 ?�음, ai-analysis-results ?�인");
            // ai-analysis-results 컬렉?�도 ?�인
            const analysisRef = doc(db, "ai-analysis-results", filename.replace(/[^a-zA-Z0-9_-]/g, '_'));
            const analysisSub = onSnapshot(analysisRef, (analysisSnap) => {
              if (analysisSnap.exists()) {
                console.log("??ai-analysis-results?�서 발견:", analysisSnap.data());
                setData(analysisSnap.data() as MarketUpload);
              }
            });
            return () => analysisSub();
          }
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error("??Firestore onSnapshot ?�류:", err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => {
        console.log("?�� AI 분석 결과 구독 ?�제");
        unsub();
      };
    } catch (err: any) {
      console.error("??구독 ?�정 ?�류:", err);
      setError(err.message);
      setLoading(false);
    }
  }, [filename]);

  // 로딩 ?�태
  if (loading) {
    return (
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-blue-800 font-medium">?�� AI 분석 ?�이???�인 �?..</p>
        </div>
      </div>
    );
  }

  // ?�러 ?�태
  if (error) {
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 font-medium">??AI 분석 ?�이??로드 ?�패</p>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  // AI 분석 ?��?�?  if (!data || (!data.caption && !data.caption_ko && !data.caption_en && !data.aiCategory)) {
    return (
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-yellow-800 font-medium">??AI 분석 진행 �?..</p>
        </div>
        <p className="text-sm text-yellow-700 mt-2">
          ?��?지가 ?�로?�되?�습?�다. AI가 ?�동?�로 분석 중이�?�?결과가 ?�시?�니??
        </p>
        <p className="text-xs text-yellow-600 mt-1">
          ?�� ?�어 분석 ???�국??번역 ?�서�?진행?�니??
        </p>
      </div>
    );
  }

  // AI 분석 ?�료
  return (
    <div className="mt-4 space-y-4">
      {/* ?��?지 미리보기 */}
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

      {/* AI 분석 결과 */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start gap-2 mb-3">
          <span className="text-2xl">?��</span>
          <div className="flex-1">
            <p className="text-green-900 font-bold text-lg">AI 분석 ?�료!</p>
            {data.analyzedAt && (
              <p className="text-sm text-green-700">
                분석 ?�간: {new Date(data.analyzedAt).toLocaleString('ko-KR')}
              </p>
            )}
          </div>
        </div>

        {/* ?�국??캡션 */}
        <div className="space-y-3 mb-3">
          {/* ?�국??캡션 */}
          {data.caption_ko ? (
            <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">?��?��</span>
                <p className="text-sm text-green-700 font-bold">AI 분석 결과 (?�국??</p>
              </div>
              <p className="text-gray-900 font-medium leading-relaxed">{data.caption_ko}</p>
            </div>
          ) : data.caption_en ? (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-yellow-700 font-medium">?��?�� ?�국??번역 �?..</p>
              </div>
            </div>
          ) : null}

          {/* ?�어 캡션 */}
          {data.caption_en ? (
            <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">?��</span>
                <p className="text-sm text-blue-700 font-bold">AI Analysis (English)</p>
              </div>
              <p className="text-gray-800 leading-relaxed">{data.caption_en}</p>
            </div>
          ) : null}

          {/* ?�거??캡션 (?�환?? */}
          {!data.caption_ko && !data.caption_en && data.caption && (
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 font-medium mb-1">?�� ?�명</p>
              <p className="text-gray-800">{data.caption}</p>
            </div>
          )}
        </div>

        {/* ?�세 분석 결과 그리??*/}
        <div className="grid grid-cols-2 gap-3">
          {/* 카테고리 */}
          {data.aiCategory && (
            <div className="p-3 bg-white rounded-lg border border-green-100">
              <p className="text-xs text-gray-500 font-medium mb-1">?���?카테고리</p>
              <p className="text-gray-900 font-semibold">{data.aiCategory}</p>
            </div>
          )}

          {/* 브랜??*/}
          {data.aiBrand && (
            <div className="p-3 bg-white rounded-lg border border-green-100">
              <p className="text-xs text-gray-500 font-medium mb-1">?�� 브랜??/p>
              <p className="text-gray-900 font-semibold">{data.aiBrand}</p>
            </div>
          )}

          {/* ?�태 */}
          {data.aiCondition && (
            <div className="p-3 bg-white rounded-lg border border-green-100">
              <p className="text-xs text-gray-500 font-medium mb-1">???�태</p>
              <p className="text-gray-900 font-semibold">{data.aiCondition}</p>
            </div>
          )}

          {/* 추천 가�?*/}
          {data.aiSuggestedPrice && data.aiSuggestedPrice > 0 && (
            <div className="p-3 bg-white rounded-lg border border-green-100">
              <p className="text-xs text-gray-500 font-medium mb-1">?�� 추천 가�?/p>
              <p className="text-gray-900 font-semibold">
                ??data.aiSuggestedPrice.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* ?�그 */}
        {data.aiTags && data.aiTags.length > 0 && (
          <div className="mt-3 p-3 bg-white rounded-lg border border-green-100">
            <p className="text-xs text-gray-500 font-medium mb-2">?���?AI ?�그</p>
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

        {/* ?�일 ?�보 */}
        <div className="mt-3 pt-3 border-t border-green-200">
          <div className="flex items-center justify-between text-xs text-green-700">
            <span>?�� {data.filename}</span>
            {data.size && (
              <span>?�� {(data.size / 1024).toFixed(1)}KB</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

