import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
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
};

type Enrollment = {
  id: string;
  name: string;
  phone: string;
  paid: boolean;
  createdAt: any;
};

export default function AcademyCourseAdmin() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);

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

  const loadEnrollments = async (course: Course) => {
    setEnrollmentsLoading(true);
    try {
      const snapshot = await getDocs(collection(db, `academyCourses/${course.id}/enrollments`));
      const data = snapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      } as Enrollment));
      
      // ?�청???�으�??�렬 (최신??
      data.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return bTime.getTime() - aTime.getTime();
      });
      
      setEnrollments(data);
      setSelectedCourse(course);
    } catch (err) {
      console.error("?�청??목록 로딩 ?�류:", err);
      alert("?�청??목록??불러?�는 �??�류가 발생?�습?�다.");
    } finally {
      setEnrollmentsLoading(false);
    }
  };

  const markPaid = async (enrollmentId: string, courseId: string) => {
    try {
      await updateDoc(doc(db, `academyCourses/${courseId}/enrollments/${enrollmentId}`), { 
        paid: true 
      });
      
      // ?�림 ?�리�?로그 (?�제로는 Firebase Functions?�서 처리)
      const enrollment = enrollments.find(e => e.id === enrollmentId);
      const course = selectedCourse;
      
      console.log(`?�� ?�림 ?�리�? ${enrollment?.name}??결제 ?�료`);
      console.log(`?�� 발송 ?�정: "${course?.title}" 강좌 ?�강 ?�정 ?�내`);
      console.log(`?�� ?�신?? ${enrollment?.name} (${enrollment?.phone})`);
      
      setEnrollments(enrollments.map(e => 
        e.id === enrollmentId ? { ...e, paid: true } : e
      ));
      
      alert(`??결제 처리 ?�료!\n?�� ${enrollment?.name}?�께 ?�강 ?�정 ?�내가 발송?�니??`);
    } catch (err) {
      console.error("결제 처리 ?�류:", err);
      alert("??결제 처리 �??�류가 발생?�습?�다.");
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
        <h2 className="text-3xl font-bold text-gray-800">?�� ?�카?��? 강좌 관리자</h2>
        <Link 
          to="/academy/courses" 
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          ??강좌 목록?�로
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 강좌 목록 */}
        <div className="lg:col-span-1">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">?�� 강좌 목록</h3>
          <div className="space-y-2">
            {courses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">?�록??강좌가 ?�습?�다.</p>
            ) : (
              courses.map(course => (
                <button
                  key={course.id}
                  onClick={() => loadEnrollments(course)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedCourse?.id === course.id
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{course.title}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    ?��?��?{course.coach} | ?�� {course.capacity}�?                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ?�� {new Date(course.startDate).toLocaleDateString()} ~ {new Date(course.endDate).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ?�청??목록 */}
        <div className="lg:col-span-2">
          {!selectedCourse ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">?��</div>
              <p className="text-xl mb-2">강좌�??�택?�주?�요</p>
              <p className="text-sm">?�청??명단???�인?�려�?강좌�??�릭?�세??/p>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  ?�� "{selectedCourse.title}" ?�청??명단
                </h3>
                <div className="text-sm text-gray-600">
                  �?{enrollments.length}�??�청
                </div>
              </div>

              {enrollmentsLoading ? (
                <p className="text-center py-8">?�청??목록 로딩 �?..</p>
              ) : enrollments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">?��</div>
                  <p>?�직 ?�청?��? ?�습?�다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrollments.map(enrollment => (
                    <div 
                      key={enrollment.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{enrollment.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            ?�� {enrollment.phone}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            ?�� ?�청?? {enrollment.createdAt?.toDate ? 
                              enrollment.createdAt.toDate().toLocaleString() : 
                              new Date(enrollment.createdAt).toLocaleString()
                            }
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          {enrollment.paid ? (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                              ??결제 ?�료
                            </span>
                          ) : (
                            <button
                              onClick={() => markPaid(enrollment.id, selectedCourse.id)}
                              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                            >
                              결제 처리
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ?�계 ?�보 */}
              {enrollments.length > 0 && (
                <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {enrollments.filter(e => e.paid).length}
                      </div>
                      <div className="text-sm text-gray-600">결제 ?�료</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {enrollments.filter(e => !e.paid).length}
                      </div>
                      <div className="text-sm text-gray-600">결제 ?��?/div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
