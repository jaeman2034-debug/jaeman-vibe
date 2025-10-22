import { useParams } from "react-router-dom";

export default function StudentDetailPage() {
  const { id, studentId } = useParams<{ id: string; studentId: string }>();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            👨‍🎓 학생 상세
          </h1>
          <p className="text-gray-600 mb-6">
            아카데미 ID: {id} - 학생 ID: {studentId}
          </p>
          
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👨‍🎓</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">학생 상세 기능 준비 중</h3>
            <p className="text-gray-500">곧 학생 상세 정보 및 관리 기능을 제공할 예정입니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
