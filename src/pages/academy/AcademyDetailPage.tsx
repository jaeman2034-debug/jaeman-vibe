import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useParams, Link } from "react-router-dom";
import { demoAcademy } from "@/mock/academyDemo";

interface Academy {
  id: string;
  name: string;
  intro?: string;
  logoUrl?: string;
  location?: string;
  contact?: string;
  website?: string;
  sns?: string;
  ownerName?: string;
  ownerPhoto?: string;
  ownerMessage?: string;
  ownerTitle?: string;
  ownerCredentials?: string[];
  slogan?: string;
  photos?: string[];
  notices?: Array<{
    id: string;
    title: string;
    date: string;
  }>;
  reviews?: Array<{
    id: string;
    parent: string;
    rating: number;
    comment: string;
    date: string;
  }>;
  courses?: Course[];
}

interface Course {
  id: string;
  title: string;
  description?: string;
  instructor?: string;
  coach?: string;
  startDate?: string;
  endDate?: string;
  date?: string;
  price?: number;
  fee?: string;
  capacity?: number;
  thumbnailUrl?: string;
  academyId?: string;
  createdAt?: any;
}

export default function AcademyDetailPage() {
  const { academyId } = useParams<{ academyId: string }>();
  
  // ?¤ì œ Firestore ?°ë™ ?„ê¹Œì§€??demoAcademy ?¬ìš©
  const academy = demoAcademy;
  const courses = demoAcademy.courses;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* ?„ì¹´?°ë? ?„ë¡œ??*/}
      <div className="bg-white shadow rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* ?€?œì ?¬ì§„ */}
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
          <img
            src={academy.ownerPhoto || "/default-profile.png"}
            alt="?€?œì ?¬ì§„"
            className="w-full h-full object-cover"
          />
        </div>

        {/* ?„ì¹´?°ë? ê¸°ë³¸ ?•ë³´ */}
        <div className="flex-1 space-y-2">
          <h1 className="text-2xl font-bold">{academy.name}</h1>
          {academy.slogan && (
            <p className="text-lg text-emerald-600 font-medium">
              {academy.slogan}
            </p>
          )}
          {academy.intro && (
            <p className="text-gray-600">{academy.intro}</p>
          )}
          <div className="text-sm text-gray-500 space-y-1">
            {academy.location && <p>?“ {academy.location}</p>}
            {academy.contact && <p>?ï¸ {academy.contact}</p>}
            {academy.website && (
              <p>
                ?Œ{" "}
                <a
                  href={academy.website}
                  target="_blank"
                  className="text-blue-600 underline"
                >
                  {academy.website}
                </a>
              </p>
            )}
            {academy.sns && <p>?“± {academy.sns}</p>}
          </div>
        </div>

        {/* ë¬¸ì˜ & ê´€ë¦?ë²„íŠ¼ */}
        <div className="flex gap-2 mt-4 sm:mt-0">
          <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
            ë¬¸ì˜?˜ê¸°
          </button>
          <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            ?„ë¡œ??ê´€ë¦?          </button>
        </div>
      </div>

      {/* ê°•ì¢Œ ëª©ë¡ */}
      <section>
        <h2 id="courses" className="text-xl font-bold mb-4">?“š ê°œì„¤ ê°•ì¢Œ</h2>
        {courses.length > 0 ? (
          <div className="grid gap-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="border rounded-xl p-4 bg-white shadow hover:shadow-md transition"
              >
                <h3 className="font-semibold text-lg">{course.title}</h3>
                <p className="text-gray-600 text-sm">{course.description}</p>
                <div className="text-sm text-gray-500 mt-2 space-y-1">
                  <p>?‘¨?ğŸ?ì½”ì¹˜: {course.coach}</p>
                  <p>
                    ?“… {course.startDate} ~ {course.endDate}
                  </p>
                  <p>?‘¥ ?•ì›: {course.capacity}ëª?/p>
                  <p>?’° ?˜ê°•ë£? {course.fee}</p>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    ?˜ê°• ? ì²­
                  </button>
                  <Link
                    to={`/academy/${academy.id}/courses/${course.id}`}
                    className="flex-1 py-2 text-center bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    ?ì„¸ë³´ê¸°
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">?„ì§ ê°œì„¤??ê°•ì¢Œê°€ ?†ìŠµ?ˆë‹¤.</p>
        )}
      </section>

      {/* ?“¢ ê³µì??¬í•­ */}
      <section>
        <h2 className="text-xl font-bold mt-8 mb-4">?“¢ ê³µì??¬í•­</h2>
        {academy.notices && academy.notices.length > 0 ? (
          <div className="bg-white rounded-xl shadow p-6">
            <ul className="space-y-3">
              {academy.notices.map((notice: any) => (
                <li key={notice.id} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-b-0">
                  <span className="text-gray-800 font-medium">{notice.title}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{notice.date}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-gray-500">?±ë¡??ê³µì?ê°€ ?†ìŠµ?ˆë‹¤.</p>
          </div>
        )}
      </section>

      {/* ?“¸ ?¬ì§„ì²?*/}
      <section>
        <h2 className="text-xl font-bold mt-8 mb-4">?“¸ ?¬ì§„ì²?/h2>
        {academy.photos && academy.photos.length > 0 ? (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {academy.photos.map((url: string, idx: number) => (
                <div key={idx} className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <img 
                    src={url} 
                    alt={`${academy.name} ?¬ì§„ ${idx + 1}`} 
                    className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='200' y='150' text-anchor='middle' font-size='24' fill='%236b7280'%3E?“¸%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  {/* ?¸ë²„ ???•ë? ?„ì´ì½?*/}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* ?¬ì§„ì²??ˆë‚´ ë©”ì‹œì§€ */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                ?’¡ ?ˆë ¨ ?¥ë©´, ?¨ì²´ ?¬ì§„, ?˜ìƒ ê¸°ë¡ ???„ì¹´?°ë????ìƒ??ëª¨ìŠµ???•ì¸?˜ì„¸??
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <div className="text-6xl mb-4">?“¸</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">?¬ì§„ì²©ì´ ì¤€ë¹?ì¤‘ì…?ˆë‹¤</h3>
            <p className="text-gray-600 mb-6">
              ?„ì¹´?°ë????ˆë ¨ ?¥ë©´, ?¨ì²´ ?¬ì§„, ?˜ìƒ ê¸°ë¡ ??br />
              ?ìƒ??ëª¨ìŠµ??ê³?ë§Œë‚˜ë³´ì‹¤ ???ˆìŠµ?ˆë‹¤!
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
              <span className="bg-gray-100 px-3 py-1 rounded-full">?ƒ?â™‚ï¸??ˆë ¨ ?¥ë©´</span>
              <span className="bg-gray-100 px-3 py-1 rounded-full">?‘¨?ğŸ‘©â€ğŸ‘??¨ì²´ ?¬ì§„</span>
              <span className="bg-gray-100 px-3 py-1 rounded-full">?† ?˜ìƒ ê¸°ë¡</span>
              <span className="bg-gray-100 px-3 py-1 rounded-full">?‰ ?‰ì‚¬ ?¬ì§„</span>
            </div>
          </div>
        )}
      </section>

      {/* â­??™ë?ëª??„ê¸° */}
      <section>
        <h2 className="text-xl font-bold mt-8 mb-4">â­??™ë?ëª??„ê¸°</h2>
        {academy.reviews && academy.reviews.length > 0 ? (
          <div className="space-y-4">
            {academy.reviews.map((review: any) => (
              <div key={review.id} className="bg-white rounded-xl shadow p-6 border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-800">{review.parent}</h4>
                    <div className="flex items-center mt-1">
                      <div className="text-yellow-500 text-lg">
                        {"â­?.repeat(review.rating)}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">({review.rating}/5)</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {review.date}
                  </span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  "{review.comment}"
                </p>
              </div>
            ))}
            
            {/* ?„ê¸° ?µê³„ */}
            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl p-4 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800">?„ì²´ ?‰ì </h4>
                  <div className="flex items-center mt-1">
                    <div className="text-yellow-500 text-xl">
                      {"â­?.repeat(5)}
                    </div>
                    <span className="ml-2 text-lg font-bold text-gray-800">4.7/5</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">ì´?{academy.reviews.length}ê°??„ê¸°</p>
                  <p className="text-xs text-gray-500">?¤ì œ ?™ë?ëª¨ë‹˜?¤ì˜ ?ìƒ???„ê¸°</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <div className="text-6xl mb-4">â­?/div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">?„ì§ ?±ë¡???„ê¸°ê°€ ?†ìŠµ?ˆë‹¤</h3>
            <p className="text-gray-600 mb-6">
              ì²?ë²ˆì§¸ ?„ê¸°ë¥??¨ê²¨ì£¼ì„¸??<br />
              ?™ë?ëª¨ë‹˜?¤ì˜ ?Œì¤‘???˜ê²¬???„ì¹´?°ë? ë°œì „???„ì????©ë‹ˆ??
            </p>
            <button className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors">
              ?„ê¸° ?‘ì„±?˜ê¸°
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
