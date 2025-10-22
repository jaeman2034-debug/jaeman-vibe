import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { Link } from "react-router-dom";

interface Academy {
  id: string;
  name: string;
  intro?: string;
  slogan?: string;
  ownerPhoto?: string;
  logoUrl?: string;
  bannerUrl?: string;
  location?: string;
  contact?: string;
  status?: "?�영�? | "준비중";
  isPublished?: boolean;
  createdAt: any;
}

export default function AcademyList() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAcademies = async () => {
      try {
        // ?�체 ?�카?��? 조회 (?�덱???�이???�작)
        const querySnapshot = await getDocs(collection(db, "academy"));
        const academiesData = querySnapshot.docs.map((doc) => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Academy));
        
        // ?�라?�언?�에???�터�?�??�렬
        const filteredAcademies = academiesData
          .filter(academy => academy.isPublished !== false) // isPublished가 false가 ?�닌 것들
          .sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
            const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
            return bTime.getTime() - aTime.getTime();
          });
        
        setAcademies(filteredAcademies);
      } catch (error) {
        console.error("?�카?��? 목록 조회 ?�류:", error);
        setAcademies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAcademies();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        {/* 간결???�더 */}
        <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                ?�� ?�카?��?
              </h1>
              <p className="text-gray-600 text-sm">
                ?�록???�카?��?�??�눈???�인?�세??              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* ?�켈?�톤 카드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="h-32 bg-gray-200 animate-pulse"></div>
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex border-t">
                  <div className="flex-1 h-10 bg-gray-200 animate-pulse"></div>
                  <div className="flex-1 h-10 bg-gray-200 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* 공개???�더 */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              ?�� ?�카?��?
            </h1>
            <p className="text-gray-600 text-sm">
              ?�록???�카?��?�??�눈???�인?�세??            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {academies.length === 0 ? (
          <div className="text-center py-16">
            <div className="relative backdrop-blur-sm bg-white/80 rounded-3xl shadow-xl p-12 max-w-md mx-auto border border-white/30">
              <div className="text-6xl mb-6">?��</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">?�록???�카?��?가 ?�습?�다</h3>
              <p className="text-gray-600 mb-6">�??�로???�카?��?가 ?�록???�정?�니??</p>
            </div>
          </div>
        ) : (
          <>
            {/* 간결???�계 */}
            <div className="flex items-center gap-6 mb-6 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                �?{academies.length}�??�카?��?
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                {academies.filter(a => a.slogan).length}�??�로�??�록
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                {academies.filter(a => a.ownerPhoto).length}�??�?�자 ?�진
              </span>
            </div>

            {/* ?�로??카드 ?��???그리??*/}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {academies.map((academy) => (
                <div key={academy.id} className="group">
                  {/* ?�로??카드 - ??�� 가�?배치 */}
                  <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group-hover:scale-105 border border-gray-100 flex flex-row items-start">
                    
                    {/* 좌측 ?�네??- ?�사각형 고정 */}
                    <div className="w-32 h-32 sm:w-36 sm:h-36 flex-shrink-0 bg-gray-100 relative overflow-hidden rounded-xl">
                      <img
                        src={academy.bannerUrl || academy.ownerPhoto || academy.logoUrl || "/default-academy.png"}
                        alt={academy.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='144' height='144' viewBox='0 0 144 144'%3E%3Crect width='144' height='144' fill='%23e5f3ff'/%3E%3Ctext x='72' y='78' text-anchor='middle' font-size='36' fill='%233b82f6'%3E??3C/text%3E%3C/svg%3E";
                        }}
                      />
                      {/* ?�태 배�? */}
                      {academy.status && (
                        <span className={`absolute top-2 left-2 text-xs px-2 py-1 rounded-full text-white font-bold
                                         ${academy.status === "?�영�? ? "bg-emerald-500" : "bg-amber-500"}`}>
                          {academy.status}
                        </span>
                      )}
                    </div>
                    
                    {/* ?�측 ?�스??*/}
                    <div className="flex flex-col justify-between p-4 flex-1 min-w-0">
                      <div className="space-y-1">
                        {/* ?�원�?*/}
                        <h3 className="font-bold text-lg text-gray-800 truncate">
                          {academy.name}
                        </h3>
                        
                        {/* ?�로�?*/}
                        {academy.slogan && (
                          <p className="text-sm text-blue-600 font-medium truncate">
                            {academy.slogan}
                          </p>
                        )}
                        
                        {/* ?�개 */}
                        {academy.intro && (
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {academy.intro}
                          </p>
                        )}
                        
                        {/* ?�락�??�치 */}
                        <div className="text-xs text-gray-500 space-y-1 mt-1">
                          {academy.location && (
                            <div className="flex items-center gap-1">
                              <span>?��</span>
                              <span className="truncate">{academy.location}</span>
                            </div>
                          )}
                          {academy.contact && (
                            <div className="flex items-center gap-1">
                              <span>?�️</span>
                              <span>{academy.contact}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* ?�션 버튼 */}
                      <div className="flex border-t mt-3">
                        <Link
                          to={`/academy/${academy.id}`}
                          className="flex-1 text-center py-2 text-blue-600 hover:bg-blue-50 transition-colors text-sm font-medium"
                        >
                          ?�� 블로�?보기
                        </Link>
                        <div className="w-px bg-gray-200"></div>
                        <Link
                          to={`/academy/${academy.id}#courses`}
                          className="flex-1 text-center py-2 text-emerald-600 hover:bg-emerald-50 transition-colors text-sm font-medium"
                        >
                          ?�� 강좌 보기
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
