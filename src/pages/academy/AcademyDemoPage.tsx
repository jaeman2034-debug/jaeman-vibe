import React from "react";
import { Link } from "react-router-dom";
import { demoAcademy } from "@/mock/academyDemo";

export default function AcademyDemoPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* ?�카?��? ?�로??*/}
      <div className="bg-white shadow rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* ?�?�자 ?�진 */}
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
          <img
            src={demoAcademy.ownerPhoto || "/default-profile.png"}
            alt="?�?�자 ?�진"
            className="w-full h-full object-cover"
          />
        </div>

        {/* ?�카?��? 기본 ?�보 */}
        <div className="flex-1 space-y-2">
          <h1 className="text-2xl font-bold">{demoAcademy.name}</h1>
          {demoAcademy.slogan && (
            <p className="text-lg text-emerald-600 font-medium">
              {demoAcademy.slogan}
            </p>
          )}
          {demoAcademy.intro && (
            <p className="text-gray-600">{demoAcademy.intro}</p>
          )}
          <div className="text-sm text-gray-500 space-y-1">
            {demoAcademy.location && <p>?�� {demoAcademy.location}</p>}
            {demoAcademy.contact && <p>?�️ {demoAcademy.contact}</p>}
            {demoAcademy.website && (
              <p>
                ?��{" "}
                <a
                  href={demoAcademy.website}
                  target="_blank"
                  className="text-blue-600 underline"
                >
                  {demoAcademy.website}
                </a>
              </p>
            )}
            {demoAcademy.sns && <p>?�� {demoAcademy.sns}</p>}
          </div>
        </div>

        {/* 문의 & 관�?버튼 */}
        <div className="flex gap-2 mt-4 sm:mt-0">
          <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
            문의?�기
          </button>
          <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            ?�로??관�?          </button>
        </div>
      </div>

      {/* 강좌 목록 */}
      <section>
        <h2 id="courses" className="text-xl font-bold mb-4">?�� 개설 강좌</h2>
        {demoAcademy.courses && demoAcademy.courses.length > 0 ? (
          <div className="grid gap-4">
            {demoAcademy.courses.map((course) => (
              <div
                key={course.id}
                className="border rounded-xl p-4 bg-white shadow hover:shadow-md transition"
              >
                <h3 className="font-semibold text-lg">{course.title}</h3>
                <p className="text-gray-600 text-sm">{course.description}</p>
                <div className="text-sm text-gray-500 mt-2 space-y-1">
                  <p>?��?��?코치: {course.coach}</p>
                  <p>
                    ?�� {course.startDate} ~ {course.endDate}
                  </p>
                  <p>?�� ?�원: {course.capacity}�?/p>
                  <p>?�� ?�강�? {course.fee}</p>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    ?�강 ?�청
                  </button>
                  <Link
                    to={`/academy/${demoAcademy.id}/courses/${course.id}`}
                    className="flex-1 py-2 text-center bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    ?�세보기
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">?�직 개설??강좌가 ?�습?�다.</p>
        )}
      </section>

      {/* ?�� 공�??�항 */}
      <section>
        <h2 className="text-xl font-bold mt-8 mb-4">?�� 공�??�항</h2>
        {demoAcademy.notices && demoAcademy.notices.length > 0 ? (
          <div className="bg-white rounded-xl shadow p-6">
            <ul className="space-y-3">
              {demoAcademy.notices.map((notice: any) => (
                <li key={notice.id} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-b-0">
                  <span className="text-gray-800 font-medium">{notice.title}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{notice.date}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-gray-500">?�록??공�?가 ?�습?�다.</p>
          </div>
        )}
      </section>

      {/* ?�� ?�진�?*/}
      <section>
        <h2 className="text-xl font-bold mt-8 mb-4">?�� ?�진�?/h2>
        {demoAcademy.photos && demoAcademy.photos.length > 0 ? (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {demoAcademy.photos.map((url: string, idx: number) => (
                <div key={idx} className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <img 
                    src={url} 
                    alt={`${demoAcademy.name} ?�진 ${idx + 1}`} 
                    className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='200' y='150' text-anchor='middle' font-size='24' fill='%236b7280'%3E?��%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  {/* ?�버 ???��? ?�이�?*/}
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
            
            {/* ?�진�??�내 메시지 */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                ?�� ?�련 ?�면, ?�체 ?�진, ?�상 기록 ???�카?��????�생??모습???�인?�세??
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <div className="text-6xl mb-4">?��</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">?�진첩이 준�?중입?�다</h3>
            <p className="text-gray-600 mb-6">
              ?�카?��????�련 ?�면, ?�체 ?�진, ?�상 기록 ??br />
              ?�생??모습??�?만나보실 ???�습?�다!
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
              <span className="bg-gray-100 px-3 py-1 rounded-full">?��?�♂�??�련 ?�면</span>
              <span className="bg-gray-100 px-3 py-1 rounded-full">?��?�👩‍�??�체 ?�진</span>
              <span className="bg-gray-100 px-3 py-1 rounded-full">?�� ?�상 기록</span>
              <span className="bg-gray-100 px-3 py-1 rounded-full">?�� ?�사 ?�진</span>
            </div>
          </div>
        )}
      </section>

      {/* �??��?�??�기 */}
      <section>
        <h2 className="text-xl font-bold mt-8 mb-4">�??��?�??�기</h2>
        {demoAcademy.reviews && demoAcademy.reviews.length > 0 ? (
          <div className="space-y-4">
            {demoAcademy.reviews.map((review: any) => (
              <div key={review.id} className="bg-white rounded-xl shadow p-6 border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-800">{review.parent}</h4>
                    <div className="flex items-center mt-1">
                      <div className="text-yellow-500 text-lg">
                        {"�?.repeat(review.rating)}
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
            
            {/* ?�기 ?�계 */}
            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl p-4 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800">?�체 ?�점</h4>
                  <div className="flex items-center mt-1">
                    <div className="text-yellow-500 text-xl">
                      {"�?.repeat(5)}
                    </div>
                    <span className="ml-2 text-lg font-bold text-gray-800">4.7/5</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">�?{demoAcademy.reviews.length}�??�기</p>
                  <p className="text-xs text-gray-500">?�제 ?��?모님?�의 ?�생???�기</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <div className="text-6xl mb-4">�?/div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">?�직 ?�록???�기가 ?�습?�다</h3>
            <p className="text-gray-600 mb-6">
              �?번째 ?�기�??�겨주세??<br />
              ?��?모님?�의 ?�중???�견???�카?��? 발전???��????�니??
            </p>
            <button className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors">
              ?�기 ?�성?�기
            </button>
          </div>
        )}
      </section>

      {/* ?�스???�내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">?�� ?�스??모드</h3>
        <p className="text-blue-700 text-sm">
          ?�재 ?��? ?�이?��? ?�용?�여 ?�카?��? ?�세?�이지�??�스?�하�??�습?�다.
          ?�제 Firestore ?�동?� 추후 구현 ?�정?�니??
        </p>
      </div>
    </div>
  );
}
