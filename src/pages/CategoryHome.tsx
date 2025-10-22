import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQueryParam } from "@/lib/useQuery";
import { CATEGORIES } from "@/constants/categories";
import { useColQueryRT } from "@/lib/useColQueryRT";
import { where, orderBy, arrayContains, collection, query, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CardSkeleton, EmptyState } from "@/components/common/Skeleton";
import ActionBar from "@/components/category/ActionBar";
import { ROLE_TABS } from "@/constants/roles";
import { getSavedRole, saveRole, type Role } from "@/lib/role";
import CreateModal from "@/components/modals/CreateModal";
import MarketFilterBar from "@/components/filter/MarketFilterBar";
import InfiniteSentinel from "@/components/common/InfiniteSentinel";
import { Badge, priceKRW } from "@/components/common/Badge";
import Tooltip from "@/components/common/Tooltip";
import EventCalendar from "@/components/events/EventCalendar";
import { startOfMonth, endOfMonth, addMonths } from "@/lib/date";
import BookingModal from "@/components/modals/BookingModal";
import SlotSelectionModal from "@/components/modals/SlotSelectionModal";

const TABS = [
  { key: "market",     label: "마켓" },
  { key: "clubs",      label: "모임" },
  { key: "jobs",       label: "구인·구직" },
  { key: "events",     label: "경기/이벤트" },
  { key: "facilities", label: "시설/체관" },
  { key: "admin",      label: "관리/정보" },
] as const;

export default function CategoryHome() {
  const { cat = "" } = useParams();
  const tab = useQueryParam("tab", "market");
  const region = useQueryParam("region", "KR");
  const rawRole = (useQueryParam("role","") as Role) || getSavedRole();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const catInfo = CATEGORIES.find(c => c.key === cat);
  const myRole: Role = rawRole;
  
  // 권한에 따라 사용자에게 보여줄 탭만 필터링
  const visibleTabs = TABS.filter(t => (ROLE_TABS[myRole] || []).includes(t.key as any));
  
  const changeTab = (k: string) => nav(`/c/${cat}?tab=${k}&region=${region}&role=${myRole}`);

  // 권한 가진 사용자의 URL 직접 진입 시 권한 없는 탭으로 리다이렉트
  useEffect(() => {
    const allowed = (ROLE_TABS[myRole] || []);
    if (!allowed.includes(tab as any) && allowed.length) {
      nav(`/c/${cat}?tab=${allowed[0]}&region=${region}&role=${myRole}`, { replace: true });
    }
  }, [tab, myRole, cat, region, nav]);

  // 역할 변경 시 저장
  useEffect(() => {
    if (rawRole) saveRole(rawRole);
  }, [rawRole]);

  // 데이터 로딩 - 쿼리를 useMemo로 고정
  const collectionName = useMemo(() => 
    tab === "market" ? "products" : 
    tab === "clubs" ? "groups" : 
    tab === "jobs" ? "jobs" : 
    tab === "events" ? "events" : 
    tab === "facilities" ? "facilities" : "admin",
    [tab]
  );

  const q = useMemo(() => query(
    collection(db, collectionName),
    where("categoryId", "==", cat),
    where("region", "==", region),
    orderBy("createdAt", "desc"),
    limit(20)
  ), [collectionName, cat, region]);

  const { data: items, loading, error } = useColQueryRT(q);

  // 이벤트 캘린더 데이터
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  useEffect(() => {
    if (tab === "events") {
      setCalendarLoading(true);
      const start = startOfMonth(new Date());
      const end = endOfMonth(addMonths(new Date(), 1));
      
      const q = query(
        collection(db, "events"),
        where("categoryId", "==", cat),
        where("region", "==", region),
        where("date", ">=", start),
        where("date", "<=", end),
        orderBy("date", "asc")
      );
      
      getDocs(q).then(snapshot => {
        const events = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCalendarData(events);
        setCalendarLoading(false);
      }).catch(() => {
        setCalendarLoading(false);
      });
    }
  }, [tab, cat, region]);

  // 모달 상태
  const [bookingModal, setBookingModal] = useState<{open: boolean, facilityId?: string}>({open: false});
  const [slotModal, setSlotModal] = useState<{open: boolean, facilityId?: string, date?: string}>({open: false});

  const handleBooking = (facilityId: string) => {
    setBookingModal({open: true, facilityId});
  };

  const handleSlotSelection = (facilityId: string, date: string) => {
    setSlotModal({open: true, facilityId, date});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {catInfo?.emoji} {catInfo?.name}
              </h1>
              <p className="mt-2 text-gray-600">
                {catInfo?.description}
              </p>
            </div>
            <ActionBar 
              category={cat} 
              role={myRole}
              onCreate={() => setOpen(true)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 탭 네비게이션 */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {visibleTabs.map((t) => (
              <button
                key={t.key}
                onClick={() => changeTab(t.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  tab === t.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 필터 바 */}
        {tab === "market" && (
          <MarketFilterBar 
            category={cat}
            region={region}
            onRegionChange={(newRegion) => nav(`/c/${cat}?tab=${tab}&region=${newRegion}&role=${myRole}`)}
          />
        )}

        {/* 콘텐츠 영역 */}
        <div className="space-y-6">
          {tab === "events" ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">이벤트 캘린더</h2>
              {calendarLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <EventCalendar 
                  events={calendarData}
                  onEventClick={(event) => {
                    // 이벤트 상세 페이지로 이동
                    nav(`/events/${event.id}`);
                  }}
                />
              )}
            </div>
          ) : (
            <>
              {/* 아이템 목록 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading && items.length === 0 ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))
                ) : items.length === 0 ? (
                  <div className="col-span-full">
                    <EmptyState 
                      title="아직 등록된 항목이 없습니다"
                      description="첫 번째 항목을 등록해보세요"
                      action={
                        <button
                          onClick={() => setOpen(true)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                          등록하기
                        </button>
                      }
                    />
                  </div>
                ) : (
                  items.map((item: any) => (
                    <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                      {item.images && item.images[0] && (
                        <img 
                          src={item.images[0]} 
                          alt={item.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {item.description}
                        </p>
                        
                        {tab === "market" && item.price && (
                          <div className="mb-3">
                            <Badge variant="price">
                              {priceKRW(item.price)}
                            </Badge>
                          </div>
                        )}
                        
                        {tab === "facilities" && (
                          <div className="mb-3">
                            <button
                              onClick={() => handleBooking(item.id)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                            >
                              예약하기
                            </button>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>{item.location || item.region}</span>
                          <span>{new Date(item.createdAt?.toDate?.() || item.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 무한 스크롤 */}
              {hasMore && (
                <InfiniteSentinel onIntersect={loadMore} />
              )}
            </>
          )}
        </div>
      </div>

      {/* 모달들 */}
      <CreateModal 
        open={open}
        onClose={() => setOpen(false)}
        category={cat}
        tab={tab}
      />

      <BookingModal
        open={bookingModal.open}
        onClose={() => setBookingModal({open: false})}
        facilityId={bookingModal.facilityId}
        onSlotSelect={handleSlotSelection}
      />

      <SlotSelectionModal
        open={slotModal.open}
        onClose={() => setSlotModal({open: false})}
        facilityId={slotModal.facilityId}
        date={slotModal.date}
      />
    </div>
  );
}