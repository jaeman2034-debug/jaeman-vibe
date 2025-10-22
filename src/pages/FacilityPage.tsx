import { useNavigate } from "react-router-dom";

export default function FacilityPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-lg p-12 text-center">
        <div className="text-8xl mb-6">?Ÿï¸?/div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          ì²´ìœ¡?œì„¤ ?ˆì•½
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          ?´ë™??ë°?êµ¬ì¥ ?ˆì•½ ?œìŠ¤?œì„ ì¤€ë¹?ì¤‘ì…?ˆë‹¤.
        </p>
        <div className="space-y-3 text-sm text-gray-500 mb-8">
          <p>?“… ?œì„¤ ?ˆì•½ ìº˜ë¦°??/p>
          <p>?Ÿï¸??¤ì‹œê°??ˆì•½ ?„í™©</p>
          <p>?’³ ?¨ë¼??ê²°ì œ</p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
        >
          ?ˆìœ¼ë¡??Œì•„ê°€ê¸?        </button>
      </div>
    </div>
  );
}
