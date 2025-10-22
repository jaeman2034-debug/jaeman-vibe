import { useState, useEffect } from 'react';
import { Meetup, MeetupFilter, MeetupsQuery, Sport, Branch, Leaf } from '@/types/meetups';

// Mock data for development with hierarchical structure
const mockMeetups: Meetup[] = [
  {
    id: '1',
    title: '의정부 FC 풋살 모임',
    description: '주 2회 풋살 모임입니다. 초보자도 환영합니다!',
    sport: 'soccer',
    branch: 'scrimmage',
    leaf: '5v5',
    leafCode: 'soccer-scrimmage-5v5',
    region: '의정부/송산2동',
    date: '2024-01-15',
    time: '19:00',
    maxParticipants: 10,
    currentParticipants: 7,
    price: 5000,
    location: {
      name: '송산체육공원',
      address: '경기도 의정부시 송산동',
      coordinates: { lat: 37.7381, lng: 127.0474 }
    },
    organizer: {
      id: 'user1',
      name: '김민수',
      avatar: 'https://via.placeholder.com/40'
    },
    images: ['https://via.placeholder.com/300x200'],
    tags: ['풋살', '초보환영', '정기모임'],
    status: 'upcoming',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z'
  },
  {
    id: '2',
    title: '농구 동호회 모임',
    description: '매주 토요일 농구 모임입니다.',
    sport: 'basketball',
    branch: 'scrimmage',
    leaf: '5v5',
    leafCode: 'basketball-scrimmage-5v5',
    region: '의정부/의정부동',
    date: '2024-01-13',
    time: '14:00',
    maxParticipants: 12,
    currentParticipants: 12,
    price: 3000,
    location: {
      name: '의정부시민체육관',
      address: '경기도 의정부시 의정부동',
      coordinates: { lat: 37.7381, lng: 127.0474 }
    },
    organizer: {
      id: 'user2',
      name: '박지훈',
      avatar: 'https://via.placeholder.com/40'
    },
    images: ['https://via.placeholder.com/300x200'],
    tags: ['농구', '토요일', '동호회'],
    status: 'upcoming',
    createdAt: '2024-01-08T15:30:00Z',
    updatedAt: '2024-01-08T15:30:00Z'
  },
  {
    id: '3',
    title: '테니스 초보자 모임',
    description: '테니스를 처음 시작하는 분들을 위한 모임입니다.',
    sport: 'tennis',
    branch: 'academy',
    leaf: '입문반',
    leafCode: 'tennis-academy-beginner',
    region: '의정부/장암동',
    date: '2024-01-20',
    time: '10:00',
    maxParticipants: 8,
    currentParticipants: 3,
    price: 8000,
    location: {
      name: '장암테니스장',
      address: '경기도 의정부시 장암동',
      coordinates: { lat: 37.7381, lng: 127.0474 }
    },
    organizer: {
      id: 'user3',
      name: '이수진',
      avatar: 'https://via.placeholder.com/40'
    },
    images: ['https://via.placeholder.com/300x200'],
    tags: ['테니스', '초보자', '주말'],
    status: 'upcoming',
    createdAt: '2024-01-12T09:15:00Z',
    updatedAt: '2024-01-12T09:15:00Z'
  },
  {
    id: '4',
    title: '축구 아카데미 U12',
    description: '12세 이하 어린이를 위한 축구 아카데미입니다.',
    sport: 'soccer',
    branch: 'academy',
    leaf: 'U12',
    leafCode: 'soccer-academy-u12',
    region: '의정부/신곡동',
    date: '2024-01-18',
    time: '16:00',
    maxParticipants: 15,
    currentParticipants: 12,
    price: 15000,
    location: {
      name: '신곡체육공원',
      address: '경기도 의정부시 신곡동',
      coordinates: { lat: 37.7381, lng: 127.0474 }
    },
    organizer: {
      id: 'user4',
      name: '최영수',
      avatar: 'https://via.placeholder.com/40'
    },
    images: ['https://via.placeholder.com/300x200'],
    tags: ['축구', '아카데미', 'U12'],
    status: 'upcoming',
    createdAt: '2024-01-14T11:20:00Z',
    updatedAt: '2024-01-14T11:20:00Z'
  },
  {
    id: '5',
    title: '여성전용 농구 모임',
    description: '여성만을 위한 농구 모임입니다.',
    sport: 'basketball',
    branch: 'women_teams',
    leaf: '여성전용',
    leafCode: 'basketball-women-only',
    region: '의정부/금오동',
    date: '2024-01-16',
    time: '19:30',
    maxParticipants: 10,
    currentParticipants: 6,
    price: 4000,
    location: {
      name: '금오체육관',
      address: '경기도 의정부시 금오동',
      coordinates: { lat: 37.7381, lng: 127.0474 }
    },
    organizer: {
      id: 'user5',
      name: '김지영',
      avatar: 'https://via.placeholder.com/40'
    },
    images: ['https://via.placeholder.com/300x200'],
    tags: ['농구', '여성전용', '정기모임'],
    status: 'upcoming',
    createdAt: '2024-01-11T14:45:00Z',
    updatedAt: '2024-01-11T14:45:00Z'
  }
];

