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
  media: string[];
  createdAt: any;
}

export default function AcademyDetail() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;
      
      try {
        const courseDoc = await getDoc(doc(db, "academies", id));
        if (courseDoc.exists()) {
          setCourse({ id: courseDoc.id, ...courseDoc.data() } as Course);
        } else {
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
  }, [id]);

  const handleEnroll = () => {
    alert("강좌 ?�청 기능?� 추후 구현???�정?�니??");
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="aspect-video bg-gray-200 rounded-lg mb-6"></div>
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-12 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-600 mb-4">강좌�?찾을 ???�습?�다</h1>
        <Link
          to="/academy"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          강좌 목록?�로 ?�아가�?        </Link>
      </div>
    );
  }

  const allImages = course.thumbnailUrl ? [course.thumbnailUrl, ...course.media] : course.media;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* ?�로가�?버튼 */}
      <div className="mb-6">
        <Link
          to="/academy"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          강좌 목록?�로 ?�아가�?        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 메인 ?�용 */}
        <div className="lg:col-span-2">
          {/* ?�네???��?지 */}
          <div className="mb-8">
            <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
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
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{course.title}</h1>
            
            <div className="prose max-w-none mb-8">
              <p className="text-gray-700 leading-relaxed text-lg">
                {course.description || "?�세 ?�명???�공?��? ?�았?�니??"}
              </p>
            </div>

            {/* 추�? ?�보 ?�션 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold mb-6">강좌 ?�보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <span className="font-medium text-gray-700">강사</span>
                    <p className="text-gray-900">{course.instructor}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <span className="font-medium text-gray-700">?�정</span>
                    <p className="text-gray-900">{course.date}</p>
                  </div>
                </div>
                
                {course.capacity > 0 && (
                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div>
                      <span className="font-medium text-gray-700">?�원</span>
                      <p className="text-gray-900">{course.capacity}�?/p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ?��?지/?�영??갤러�?*/}
          {allImages.length > 1 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">추�? ?��?지</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {allImages.map((imageUrl, index) => (
                  <div
                    key={index}
                    className={`aspect-video rounded-lg overflow-hidden cursor-pointer border-2 ${
                      currentImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img
                      src={imageUrl}
                      alt={`강좌 ?��?지 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ?�이?�바 */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-6">
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {course.price === 0 ? "무료" : `${course.price.toLocaleString()}??}
              </div>
              <div className="text-sm text-gray-500">
                {course.price > 0 ? "?�강�? : "무료 강좌"}
              </div>
            </div>

            {/* ?�청 버튼 */}
            <button 
              onClick={handleEnroll}
              className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg mb-6"
            >
              강좌 ?�청?�기
            </button>

            {/* 강좌 ?�보 ?�약 */}
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">강사</span>
                <span className="font-medium">{course.instructor}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">?�정</span>
                <span className="font-medium">{course.date}</span>
              </div>
              {course.capacity > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">?�원</span>
                  <span className="font-medium">{course.capacity}�?/span>
                </div>
              )}
            </div>

            {/* 공유 버튼 */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-3">강좌 공유?�기</div>
              <div className="flex space-x-2">
                <button className="flex-1 bg-yellow-400 text-white py-2 rounded text-sm hover:bg-yellow-500 transition-colors">
                  카카?�톡
                </button>
                <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded text-sm hover:bg-gray-200 transition-colors">
                  링크복사
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
