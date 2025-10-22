import { useParams } from "react-router-dom";

export default function AcademyDashboard() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🏫 아카데미 대시보드
          </h1>
          <p className="text-gray-600 mb-6">
            아카데미 ID: {id}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                강좌 관리
              </h3>
              <p className="text-blue-600 text-sm">
                아카데미 강좌를 관리합니다.
              </p>
              <span className="text-green-600 text-xs">✅ 구현됨</span>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                공지사항
              </h3>
              <p className="text-yellow-600 text-sm">
                아카데미 공지사항을 관리합니다.
              </p>
              <span className="text-red-600 text-xs">❌ 미구현</span>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                갤러리
              </h3>
              <p className="text-green-600 text-sm">
                아카데미 갤러리를 관리합니다.
              </p>
              <span className="text-red-600 text-xs">❌ 미구현</span>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-800 mb-2">
                출석 관리
              </h3>
              <p className="text-purple-600 text-sm">
                학생 출석을 관리합니다.
              </p>
              <span className="text-red-600 text-xs">❌ 미구현</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
