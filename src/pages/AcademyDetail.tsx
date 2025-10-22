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
          alert("ê°•ì¢Œë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤.");
        }
      } catch (error) {
        console.error("ê°•ì¢Œ ì¡°íšŒ ?¤ë¥˜:", error);
        alert("ê°•ì¢Œ ?•ë³´ë¥?ë¶ˆëŸ¬?¤ëŠ”???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  const handleEnroll = () => {
    alert("ê°•ì¢Œ ? ì²­ ê¸°ëŠ¥?€ ì¶”í›„ êµ¬í˜„???ˆì •?…ë‹ˆ??");
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
        <h1 className="text-2xl font-bold text-gray-600 mb-4">ê°•ì¢Œë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤</h1>
        <Link
          to="/academy"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          ê°•ì¢Œ ëª©ë¡?¼ë¡œ ?Œì•„ê°€ê¸?        </Link>
      </div>
    );
  }

  const allImages = course.thumbnailUrl ? [course.thumbnailUrl, ...course.media] : course.media;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* ?¤ë¡œê°€ê¸?ë²„íŠ¼ */}
      <div className="mb-6">
        <Link
          to="/academy"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          ê°•ì¢Œ ëª©ë¡?¼ë¡œ ?Œì•„ê°€ê¸?        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ë©”ì¸ ?´ìš© */}
        <div className="lg:col-span-2">
          {/* ?¸ë„¤???´ë?ì§€ */}
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

          {/* ê°•ì¢Œ ?•ë³´ */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{course.title}</h1>
            
            <div className="prose max-w-none mb-8">
              <p className="text-gray-700 leading-relaxed text-lg">
                {course.description || "?ì„¸ ?¤ëª…???œê³µ?˜ì? ?Šì•˜?µë‹ˆ??"}
              </p>
            </div>

            {/* ì¶”ê? ?•ë³´ ?¹ì…˜ */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold mb-6">ê°•ì¢Œ ?•ë³´</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <span className="font-medium text-gray-700">ê°•ì‚¬</span>
                    <p className="text-gray-900">{course.instructor}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <span className="font-medium text-gray-700">?¼ì •</span>
                    <p className="text-gray-900">{course.date}</p>
                  </div>
                </div>
                
                {course.capacity > 0 && (
                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div>
                      <span className="font-medium text-gray-700">?•ì›</span>
                      <p className="text-gray-900">{course.capacity}ëª?/p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ?´ë?ì§€/?™ì˜??ê°¤ëŸ¬ë¦?*/}
          {allImages.length > 1 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">ì¶”ê? ?´ë?ì§€</h2>
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
                      alt={`ê°•ì¢Œ ?´ë?ì§€ ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ?¬ì´?œë°” */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-6">
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {course.price === 0 ? "ë¬´ë£Œ" : `${course.price.toLocaleString()}??}
              </div>
              <div className="text-sm text-gray-500">
                {course.price > 0 ? "?˜ê°•ë£? : "ë¬´ë£Œ ê°•ì¢Œ"}
              </div>
            </div>

            {/* ? ì²­ ë²„íŠ¼ */}
            <button 
              onClick={handleEnroll}
              className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg mb-6"
            >
              ê°•ì¢Œ ? ì²­?˜ê¸°
            </button>

            {/* ê°•ì¢Œ ?•ë³´ ?”ì•½ */}
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">ê°•ì‚¬</span>
                <span className="font-medium">{course.instructor}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">?¼ì •</span>
                <span className="font-medium">{course.date}</span>
              </div>
              {course.capacity > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">?•ì›</span>
                  <span className="font-medium">{course.capacity}ëª?/span>
                </div>
              )}
            </div>

            {/* ê³µìœ  ë²„íŠ¼ */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-3">ê°•ì¢Œ ê³µìœ ?˜ê¸°</div>
              <div className="flex space-x-2">
                <button className="flex-1 bg-yellow-400 text-white py-2 rounded text-sm hover:bg-yellow-500 transition-colors">
                  ì¹´ì¹´?¤í†¡
                </button>
                <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded text-sm hover:bg-gray-200 transition-colors">
                  ë§í¬ë³µì‚¬
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
