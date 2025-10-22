import React from 'react';
import { Plus, Search, Filter } from 'lucide-react';

interface HeroQuickFunnelProps {
  onCreateMeetup?: () => void;
  onSearch?: () => void;
  onFilter?: () => void;
}

export function HeroQuickFunnel({ onCreateMeetup, onSearch, onFilter }: HeroQuickFunnelProps) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">
          함께하는 스포츠 모임
        </h1>
        <p className="text-xl mb-8 text-blue-100">
          같은 관심사를 가진 사람들과 만나 새로운 경험을 시작해보세요
        </p>
        
        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onCreateMeetup}
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            모임 만들기
          </button>
          
          <button
            onClick={onSearch}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-400 transition-colors flex items-center gap-2 border border-blue-400"
          >
            <Search className="w-5 h-5" />
            모임 찾기
          </button>
          
          <button
            onClick={onFilter}
            className="bg-transparent text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:bg-opacity-20 transition-colors flex items-center gap-2 border border-white"
          >
            <Filter className="w-5 h-5" />
            필터
          </button>
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">150+</div>
            <div className="text-blue-200">활성 모임</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">2,500+</div>
            <div className="text-blue-200">참여자</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">12</div>
            <div className="text-blue-200">스포츠 종목</div>
          </div>
        </div>
      </div>
    </div>
  );
}
