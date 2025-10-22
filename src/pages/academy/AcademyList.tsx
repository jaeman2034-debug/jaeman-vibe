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
  status?: "?¥ÏòÅÏ§? | "Ï§ÄÎπÑÏ§ë";
  isPublished?: boolean;
  createdAt: any;
}

export default function AcademyList() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAcademies = async () => {
      try {
        // ?ÑÏ≤¥ ?ÑÏπ¥?∞Î? Ï°∞Ìöå (?∏Îç±???ÜÏù¥???ôÏûë)
        const querySnapshot = await getDocs(collection(db, "academy"));
        const academiesData = querySnapshot.docs.map((doc) => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Academy));
        
        // ?¥Îùº?¥Ïñ∏?∏Ïóê???ÑÌÑ∞Îß?Î∞??ïÎ†¨
        const filteredAcademies = academiesData
          .filter(academy => academy.isPublished !== false) // isPublishedÍ∞Ä falseÍ∞Ä ?ÑÎãå Í≤ÉÎì§
          .sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
            const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
            return bTime.getTime() - aTime.getTime();
          });
        
        setAcademies(filteredAcademies);
      } catch (error) {
        console.error("?ÑÏπ¥?∞Î? Î™©Î°ù Ï°∞Ìöå ?§Î•ò:", error);
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
        {/* Í∞ÑÍ≤∞???§Îçî */}
        <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                ?è´ ?ÑÏπ¥?∞Î?
              </h1>
              <p className="text-gray-600 text-sm">
                ?±Î°ù???ÑÏπ¥?∞Î?Î•??úÎàà???ïÏù∏?òÏÑ∏??              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* ?§Ïºà?àÌÜ§ Ïπ¥Îìú */}
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
      {/* Í≥µÍ∞ú???§Îçî */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              ?è´ ?ÑÏπ¥?∞Î?
            </h1>
            <p className="text-gray-600 text-sm">
              ?±Î°ù???ÑÏπ¥?∞Î?Î•??úÎàà???ïÏù∏?òÏÑ∏??            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {academies.length === 0 ? (
          <div className="text-center py-16">
            <div className="relative backdrop-blur-sm bg-white/80 rounded-3xl shadow-xl p-12 max-w-md mx-auto border border-white/30">
              <div className="text-6xl mb-6">?è´</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">?±Î°ù???ÑÏπ¥?∞Î?Í∞Ä ?ÜÏäµ?àÎã§</h3>
              <p className="text-gray-600 mb-6">Í≥??àÎ°ú???ÑÏπ¥?∞Î?Í∞Ä ?±Î°ù???àÏ†ï?ÖÎãà??</p>
            </div>
          </div>
        ) : (
          <>
            {/* Í∞ÑÍ≤∞???µÍ≥Ñ */}
            <div className="flex items-center gap-6 mb-6 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Ï¥?{academies.length}Í∞??ÑÏπ¥?∞Î?
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                {academies.filter(a => a.slogan).length}Í∞??¨Î°úÍ±??±Î°ù
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                {academies.filter(a => a.ownerPhoto).length}Í∞??Ä?úÏûê ?¨ÏßÑ
              </span>
            </div>

            {/* ?ÑÎ°ú??Ïπ¥Îìú ?§Ì???Í∑∏Î¶¨??*/}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {academies.map((academy) => (
                <div key={academy.id} className="group">
                  {/* ?ÑÎ°ú??Ïπ¥Îìú - ??ÉÅ Í∞ÄÎ°?Î∞∞Ïπò */}
                  <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group-hover:scale-105 border border-gray-100 flex flex-row items-start">
                    
                    {/* Ï¢åÏ∏° ?∏ÎÑ§??- ?ïÏÇ¨Í∞ÅÌòï Í≥†Ï†ï */}
                    <div className="w-32 h-32 sm:w-36 sm:h-36 flex-shrink-0 bg-gray-100 relative overflow-hidden rounded-xl">
                      <img
                        src={academy.bannerUrl || academy.ownerPhoto || academy.logoUrl || "/default-academy.png"}
                        alt={academy.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='144' height='144' viewBox='0 0 144 144'%3E%3Crect width='144' height='144' fill='%23e5f3ff'/%3E%3Ctext x='72' y='78' text-anchor='middle' font-size='36' fill='%233b82f6'%3E??3C/text%3E%3C/svg%3E";
                        }}
                      />
                      {/* ?ÅÌÉú Î∞∞Ï? */}
                      {academy.status && (
                        <span className={`absolute top-2 left-2 text-xs px-2 py-1 rounded-full text-white font-bold
                                         ${academy.status === "?¥ÏòÅÏ§? ? "bg-emerald-500" : "bg-amber-500"}`}>
                          {academy.status}
                        </span>
                      )}
                    </div>
                    
                    {/* ?∞Ï∏° ?çÏä§??*/}
                    <div className="flex flex-col justify-between p-4 flex-1 min-w-0">
                      <div className="space-y-1">
                        {/* ?ôÏõêÎ™?*/}
                        <h3 className="font-bold text-lg text-gray-800 truncate">
                          {academy.name}
                        </h3>
                        
                        {/* ?¨Î°úÍ±?*/}
                        {academy.slogan && (
                          <p className="text-sm text-blue-600 font-medium truncate">
                            {academy.slogan}
                          </p>
                        )}
                        
                        {/* ?åÍ∞ú */}
                        {academy.intro && (
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {academy.intro}
                          </p>
                        )}
                        
                        {/* ?∞ÎùΩÏ≤??ÑÏπò */}
                        <div className="text-xs text-gray-500 space-y-1 mt-1">
                          {academy.location && (
                            <div className="flex items-center gap-1">
                              <span>?ìç</span>
                              <span className="truncate">{academy.location}</span>
                            </div>
                          )}
                          {academy.contact && (
                            <div className="flex items-center gap-1">
                              <span>?éÔ∏è</span>
                              <span>{academy.contact}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* ?°ÏÖò Î≤ÑÌäº */}
                      <div className="flex border-t mt-3">
                        <Link
                          to={`/academy/${academy.id}`}
                          className="flex-1 text-center py-2 text-blue-600 hover:bg-blue-50 transition-colors text-sm font-medium"
                        >
                          ?ìñ Î∏îÎ°úÍ∑?Î≥¥Í∏∞
                        </Link>
                        <div className="w-px bg-gray-200"></div>
                        <Link
                          to={`/academy/${academy.id}#courses`}
                          className="flex-1 text-center py-2 text-emerald-600 hover:bg-emerald-50 transition-colors text-sm font-medium"
                        >
                          ?ìö Í∞ïÏ¢å Î≥¥Í∏∞
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