// 기존 useMeetupsFeed (호환성 유지)
export function useMeetupsFeed(initialFilter?: MeetupFilter) {
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<MeetupFilter>(initialFilter || {});

  useEffect(() => {
    loadMeetups();
  }, [filter]);

  const loadMeetups = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredMeetups = [...mockMeetups];
      
      // Apply filters
      if (filter.sport) {
        filteredMeetups = filteredMeetups.filter(meetup => meetup.sport === filter.sport);
      }
      
      if (filter.region) {
        filteredMeetups = filteredMeetups.filter(meetup => meetup.region === filter.region);
      }
      
      if (filter.date) {
        filteredMeetups = filteredMeetups.filter(meetup => meetup.date === filter.date);
      }
      
      if (filter.priceRange) {
        filteredMeetups = filteredMeetups.filter(meetup => 
          meetup.price >= filter.priceRange!.min && meetup.price <= filter.priceRange!.max
        );
      }
      
      if (filter.status) {
        filteredMeetups = filteredMeetups.filter(meetup => meetup.status === filter.status);
      }
      
      setMeetups(filteredMeetups);
    } catch (err) {
      setError(err instanceof Error ? err.message : '모임을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (newFilter: Partial<MeetupFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  };

  const clearFilter = () => {
    setFilter({});
  };

  return {
    meetups,
    loading,
    error,
    filter,
    updateFilter,
    clearFilter,
    refetch: loadMeetups
  };
}

// 새로운 계층형 쿼리 지원 훅
export function useMeetupsFeedHierarchical(initialQuery?: MeetupsQuery) {
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<MeetupsQuery>(initialQuery || {
    sport: 'all',
    branch: 'all',
    leaf: 'all',
    search: '',
    sortBy: 'recommended'
  });

  useEffect(() => {
    loadMeetups();
  }, [query]);

  const loadMeetups = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredMeetups = [...mockMeetups];
      
      // Apply hierarchical filters
      if (query.sport && query.sport !== 'all') {
        filteredMeetups = filteredMeetups.filter(meetup => meetup.sport === query.sport);
      }
      
      if (query.branch && query.branch !== 'all') {
        filteredMeetups = filteredMeetups.filter(meetup => meetup.branch === query.branch);
      }
      
      if (query.leaf && query.leaf !== 'all') {
        filteredMeetups = filteredMeetups.filter(meetup => meetup.leaf === query.leaf);
      }
      
      if (query.region) {
        filteredMeetups = filteredMeetups.filter(meetup => meetup.region === query.region);
      }
      
      if (query.date) {
        filteredMeetups = filteredMeetups.filter(meetup => meetup.date === query.date);
      }
      
      if (query.priceRange) {
        filteredMeetups = filteredMeetups.filter(meetup => 
          meetup.price >= query.priceRange!.min && meetup.price <= query.priceRange!.max
        );
      }
      
      if (query.status) {
        filteredMeetups = filteredMeetups.filter(meetup => meetup.status === query.status);
      }
      
      if (query.search) {
        const searchLower = query.search.toLowerCase();
        filteredMeetups = filteredMeetups.filter(meetup => 
          meetup.title.toLowerCase().includes(searchLower) || 
          meetup.description.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply sorting
      if (query.sortBy) {
        switch (query.sortBy) {
          case 'time':
            filteredMeetups.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            break;
          case 'popularity':
            filteredMeetups.sort((a, b) => b.currentParticipants - a.currentParticipants);
            break;
          case 'recommended':
          default:
            // 기본 정렬: 최신순
            filteredMeetups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
        }
      }
      
      setMeetups(filteredMeetups);
    } catch (err) {
      setError(err instanceof Error ? err.message : '모임을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const updateQuery = (newQuery: Partial<MeetupsQuery>) => {
    setQuery(prev => ({ ...prev, ...newQuery }));
  };

  const clearQuery = () => {
    setQuery({
      sport: 'all',
      branch: 'all',
      leaf: 'all',
      search: '',
      sortBy: 'recommended'
    });
  };

  return {
    meetups,
    loading,
    error,
    query,
    updateQuery,
    clearQuery,
    refetch: loadMeetups
  };
}
