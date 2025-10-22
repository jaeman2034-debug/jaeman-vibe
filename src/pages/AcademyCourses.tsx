import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

const db = getFirestore(app);

type Course = {
  id: string;
  title: string;
  description: string;
  coach: string;
  startDate: string;
  endDate: string;
  capacity: number;
  createdAt: any;
};

export default function AcademyCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const snapshot = await getDocs(collection(db, "academyCourses"));
        const data = snapshot.docs.map(d => ({ 
          id: d.id, 
          ...d.data() 
        } as Course));
        
        // 최신 강좌부???�렬
        data.sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return bTime.getTime() - aTime.getTime();
        });
        
        setCourses(data);
      } catch (err) {
        console.error("강좌 목록 로딩 ?�류:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const handleEnroll = async (courseId: string, courseTitle: string) => {
    const name = prompt("?�름???�력?�세??");
    if (!name?.trim()) return;

    const phone = prompt("?�화번호�??�력?�세??");
    if (!phone?.trim()) return;

    setEnrolling(courseId);
    try {
      await addDoc(collection(db, `academyCourses/${courseId}/enrollments`), {
        name: name.trim(),
        phone: phone.trim(),
        paid: false,
        createdAt: new Date(),
      });

      // ?�림 ?�리�?로그 (?�제로는 Firebase Functions?�서 처리)
      console.log(`?�� ?�림 ?�리�? ${name}???�강 ?�청 ?�료`);
      console.log(`?�� 발송 ?�정: "${courseTitle}" 강좌 ?�청 ?�수 ?�내`);
      console.log(`?�� ?�신?? ${name} (${phone})`);
      
      alert(`??"${courseTitle}" ?�강 ?�청???�료?�었?�니??\n?�� ?�청 ?�수 ?�내가 발송?�니??`);
    } catch (err) {
      console.error("?�강 ?�청 ?�류:", err);
      alert("???�강 ?�청 �??�류가 발생?�습?�다.");
    } finally {
      setEnrolling(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <p className="text-center text-lg">?�� 강좌 목록 로딩 �?..</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">?�� ?�카?��? 강좌</h2>
        <div className="flex gap-3">
          <Link 
            to="/academy/courses/new" 
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            ????강좌 ?�록
          </Link>
          <Link 
            to="/academy/courses/admin" 
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            ?�� 관리자
          </Link>
          <Link 
            to="/academy-simple" 
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            ???�카?��?�?          </Link>
        </div>
      </div>

      {/* 강좌 ?�계 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{courses.length}</div>
            <div className="text-sm text-gray-600">?�체 강좌</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {courses.filter(course => new Date(course.endDate) > new Date()).length}
            </div>
            <div className="text-sm text-gray-600">진행 �?/div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {courses.reduce((sum, course) => sum + course.capacity, 0)}
            </div>
            <div className="text-sm text-gray-600">�??�원</div>
          </div>
        </div>
      </div>

      {/* 강좌 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">?��</div>
            <p className="text-xl mb-2">?�록??강좌가 ?�습?�다</p>
            <p className="text-sm">??강좌�??�록?�보?�요!</p>
          </div>
        ) : (
          courses.map((course) => {
            const isActive = new Date(course.endDate) > new Date();
            const startDate = new Date(course.startDate).toLocaleDateString();
            const endDate = new Date(course.endDate).toLocaleDateString();
            
            return (
              <div 
                key={course.id} 
                className={`border rounded-lg p-6 shadow-sm transition-all hover:shadow-md ${
                  isActive ? 'bg-white border-green-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-800 line-clamp-2">
                    {course.title}
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isActive ? '진행 �? : '종료'}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {course.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-blue-600">?��?��?/span>
                    <span className="font-medium">{course.coach}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600">?��</span>
                    <span>{startDate} ~ {endDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-purple-600">?��</span>
                    <span>?�원: {course.capacity}�?/span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEnroll(course.id, course.title)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isActive && enrolling !== course.id
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!isActive || enrolling === course.id}
                  >
                    {enrolling === course.id ? '?�청 �?..' : isActive ? '?�강 ?�청' : '?�청 마감'}
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    ?�세보기
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
