import React, { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { Link } from "react-router-dom";

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
}

interface Academy {
  id: string;
  name: string;
  intro: string;
  logoUrl?: string;
  location: string;
  contact: string;
  website: string;
  sns: string;
  // ?€?œì ?•ë³´ (? ë¢° ?¬ì¸??
  ownerName?: string;
  ownerPhoto?: string;
  ownerMessage?: string;
  ownerTitle?: string;
  ownerCredentials?: string[];
  // ?ë³´ ?•ë³´
  slogan?: string; // ?ë³´ ?¬ë¡œê±?}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState<Academy | null>(null);
  const [course, setCourse] = useState({
    title: "",
    description: "",
    instructor: "",
    date: "",
    price: "",
    capacity: "",
  });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // ê´€ë¦¬ì ê¶Œí•œ ì²´í¬

  // ê°•ì¢Œ ë°??„ì¹´?°ë? ?•ë³´ ë¶ˆëŸ¬?¤ê¸°
  useEffect(() => {
    const fetchData = async () => {
      try {
        // ê°•ì¢Œ ?•ë³´ ë¶ˆëŸ¬?¤ê¸°
        const coursesSnapshot = await getDocs(collection(db, "academy", "courses", "list"));
        const coursesData = coursesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Course));
        setCourses(coursesData);

        // ?„ì¹´?°ë? ?•ë³´ ë¶ˆëŸ¬?¤ê¸° (?„ì²´ ëª©ë¡)
        const academySnapshot = await getDocs(collection(db, "academy"));
        const academiesData = academySnapshot.docs.map((doc) => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Academy));
        setAcademies(academiesData);

        // ì²?ë²ˆì§¸ ?„ì¹´?°ë?ë¥?ê¸°ë³¸ ? íƒ
        if (academiesData.length > 0) {
          setSelectedAcademy(academiesData[0]);
        }

        // ê´€ë¦¬ì ê¶Œí•œ ì²´í¬ (?„ì‹œë¡?localStorage ?¬ìš©)
        // TODO: ?¤ì œ ?¸ì¦ ?œìŠ¤?œê³¼ ?°ë™
        const adminStatus = localStorage.getItem('isAdmin') === 'true';
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error("?°ì´??ë¶ˆëŸ¬?¤ê¸° ?¤ë¥˜:", error);
      }
    };
    fetchData();
  }, []);

  // ê°•ì¢Œ ì¶”ê?
  const addCourse = async () => {
    if (!course.title) return alert("ê°•ì¢Œëª…ì„ ?…ë ¥?˜ì„¸??);
    if (!course.instructor) return alert("ê°•ì‚¬ëª…ì„ ?…ë ¥?˜ì„¸??);
    if (!course.date) return alert("?¼ì •??? íƒ?˜ì„¸??);
    
    setLoading(true);
    try {
      let thumbnailUrl = "";
      
      // ?¸ë„¤???…ë¡œ??      if (thumbnail) {
        const thumbnailRef = ref(storage, `academy/courses/${uuidv4()}-${thumbnail.name}`);
        await uploadBytes(thumbnailRef, thumbnail);
        thumbnailUrl = await getDownloadURL(thumbnailRef);
      }

      await addDoc(collection(db, "academy", "courses", "list"), {
        ...course,
        price: course.price ? parseInt(course.price) : 0,
        capacity: course.capacity ? parseInt(course.capacity) : 0,
        thumbnailUrl,
        academyId: selectedAcademy?.id || "academy_001", // ? íƒ???„ì¹´?°ë? ID ì¶”ê?
        createdAt: new Date(),
      });

      // ??ì´ˆê¸°??      setCourse({
        title: "",
        description: "",
        instructor: "",
        date: "",
        price: "",
        capacity: "",
      });
      setThumbnail(null);
      setShowForm(false);
      alert("ê°•ì¢Œê°€ ?±ë¡?˜ì—ˆ?µë‹ˆ??");
      window.location.reload();
    } catch (err) {
      console.error("ê°•ì¢Œ ?±ë¡ ?¤ë¥˜:", err);
      alert("ê°•ì¢Œ ?±ë¡???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCourse({ ...course, [e.target.name]: e.target.value });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnail(e.target.files[0]);
    }
  };

  // ê°•ì¢Œ ?? œ
  const deleteCourse = async (courseId: string, courseTitle: string) => {
    if (!confirm(`?•ë§ "${courseTitle}" ê°•ì¢Œë¥??? œ?˜ì‹œê² ìŠµ?ˆê¹Œ?\n\n? ï¸ ???‘ì—…?€ ?˜ëŒë¦????†ìŠµ?ˆë‹¤.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "academy", "courses", "list", courseId));
      alert("??ê°•ì¢Œê°€ ?? œ?˜ì—ˆ?µë‹ˆ??");
      
      // ê°•ì¢Œ ëª©ë¡ ?ˆë¡œê³ ì¹¨
      const querySnapshot = await getDocs(collection(db, "academy", "courses", "list"));
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Course));
      setCourses(data);
    } catch (error) {
      console.error("ê°•ì¢Œ ?? œ ?¤ë¥˜:", error);
      alert("??ê°•ì¢Œ ?? œ???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* ìµœì‹  ë°˜ì‘???ë³´???„ë¡œ??- ê¸€?˜ìŠ¤ëª¨í”¼ì¦?*/}
      <div className="relative overflow-hidden">
        {/* ë°°ê²½ ê·¸ë¼?°ì´??*/}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-mint-50"></div>
        
        {/* ê¸€?˜ìŠ¤ëª¨í”¼ì¦?ì¹´ë“œ */}
        <div className="relative backdrop-blur-sm bg-white/70 rounded-3xl shadow-2xl p-6 md:p-8 mb-8 border border-white/20">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            
            {/* ?€?œì ?¬ì§„ ?¹ì…˜ */}
            <div className="relative flex-shrink-0">
              <div className="relative">
                <img
                  src={selectedAcademy?.ownerPhoto || "/default-owner.png"}
                  alt="?€?œì"
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-2xl"
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Crect width='160' height='160' fill='%23e5f3ff'/%3E%3Ctext x='80' y='90' text-anchor='middle' font-size='60' fill='%233b82f6'%3E?‘¨?ğŸ?3C/text%3E%3C/svg%3E";
                  }}
                />
                {/* ?ì¥ ë±ƒì? */}
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                  ?ì¥
                </div>
              </div>
            </div>
            
            {/* ?™ì› ?•ë³´ ?¹ì…˜ */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              
              {/* ?™ì›ëª?- ê·¸ë¼?°ì´???ìŠ¤??*/}
              <h1 className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-blue-700 to-emerald-600">
                {selectedAcademy?.name || "?Œí˜ ì¶•êµ¬ ?„ì¹´?°ë?"}
              </h1>
              
              {/* ?™ì› ?Œê°œ */}
              <p className="text-gray-700 text-sm md:text-base leading-relaxed max-w-2xl">
                {selectedAcademy?.intro || "? ì†Œ??ì¶•êµ¬ë¥??„ë¬¸?¼ë¡œ ì§€?„í•˜???„ì¹´?°ë??…ë‹ˆ?? ì²´ê³„?ì¸ ?ˆë ¨ê³?ê°œì¸ë³?ë§ì¶¤ ì§€?„ë? ?µí•´ ?„ì´?¤ì˜ ì¶•êµ¬ ?¤ë ¥ ?¥ìƒê³??¸ì„± ë°œë‹¬???„ëª¨?©ë‹ˆ??"}
              </p>

              {/* ?€?œì ?•ë³´ ì¹´ë“œ */}
              {(selectedAcademy?.ownerName || selectedAcademy?.ownerMessage) && (
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/30">
                  <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
                    {selectedAcademy?.ownerName || "ê¹€ì² ìˆ˜ ?ì¥"}
                  </h3>
                  <p className="text-gray-600 italic text-sm md:text-base">
                    "{selectedAcademy?.ownerMessage || "?„ì´?¤ì˜ ê¿ˆì„ ?¤ìš°??ì§€?„ìê°€ ?˜ê² ?µë‹ˆ??"}"
                  </p>
                </div>
              )}

              {/* ?ë³´ ?¬ë¡œê±?- ê°•ì¡° ë°•ìŠ¤ */}
              <div className="bg-gradient-to-r from-blue-500/90 to-emerald-500/90 backdrop-blur-sm text-white rounded-2xl p-4 shadow-lg">
                <blockquote className="text-lg md:text-xl font-semibold text-center">
                  {selectedAcademy?.slogan || "???„ì´?¤ì˜ ê¿ˆì„ ?¤ìš°??ì¶•êµ¬ ?„ì¹´?°ë? ??}
                </blockquote>
              </div>

              {/* ?°ë½ì²??„ì¹˜ ?•ë³´ - ê·¸ë¦¬??*/}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm md:text-base text-gray-700">
                <div className="flex items-center gap-2 bg-white/40 backdrop-blur-sm rounded-xl p-3 shadow-sm">
                  <span className="text-lg">?“</span>
                  <span className="font-medium">{selectedAcademy?.location || "ê²½ê¸° ?¬ì²œ???Œí˜ ì²´ìœ¡ê³µì› Aêµ¬ì¥"}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/40 backdrop-blur-sm rounded-xl p-3 shadow-sm">
                  <span className="text-lg">?ï¸</span>
                  <span className="font-medium">{selectedAcademy?.contact || "010-1234-5678"}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/40 backdrop-blur-sm rounded-xl p-3 shadow-sm">
                  <span className="text-lg">?Œ</span>
                  <a href={selectedAcademy?.website || "https://yago-vibe.com/academy"} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-blue-600 transition-colors">
                    ?ˆí˜?´ì?
                  </a>
                </div>
                <div className="flex items-center gap-2 bg-white/40 backdrop-blur-sm rounded-xl p-3 shadow-sm">
                  <span className="text-lg">?“¢</span>
                  <span className="font-medium">{selectedAcademy?.sns || "@soheul_fc_official"}</span>
                </div>
              </div>

              {/* ?¡ì…˜ ë²„íŠ¼??- ëª¨ë°”???¼ìŠ¤??*/}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link 
                  to={`/academy/${selectedAcademy?.id || "academy_001"}`}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium text-center"
                >
                  ?“– ?ì„¸ ?˜ì´ì§€ ë³´ê¸°
                </Link>
                <a
                  href={`tel:${selectedAcademy?.contact || "010-1234-5678"}`}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium text-center"
                >
                  ?“ ë¬¸ì˜?˜ê¸°
                </a>
                <Link 
                  to="/academy/profile/edit"
                  className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium text-center"
                >
                  ?™ï¸ ?„ë¡œ??ê´€ë¦?                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* ê°•ì¢Œ ?€?œë³´???¤ë” */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold flex items-center">
            ?“š ?„ì¹´?°ë? ê°•ì¢Œ
            <span className="ml-3 bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
              ì´?{courses.length}ê°?            </span>
          </h2>
          
          {/* ?„ì¹´?°ë? ? íƒ ?œë¡­?¤ìš´ */}
          {academies.length > 1 && (
            <div className="relative">
              <select
                value={selectedAcademy?.id || ""}
                onChange={(e) => {
                  const academy = academies.find(a => a.id === e.target.value);
                  setSelectedAcademy(academy || null);
                }}
                className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                {academies.map((academy) => (
                  <option key={academy.id} value={academy.id}>
                    {academy.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          {/* ?„ì¹´?°ë? ëª©ë¡ ë³´ê¸° */}
          <Link
            to="/academy/list"
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            ?“‹ ?„ì¹´?°ë? ëª©ë¡
          </Link>
          {/* ???„ì¹´?°ë? ë¸”ë¡œê·?ë§Œë“¤ê¸?*/}
          <Link
            to="/academy/new"
            className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-6 py-3 rounded-xl hover:from-emerald-700 hover:to-teal-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            ?« ???„ì¹´?°ë? ë¸”ë¡œê·?ë§Œë“¤ê¸?          </Link>
          {/* ê´€ë¦¬ì ê¶Œí•œ ? ê? (ê°œë°œ?? */}
          <button
            onClick={() => {
              const newAdminStatus = !isAdmin;
              setIsAdmin(newAdminStatus);
              localStorage.setItem('isAdmin', newAdminStatus.toString());
              alert(`ê´€ë¦¬ì ëª¨ë“œ ${newAdminStatus ? 'ON' : 'OFF'}`);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isAdmin 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isAdmin ? '?”“ ê´€ë¦¬ì ëª¨ë“œ' : '?”’ ?¼ë°˜ ëª¨ë“œ'}
          </button>
        <button
          onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-md"
        >
          {showForm ? "ì·¨ì†Œ" : "??ê°•ì¢Œ ?±ë¡"}
        </button>
        </div>
      </div>

      {/* ìµœì‹  ?”ì•½ ì¹´ë“œ - ê¸€?˜ìŠ¤ëª¨í”¼ì¦?*/}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative backdrop-blur-sm bg-white/80 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 text-center border border-white/30 group hover:scale-105">
          <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-700 mb-2">
            {courses.length}
          </div>
          <div className="text-gray-600 font-medium">?“š ?„ì²´ ê°•ì¢Œ</div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-blue-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        <div className="relative backdrop-blur-sm bg-white/80 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 text-center border border-white/30 group hover:scale-105">
          <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-700 mb-2">
            {courses.filter((c) => c.date && new Date(c.date) >= new Date()).length}
          </div>
          <div className="text-gray-600 font-medium">?¶ï¸ ì§„í–‰ ì¤?/div>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        <div className="relative backdrop-blur-sm bg-white/80 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 text-center border border-white/30 group hover:scale-105">
          <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            {courses.reduce((acc, c) => acc + (c.capacity || 0), 0)}
          </div>
          <div className="text-gray-600 font-medium">?‘¥ ì´??•ì›</div>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      </div>

      {/* ?±ë¡ ??*/}
      {showForm && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
            ????ê°•ì¢Œ ?±ë¡
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                ?“š ê°•ì¢Œëª?*
              </label>
              <input
                type="text"
                name="title"
                placeholder="ê°•ì¢Œëª…ì„ ?…ë ¥?˜ì„¸??
                value={course.title}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                ?‘¨?ğŸ?ê°•ì‚¬ëª?*
              </label>
              <input
                type="text"
                name="instructor"
                placeholder="ê°•ì‚¬ëª…ì„ ?…ë ¥?˜ì„¸??
                value={course.instructor}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                ?“… ?¼ì • *
              </label>
              <input
                type="date"
                name="date"
                value={course.date}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                ?’° ?˜ê°•ë£?(??
              </label>
              <input
                type="number"
                name="price"
                placeholder="0 (ë¬´ë£Œ)"
                value={course.price}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                ?‘¥ ?•ì›
              </label>
              <input
                type="number"
                name="capacity"
                placeholder="ìµœë? ?¸ì›"
                value={course.capacity}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                ?–¼ï¸??¸ë„¤???´ë?ì§€
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="w-full border-2 border-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              ?“ ê°•ì¢Œ ?¤ëª…
            </label>
            <textarea
              name="description"
              placeholder="ê°•ì¢Œ???€???ì„¸???¤ëª…???…ë ¥?˜ì„¸??
              value={course.description}
              onChange={handleChange}
              rows={4}
              className="w-full border-2 border-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white resize-none"
            />
          </div>
          
          <div className="flex gap-4 mt-8">
            <button
              onClick={addCourse}
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold shadow-lg flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  ?±ë¡ ì¤?..
                </>
              ) : (
                <>
                  ???±ë¡?˜ê¸°
                </>
              )}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-100 text-gray-700 px-8 py-4 rounded-xl hover:bg-gray-200 transition-colors font-semibold border-2 border-gray-200"
            >
              ì·¨ì†Œ
            </button>
          </div>
        </div>
      )}

      {/* ìµœì‹  ê°•ì¢Œ ì¹´ë“œ ëª©ë¡ - ê¸€?˜ìŠ¤ëª¨í”¼ì¦?*/}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((c) => (
          <div key={c.id} className="group relative">
            {/* ê¸€?˜ìŠ¤ëª¨í”¼ì¦?ì¹´ë“œ */}
            <div className="relative backdrop-blur-sm bg-white/80 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/30 overflow-hidden group-hover:scale-105">
              
              {/* ?íƒœ ë±ƒì? */}
              <div className="absolute top-4 right-4 z-10">
                <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-lg ${
                  c.date && new Date(c.date) >= new Date() 
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white" 
                    : "bg-gradient-to-r from-gray-400 to-gray-500 text-white"
                }`}>
                  {c.date && new Date(c.date) >= new Date() ? "ì§„í–‰ ì¤? : "ì¢…ë£Œ"}
                </span>
              </div>
              
            {/* ?¸ë„¤???´ë?ì§€ */}
              <div className="aspect-video bg-gradient-to-br from-blue-50 via-white to-emerald-50 overflow-hidden">
              {c.thumbnailUrl ? (
                <img
                  src={c.thumbnailUrl}
                  alt={c.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* ì¹´ë“œ ?´ìš© */}
              <div className="p-6">
                {/* ê°•ì¢Œ ?œëª© */}
                <h3 className="font-bold text-xl mb-3 line-clamp-2 bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
                  {c.title}
                </h3>
                
                {/* ê°•ì¢Œ ?¤ëª… */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                {c.description || "?ì„¸ ?¤ëª…???†ìŠµ?ˆë‹¤."}
              </p>
              
                {/* ê°•ì¢Œ ?•ë³´ */}
                <div className="space-y-3 text-sm text-gray-700 mb-6">
                  <div className="flex items-center bg-white/50 backdrop-blur-sm rounded-xl p-2">
                    <span className="text-lg mr-3">?‘¨?ğŸ?/span>
                    <span className="font-medium">{c.instructor}</span>
                </div>
                  <div className="flex items-center bg-white/50 backdrop-blur-sm rounded-xl p-2">
                    <span className="text-lg mr-3">?“…</span>
                    <span className="font-medium">{c.date}</span>
                  </div>
                  {c.capacity > 0 && (
                    <div className="flex items-center bg-white/50 backdrop-blur-sm rounded-xl p-2">
                      <span className="text-lg mr-3">?‘¥</span>
                      <span className="font-medium">?•ì› {c.capacity}ëª?/span>
                  </div>
                )}
              </div>
              
                {/* ê°€ê²©ê³¼ ë²„íŠ¼ */}
                <div className="space-y-4">
                  {/* ê°€ê²?*/}
                  <div className="text-center">
                    <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-600">
                  {c.price === 0 ? "ë¬´ë£Œ" : `${c.price.toLocaleString()}??}
                </div>
                  </div>
                  
                  {/* ë²„íŠ¼ ê·¸ë£¹ */}
                  <div className="space-y-2">
                    <button className="w-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-4 py-3 rounded-full hover:from-gray-200 hover:to-gray-300 transition-all duration-300 text-sm font-medium shadow-sm hover:shadow-md">
                      ?˜ê°• ? ì²­
                    </button>
                <Link
                  to={`/academy/courses/${c.id}`}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl text-center block"
                >
                  ?ì„¸ë³´ê¸°
                </Link>
                    {isAdmin && (
                      <button
                        onClick={() => deleteCourse(c.id, c.title)}
                        className="w-full bg-gradient-to-r from-red-100 to-red-200 text-red-600 px-4 py-3 rounded-full hover:from-red-200 hover:to-red-300 transition-all duration-300 text-sm font-medium border border-red-200 shadow-sm hover:shadow-md"
                        title="ê°•ì¢Œ ?? œ (ê´€ë¦¬ì ?„ìš©)"
                      >
                        ?—‘ï¸??? œ
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {courses.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
            <div className="text-6xl mb-6">?“š</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">?±ë¡??ê°•ì¢Œê°€ ?†ìŠµ?ˆë‹¤</h3>
            <p className="text-gray-600 mb-6">??ê°•ì¢Œë¥??±ë¡?´ë³´?¸ìš”!</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-md"
            >
              ì²?ê°•ì¢Œ ?±ë¡?˜ê¸°
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
