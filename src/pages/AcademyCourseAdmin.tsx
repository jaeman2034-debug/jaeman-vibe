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
        
        // ìµœì‹  ê°•ì¢Œë¶€???•ë ¬
        data.sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return bTime.getTime() - aTime.getTime();
        });
        
        setCourses(data);
      } catch (err) {
        console.error("ê°•ì¢Œ ëª©ë¡ ë¡œë”© ?¤ë¥˜:", err);
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
      
      // ? ì²­???œìœ¼ë¡??•ë ¬ (ìµœì‹ ??
      data.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return bTime.getTime() - aTime.getTime();
      });
      
      setEnrollments(data);
      setSelectedCourse(course);
    } catch (err) {
      console.error("? ì²­??ëª©ë¡ ë¡œë”© ?¤ë¥˜:", err);
      alert("? ì²­??ëª©ë¡??ë¶ˆëŸ¬?¤ëŠ” ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    } finally {
      setEnrollmentsLoading(false);
    }
  };

  const markPaid = async (enrollmentId: string, courseId: string) => {
    try {
      await updateDoc(doc(db, `academyCourses/${courseId}/enrollments/${enrollmentId}`), { 
        paid: true 
      });
      
      // ?Œë¦¼ ?¸ë¦¬ê±?ë¡œê·¸ (?¤ì œë¡œëŠ” Firebase Functions?ì„œ ì²˜ë¦¬)
      const enrollment = enrollments.find(e => e.id === enrollmentId);
      const course = selectedCourse;
      
      console.log(`?’Œ ?Œë¦¼ ?¸ë¦¬ê±? ${enrollment?.name}??ê²°ì œ ?„ë£Œ`);
      console.log(`?“§ ë°œì†¡ ?ˆì •: "${course?.title}" ê°•ì¢Œ ?˜ê°• ?•ì • ?ˆë‚´`);
      console.log(`?“± ?˜ì‹ ?? ${enrollment?.name} (${enrollment?.phone})`);
      
      setEnrollments(enrollments.map(e => 
        e.id === enrollmentId ? { ...e, paid: true } : e
      ));
      
      alert(`??ê²°ì œ ì²˜ë¦¬ ?„ë£Œ!\n?“§ ${enrollment?.name}?˜ê»˜ ?˜ê°• ?•ì • ?ˆë‚´ê°€ ë°œì†¡?©ë‹ˆ??`);
    } catch (err) {
      console.error("ê²°ì œ ì²˜ë¦¬ ?¤ë¥˜:", err);
      alert("??ê²°ì œ ì²˜ë¦¬ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <p className="text-center text-lg">?“š ê°•ì¢Œ ëª©ë¡ ë¡œë”© ì¤?..</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">?“ ?„ì¹´?°ë? ê°•ì¢Œ ê´€ë¦¬ì</h2>
        <Link 
          to="/academy/courses" 
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          ??ê°•ì¢Œ ëª©ë¡?¼ë¡œ
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ê°•ì¢Œ ëª©ë¡ */}
        <div className="lg:col-span-1">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">?“š ê°•ì¢Œ ëª©ë¡</h3>
          <div className="space-y-2">
            {courses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">?±ë¡??ê°•ì¢Œê°€ ?†ìŠµ?ˆë‹¤.</p>
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
                    ?‘¨?ğŸ?{course.coach} | ?‘¥ {course.capacity}ëª?                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ?“… {new Date(course.startDate).toLocaleDateString()} ~ {new Date(course.endDate).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ? ì²­??ëª©ë¡ */}
        <div className="lg:col-span-2">
          {!selectedCourse ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">?‘¥</div>
              <p className="text-xl mb-2">ê°•ì¢Œë¥?? íƒ?´ì£¼?¸ìš”</p>
              <p className="text-sm">? ì²­??ëª…ë‹¨???•ì¸?˜ë ¤ë©?ê°•ì¢Œë¥??´ë¦­?˜ì„¸??/p>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  ?‘¥ "{selectedCourse.title}" ? ì²­??ëª…ë‹¨
                </h3>
                <div className="text-sm text-gray-600">
                  ì´?{enrollments.length}ëª?? ì²­
                </div>
              </div>

              {enrollmentsLoading ? (
                <p className="text-center py-8">? ì²­??ëª©ë¡ ë¡œë”© ì¤?..</p>
              ) : enrollments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">?“</div>
                  <p>?„ì§ ? ì²­?ê? ?†ìŠµ?ˆë‹¤.</p>
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
                            ?“ {enrollment.phone}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            ?“… ? ì²­?? {enrollment.createdAt?.toDate ? 
                              enrollment.createdAt.toDate().toLocaleString() : 
                              new Date(enrollment.createdAt).toLocaleString()
                            }
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          {enrollment.paid ? (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                              ??ê²°ì œ ?„ë£Œ
                            </span>
                          ) : (
                            <button
                              onClick={() => markPaid(enrollment.id, selectedCourse.id)}
                              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                            >
                              ê²°ì œ ì²˜ë¦¬
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ?µê³„ ?•ë³´ */}
              {enrollments.length > 0 && (
                <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {enrollments.filter(e => e.paid).length}
                      </div>
                      <div className="text-sm text-gray-600">ê²°ì œ ?„ë£Œ</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {enrollments.filter(e => !e.paid).length}
                      </div>
                      <div className="text-sm text-gray-600">ê²°ì œ ?€ê¸?/div>
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
