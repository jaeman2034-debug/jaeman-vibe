import { useEffect, useState } from "react";
import FlowNext from "@/components/FlowNext";
import AppLayout from "@/components/layout/AppLayout";
import JobCard from "@/components/jobs/JobCard";

export default function JobsPage() {
  const [jobs, setJobs] = useState([
    {
      id: 1,
      title: "축구장 관리 보조",
      company: "송산체육공원",
      region: "송산2동",
      type: "아르바이트",
      pay: { type: "hour", amount: 9000 },
      description: "축구장 청소 및 관리 업무를 도와주실 분을 찾습니다.",
      requirements: "체력이 좋으신 분",
      postedAt: "2일 전"
    },
    {
      id: 2,
      title: "스포츠 용품 매장 판매원",
      company: "스포츠월드",
      region: "송산2동",
      type: "정규직",
      pay: { type: "month", amount: 2500000 },
      description: "스포츠 용품 매장에서 고객 상담 및 판매 업무",
      requirements: "고등학교 졸업 이상, 고객 서비스 경험 우대",
      postedAt: "1일 전"
    },
    {
      id: 3,
      title: "헬스장 트레이너",
      company: "송산피트니스",
      region: "송산2동",
      type: "파트타임",
      pay: { type: "hour", amount: 15000 },
      description: "헬스장에서 회원님들의 운동 지도를 도와주실 분",
      requirements: "헬스 트레이너 자격증 보유자",
      postedAt: "3일 전"
    }
  ]);

  return (
    <AppLayout>
      <FlowNext />
      <div className="mx-auto max-w-screen-sm p-4 pb-24">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">스포츠 일자리</h1>
          <p className="text-gray-600">스포츠 관련 일자리를 찾아보세요</p>
        </div>

        {/* 필터 고정 + 정렬 */}
        <div className="sticky top-14 z-30 bg-white/90 dark:bg-zinc-950/80 backdrop-blur border-b">
          <div className="mx-auto max-w-6xl px-4 py-2 flex gap-2">
            {/* 기존 검색/타입칩 유지 */}
            <div className="flex flex-wrap gap-2">
              {["전체", "정규직", "아르바이트", "파트타임", "계약직"].map((type) => (
                <button
                  key={type}
                  className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
                >
                  {type}
                </button>
              ))}
            </div>
            <select className="ml-auto px-3 py-2 rounded-xl border text-sm">
              <option>최신순</option>
              <option>마감임박</option>
              <option>급여순</option>
            </select>
          </div>
        </div>

        {/* 검색 */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border p-3"
              placeholder="직무명 또는 회사명 검색"
            />
            <button className="rounded-lg bg-blue-600 text-white px-6 py-3">
              검색
            </button>
          </div>
        </div>

      {/* 일자리 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {/* 새 일자리 등록 FAB */}
      <button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-orange-500 text-white text-2xl shadow-lg hover:bg-orange-600 transition-colors"
        aria-label="새 일자리 등록"
      >
        +
      </button>
      </div>
    </AppLayout>
  );
}
