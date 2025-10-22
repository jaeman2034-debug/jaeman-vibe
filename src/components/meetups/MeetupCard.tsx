import React from 'react';
import { Meetup } from '@/types/meetups';
import { MapPin, Users, Clock, Calendar, Tag } from 'lucide-react';
import { SPORT_LABEL, BRANCH_LABEL } from '@/constants/taxonomy';
import { useSaves } from '@/hooks/useSaves';
import { shareOrCopy } from '@/utils/ui';

interface MeetupCardProps {
  meetup: Meetup;
  onClick?: () => void;
}

export function MeetupCard({ meetup, onClick }: MeetupCardProps) {
  const { isSaved, toggle } = useSaves();
  
  const formatPrice = (price: number) => {
    return price === 0 ? '무료' : `${price.toLocaleString()}원`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '예정';
      case 'ongoing':
        return '진행중';
      case 'completed':
        return '완료';
      case 'cancelled':
        return '취소';
      default:
        return status;
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative">
        <img
          src={meetup.images[0] || 'https://via.placeholder.com/300x200'}
          alt={meetup.title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <div className="absolute top-2 right-2 flex gap-1">
          <button 
            aria-label="공유" 
            onClick={(e) => {
              e.stopPropagation(); 
              shareOrCopy({ 
                title: meetup.title, 
                url: location.origin + '/meetups/' + meetup.id 
              });
            }}
            className="px-2 py-1 rounded-lg bg-white/80 dark:bg-zinc-900/70 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
          >
            🔗
          </button>
          <button 
            aria-label="저장" 
            onClick={(e) => {
              e.stopPropagation(); 
              toggle(`meetup:${meetup.id}`, {
                title: meetup.title,
                type: 'meetup',
                sport: meetup.sport,
                location: meetup.location.name
              });
            }}
            className={`px-2 py-1 rounded-lg transition-colors ${
              isSaved(`meetup:${meetup.id}`) 
                ? 'bg-yellow-400 text-black' 
                : 'bg-white/80 dark:bg-zinc-900/70 hover:bg-white dark:hover:bg-zinc-800'
            }`}
          >
            ⭐
          </button>
        </div>
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(meetup.status)}`}>
            {getStatusText(meetup.status)}
          </span>
        </div>
        <div className="absolute bottom-2 right-2">
          <span className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm font-medium">
            {formatPrice(meetup.price)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
          {meetup.title}
        </h3>
        
        {/* 계층형 분류 정보 표시 */}
        {(meetup.branch || meetup.leaf) && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-blue-600 font-medium">
              {SPORT_LABEL[meetup.sport]}
            </span>
            {meetup.branch && meetup.branch !== 'all' && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-xs text-gray-600">
                  {BRANCH_LABEL[meetup.branch]}
                </span>
              </>
            )}
            {meetup.leaf && meetup.leaf !== 'all' && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-xs text-gray-500">
                  {meetup.leaf}
                </span>
              </>
            )}
          </div>
        )}
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {meetup.description}
        </p>

        {/* Location */}
        <div className="flex items-center text-gray-500 text-sm mb-2">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="truncate">{meetup.location.name}</span>
        </div>

        {/* Date & Time */}
        <div className="flex items-center text-gray-500 text-sm mb-2">
          <Calendar className="w-4 h-4 mr-1" />
          <span>{formatDate(meetup.date)}</span>
          <Clock className="w-4 h-4 ml-3 mr-1" />
          <span>{meetup.time}</span>
        </div>

        {/* Participants */}
        <div className="flex items-center text-gray-500 text-sm mb-3">
          <Users className="w-4 h-4 mr-1" />
          <span>{meetup.currentParticipants}/{meetup.maxParticipants}명</span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {meetup.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </span>
          ))}
          {meetup.tags.length > 3 && (
            <span className="text-xs text-gray-500">
              +{meetup.tags.length - 3}개
            </span>
          )}
        </div>

        {/* Organizer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center">
            <img
              src={meetup.organizer.avatar || 'https://via.placeholder.com/32'}
              alt={meetup.organizer.name}
              className="w-6 h-6 rounded-full mr-2"
            />
            <span className="text-sm text-gray-600">{meetup.organizer.name}</span>
          </div>
          <span className="text-xs text-gray-400">{meetup.region}</span>
        </div>
      </div>
    </div>
  );
}
