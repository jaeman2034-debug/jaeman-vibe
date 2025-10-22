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

  const handleEnroll = async (courseId: string, courseTitle: string) => {
    const name = prompt("?´ë¦„???…ë ¥?˜ì„¸??");
    if (!name?.trim()) return;

    const phone = prompt("?„í™”ë²ˆí˜¸ë¥??…ë ¥?˜ì„¸??");
    if (!phone?.trim()) return;

    setEnrolling(courseId);
    try {
      await addDoc(collection(db, `academyCourses/${courseId}/enrollments`), {
        name: name.trim(),
        phone: phone.trim(),
        paid: false,
        createdAt: new Date(),
      });

      // ?Œë¦¼ ?¸ë¦¬ê±?ë¡œê·¸ (?¤ì œë¡œëŠ” Firebase Functions?ì„œ ì²˜ë¦¬)
      console.log(`?“¢ ?Œë¦¼ ?¸ë¦¬ê±? ${name}???˜ê°• ? ì²­ ?„ë£Œ`);
      console.log(`?“§ ë°œì†¡ ?ˆì •: "${courseTitle}" ê°•ì¢Œ ? ì²­ ?‘ìˆ˜ ?ˆë‚´`);
      console.log(`?“± ?˜ì‹ ?? ${name} (${phone})`);
      
      alert(`??"${courseTitle}" ?˜ê°• ? ì²­???„ë£Œ?˜ì—ˆ?µë‹ˆ??\n?“§ ? ì²­ ?‘ìˆ˜ ?ˆë‚´ê°€ ë°œì†¡?©ë‹ˆ??`);
    } catch (err) {
      console.error("?˜ê°• ? ì²­ ?¤ë¥˜:", err);
      alert("???˜ê°• ? ì²­ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    } finally {
      setEnrolling(null);
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
        <h2 className="text-3xl font-bold text-gray-800">?“š ?„ì¹´?°ë? ê°•ì¢Œ</h2>
        <div className="flex gap-3">
          <Link 
            to="/academy/courses/new" 
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            ????ê°•ì¢Œ ?±ë¡
          </Link>
          <Link 
            to="/academy/courses/admin" 
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            ?“ ê´€ë¦¬ì
          </Link>
          <Link 
            to="/academy-simple" 
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            ???„ì¹´?°ë?ë¡?          </Link>
        </div>
      </div>

      {/* ê°•ì¢Œ ?µê³„ */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{courses.length}</div>
            <div className="text-sm text-gray-600">?„ì²´ ê°•ì¢Œ</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {courses.filter(course => new Date(course.endDate) > new Date()).length}
            </div>
            <div className="text-sm text-gray-600">ì§„í–‰ ì¤?/div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {courses.reduce((sum, course) => sum + course.capacity, 0)}
            </div>
            <div className="text-sm text-gray-600">ì´??•ì›</div>
          </div>
        </div>
      </div>

      {/* ê°•ì¢Œ ëª©ë¡ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">?“š</div>
            <p className="text-xl mb-2">?±ë¡??ê°•ì¢Œê°€ ?†ìŠµ?ˆë‹¤</p>
            <p className="text-sm">??ê°•ì¢Œë¥??±ë¡?´ë³´?¸ìš”!</p>
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
                    {isActive ? 'ì§„í–‰ ì¤? : 'ì¢…ë£Œ'}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {course.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-blue-600">?‘¨?ğŸ?/span>
                    <span className="font-medium">{course.coach}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600">?“…</span>
                    <span>{startDate} ~ {endDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-purple-600">?‘¥</span>
                    <span>?•ì›: {course.capacity}ëª?/span>
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
                    {enrolling === course.id ? '? ì²­ ì¤?..' : isActive ? '?˜ê°• ? ì²­' : '? ì²­ ë§ˆê°'}
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    ?ì„¸ë³´ê¸°
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
