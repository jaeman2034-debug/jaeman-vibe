import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  date: string;
  price: number;
  capacity: number;
  thumbnailUrl?: string;
  createdAt: any;
  // 추�? ?�드??  location?: string;
  schedule?: string;
  fee?: string;
  items?: string;
  target?: string;
  curriculum?: string[];
  contact?: string;
}

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return;
      
      try {
        console.log("강좌 ID:", courseId);
        console.log("Firestore 경로:", `academy/courses/list/${courseId}`);
        
        const courseDoc = await getDoc(doc(db, "academy", "courses", "list", courseId));
        console.log("문서 존재 ?��?:", courseDoc.exists());
        
        if (courseDoc.exists()) {
          const courseData = { id: courseDoc.id, ...courseDoc.data() } as Course;
          console.log("강좌 ?�이??", courseData);
          setCourse(courseData);
        } else {
          console.log("강좌�?찾을 ???�습?�다.");
          alert("강좌�?찾을 ???�습?�다.");
        }
      } catch (error) {
        console.error("강좌 조회 ?�류:", error);
        alert("강좌 ?�보�?불러?�는???�패?�습?�다.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-600 mb-4">강좌�?찾을 ???�습?�다</h1>
        <Link
          to="/academy/courses"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          강좌 목록?�로 ?�아가�?        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* ?�로가�?버튼 */}
      <div>
        <Link
          to="/academy/courses"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          강좌 목록?�로 ?�아가�?        </Link>
      </div>

      {/* 강좌 ?�네??*/}
      <div>
        <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl overflow-hidden shadow-lg">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* 강좌 ?�보 */}
      <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">{course.title}</h1>
        
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed text-lg">
            {course.description || "?�세 ?�명???�공?��? ?�았?�니??"}
          </p>
        </div>

        {/* 강좌 ?�세 ?�보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
              <span className="text-xl mr-3">?��?��?/span>
              강사
            </h3>
            <p className="text-gray-700">{course.instructor}</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
              <span className="text-xl mr-3">?��</span>
              기간
            </h3>
            <p className="text-gray-700">{course.date}</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
              <span className="text-xl mr-3">?��</span>
              ?�간
            </h3>
            <p className="text-gray-700">{course.schedule || "매주 ?�요???�전 10??~ 12??}</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
              <span className="text-xl mr-3">?��</span>
              ?�소
            </h3>
            <p className="text-gray-700">{course.location || "?�흘 체육공원 A구장"}</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
              <span className="text-xl mr-3">?��</span>
              ?�강�?            </h3>
            <p className="text-gray-700">{course.fee || (course.price === 0 ? "무료" : `${course.price.toLocaleString()}??)}</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
              <span className="text-xl mr-3">?��</span>
              준비물
            </h3>
            <p className="text-gray-700">{course.items || "?�동?? 개인 물병"}</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
              <span className="text-xl mr-3">?��</span>
              ?�??            </h3>
            <p className="text-gray-700">{course.target || "초등?�생 ?�?�년 (7~10??"}</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
              <span className="text-xl mr-3">?��</span>
              ?�원
            </h3>
            <p className="text-gray-700">{course.capacity}�?/p>
          </div>
        </div>

        {/* 커리?�럼 ?�션 */}
        {course.curriculum && course.curriculum.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <span className="text-xl mr-3">?��</span>
              커리?�럼
            </h3>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              {course.curriculum.map((step: string, i: number) => (
                <li key={i} className="leading-relaxed">{step}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 문의 ?�션 */}
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
            <span className="text-xl mr-3">?�️</span>
            문의
          </h3>
          <p className="text-gray-700">{course.contact || "010-1234-5678"}</p>
        </div>

        {/* ?�청 버튼 */}
        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <button className="flex-1 bg-blue-600 text-white py-4 rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-lg">
            강좌 ?�청?�기
          </button>
          <button className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl hover:bg-gray-200 transition-colors font-semibold border-2 border-gray-200">
            공유?�기
          </button>
        </div>
      </div>
    </div>
  );
}
