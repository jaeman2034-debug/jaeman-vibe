import { useEffect, useState } from "react";
import FlowNext from "@/components/FlowNext";

export default function GroupPage() {
  const [groups, setGroups] = useState([
    {
      id: 1,
      title: "송산2동 축구 모임",
      description: "매주 토요일 오후 2시, 송산체육공원에서 축구를 즐겨요!",
      members: 12,
      maxMembers: 20,
      date: "2024-01-20",
      location: "송산체육공원",
      category: "축구"
    },
    {
      id: 2,
      title: "농구 동호회",
      description: "초보자도 환영! 매주 일요일 오전 10시",
      members: 8,
      maxMembers: 15,
      date: "2024-01-21",
      location: "송산체육관",
      category: "농구"
    },
    {
      id: 3,
      title: "러닝 크루",
      description: "아침 러닝으로 하루를 시작해보세요",
      members: 25,
      maxMembers: 30,
      date: "2024-01-22",
      location: "송산공원",
      category: "러닝"
    }
  ]);

  return (
    <>
      <FlowNext />
      <div className="mx-auto max-w-screen-sm p-4 pb-24">
        {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">스포츠 모임</h1>
        <p className="text-gray-600">함께 운동할 동네 사람들을 만나보세요</p>
      </div>

      {/* 검색 및 필터 */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border p-3"
            placeholder="모임명 또는 키워드 검색"
          />
          <button className="rounded-lg bg-blue-600 text-white px-6 py-3">
            검색
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {["전체", "축구", "농구", "러닝", "테니스", "기타"].map((category) => (
            <button
              key={category}
              className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* 모임 목록 */}
      <div className="space-y-4">
        {groups.map((group) => (
          <div
            key={group.id}
            className="bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{group.title}</h3>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {group.category}
              </span>
            </div>
            
            <p className="text-gray-600 text-sm mb-3">{group.description}</p>
            
            <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
              <span>📍 {group.location}</span>
              <span>📅 {group.date}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-blue-600 font-medium">{group.members}</span>
                <span className="text-gray-500">/{group.maxMembers}명</span>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                참여하기
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 새 모임 만들기 FAB */}
      <button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-orange-500 text-white text-2xl shadow-lg hover:bg-orange-600 transition-colors"
        aria-label="새 모임 만들기"
      >
        +
      </button>
      </div>
    </>
  );
}
