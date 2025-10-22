// routes.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import AppWithAuthGuard from "./AppWithAuthGuard";
import StartPage from "./pages/StartPage";
import StartScreen from "./features/start/StartScreen";
import NewStartScreen from "./pages/StartScreen";
import IndexRedirect from "./routes/IndexRedirect";
import LoginPage from "./pages/LoginPage";
import OpenInBrowser from "./pages/OpenInBrowser";
import DebugUA from "./pages/DebugUA";
import MarketPage from "./pages/market/MarketPage";
import GroupPage from "./pages/GroupPage";
import JobsPage from "./pages/JobsPage";
import AdminPage from "./pages/AdminPage";
import MarketDetailPage from "./pages/market/MarketDetailPage";
import MarketDetail from "./pages/market/MarketDetail";
import EventList from "./pages/events/EventList";
import EventCreate from "./pages/events/EventCreate";
import EventPage from "./pages/events/EventPage";
import EventInfo from "./pages/events/tabs/EventInfo";
import EventCommunity from "./pages/events/tabs/EventCommunity";
import EventManage from "./pages/events/EventManage";
import EventAudit from "./pages/events/EventAudit";
import EventCheckin from "./pages/events/EventCheckin";
import CheckinPage from "./pages/events/Checkin";
import PayReturn from "./pages/PayReturn";
import Ticket from "./pages/Ticket";
import StaffScan from "./pages/StaffScan";
import Pass from "./pages/events/Pass";
import Scan from "./pages/events/Scan";
import CounterBoard from "./pages/events/CounterBoard";
import TimelineBoard from "./pages/events/TimelineBoard";
import MatchesBoard from "./pages/events/MatchesBoard";
import CourtsBoard from "./pages/events/CourtsBoard";
import RefPad from "./pages/events/RefPad";
import LiveBoard from "./pages/events/LiveBoard";
import EventAnalytics from "./pages/events/EventAnalytics";
import EventPayments from "./pages/events/EventPayments";
import LogsDashboard from "./pages/events/LogsDashboard";
import ManageTab from "./components/manage/ManageTab";
import PaySuccess from "./pages/pay/Success";
import PayFail from "./pages/pay/Fail";
import Checkout from "./pages/pay/Checkout";
import ErrorBoundary from "./routes/ErrorBoundary";
import Revenue from "./pages/admin/Revenue";
import MonthlySettlement from "./pages/admin/MonthlySettlement";
import NotificationsSettings from "./pages/settings/NotificationsSettings";
import MarketEditPage from "./pages/market/MarketEditPage";
import MarketNewPage from "./pages/market/MarketNewPage";
import MarketNew3Set from "./pages/market/MarketNew3Set";
import MarketLayout from "./features/market/MarketLayout";
import ChatList from "./pages/chat/ChatList";
import ChatRoom from "./pages/chat/ChatRoom";
import { ApplicationMakerPage } from "./screens/jobs/ApplicationMakerPage";
import AdminKPICharts from "./screens/admin/AdminKPICharts";
import MeetupsPage from "./pages/meet/MeetupsPage";
import MeetupsHubPage from "./pages/meetups/MeetupsHubPage";
import MeetupCreatePage from "./screens/meetups/MeetupCreatePage";
import MeetupDetailPage from "./screens/meetups/MeetupDetailPage";
import BenchPage from "./screens/meetups/BenchPage";
import ClubListPage from "./screens/clubs/ClubListPage";
import ClubDetailPage from "./screens/clubs/ClubDetailPage";
import ClubAdminPage from "./screens/clubs/ClubAdminPage";
import ClubBlogIndex from "./blog/ClubBlogIndex";
import ClubBlogPost from "./blog/ClubBlogPost";
import ClubBlogNew from "./blog/ClubBlogNew";
import AcademyList from "./screens/academy/AcademyList";
import AcademyAdmin from "./screens/academy/AcademyAdmin";
import AcademyAttendance from "./screens/academy/AcademyAttendance";
import JoinSuccessPage from "./pages/JoinSuccessPage";
import JoinFailPage from "./pages/JoinFailPage";
import SubscriptionSuccessPage from "./pages/SubscriptionSuccessPage";
import SubscriptionCancelPage from "./pages/SubscriptionCancelPage";
import SmartPaymentPage from "./payment/SmartPaymentPage";
import BillingSuccessPage from "./pages/BillingSuccessPage";
import BillingFailPage from "./pages/BillingFailPage";
import BillingRegisterPage from "./pages/BillingRegisterPage";
import SavesPage from "./pages/SavesPage";
import MeetupAdminScannerPage from "./pages/meetups/MeetupAdminScannerPage";
import { PaymentSuccess, PaymentFail } from "./pages/meetups/PaymentReturn";
import AcceptInvite from "./pages/invite/AcceptInvite";
import MyTicketsPage from "./pages/me/MyTicketsPage";
import MeetupAttendeesPage from "./pages/manage/MeetupAttendeesPage";
import MeetupCapacityPage from "./pages/manage/MeetupCapacityPage";
import MeetupBucketsEditorPage from "./pages/manage/MeetupBucketsEditorPage";
import CheckinScannerPage from "./pages/manage/CheckinScannerPage";
import MeetupLiveOpsPage from "./pages/manage/MeetupLiveOpsPage";
import MeetupKioskPage from "./pages/manage/MeetupKioskPage";
import MeetupPublishPage from "./pages/manage/MeetupPublishPage";
import MeetupRoiPage from "./pages/manage/MeetupRoiPage";
import MeetupRoiCostsPage from "./pages/manage/MeetupRoiCostsPage";
import TeamDetailPage from "./pages/teams/TeamDetailPage";
import TeamManagePage from "./pages/manage/TeamManagePage";
import FixtureAssignPage from "./pages/manage/FixtureAssignPage";
import FixtureReportPage from "./pages/manage/FixtureReportPage";
import DivisionTablePage from "./pages/divisions/DivisionTablePage";
import OfficialAvailabilityPage from "./pages/manage/OfficialAvailabilityPage";
import AutoAssignPage from "./pages/manage/AutoAssignPage";
import PayoutsPage from "./pages/manage/PayoutsPage";
import ProfileEditPage from "./pages/me/ProfileEditPage";

export const router = createBrowserRouter([
  // ✅ 진입 시 스타트/마켓으로 보내는 라우트
  { path: "/", element: <IndexRedirect /> },
  
  // ✅ 스타트 페이지 (인증 상태 확인 후 리다이렉트)
  { path: "/auth", element: <StartPage /> },
  
  // ✅ 새로운 스타트 스크린
  { path: "/start", element: <NewStartScreen /> },
  
  // ✅ 브라우저에서 열기 페이지
  { path: "/open-in-browser", element: <OpenInBrowser /> },
  
  // ✅ 디버그 페이지 (개발용)
  { path: "/debug-ua", element: <DebugUA /> },
  
  // ✅ 기존 음성 중심 스타트 스크린 (백업)
  { path: "/voice-start", element: <StartScreen /> },
  
  // ✅ /market 경로를 직접 처리
  { path: "/market", element: <MarketPage /> },
  { path: "/market/new", element: <MarketNewPage /> },
  { path: "/market/:id", element: <MarketDetail /> },
  { path: "/market/:id/edit", element: <MarketEditPage /> },
  
  // ✅ /meetups 경로 추가
  { path: "/meetups", element: <MeetupsHubPage /> },
  { path: "/meetups/new", element: <MeetupCreatePage /> },
  { path: "/meetups/:id", element: <MeetupDetailPage /> },
  { path: "/meetups/:id/bench", element: <BenchPage /> },
  
  // ✅ 주최자 관리 경로 추가
  { path: "/manage/meetups/:id/scanner", element: <MeetupAdminScannerPage /> },
  
  // ✅ 결제 관련 경로 추가
  { path: "/payments/success", element: <PaymentSuccess /> },
  { path: "/payments/fail", element: <PaymentFail /> },
  
  // ✅ 초대 관련 경로 추가
  { path: "/invite", element: <AcceptInvite /> },
  
  // ✅ /clubs 경로 추가
  { path: "/clubs", element: <ClubListPage /> },
  { path: "/clubs/:id", element: <ClubDetailPage /> },
  { path: "/clubs/:id/admin", element: <ClubAdminPage /> },
          { path: "/clubs/:clubId/blog", element: <ClubBlogIndex /> },
          { path: "/clubs/:clubId/blog/new", element: <ClubBlogNew /> },
          { path: "/clubs/:clubId/blog/:slug", element: <ClubBlogPost /> },
  { path: "/clubs/:clubId/manage/meetups/:id/attendees", element: <MeetupAttendeesPage /> },
  { path: "/clubs/:clubId/manage/meetups/:id/capacity", element: <MeetupCapacityPage /> },
  { path: "/clubs/:clubId/manage/meetups/:id/buckets", element: <MeetupBucketsEditorPage /> },
  { path: "/clubs/:clubId/manage/meetups/:id/scan", element: <CheckinScannerPage /> },
  { path: "/clubs/:clubId/manage/meetups/:id/live", element: <MeetupLiveOpsPage /> },
  { path: "/clubs/:clubId/manage/meetups/:id/kiosk", element: <MeetupKioskPage /> },
  { path: "/clubs/:clubId/manage/meetups/:id/publish", element: <MeetupPublishPage /> },
  { path: "/clubs/:clubId/manage/meetups/:id/roi", element: <MeetupRoiPage /> },
  { path: "/clubs/:clubId/manage/meetups/:id/roi/costs", element: <MeetupRoiCostsPage /> },
  
  // 팀 관련 라우트
  { path: "/clubs/:clubId/teams/:teamId", element: <TeamDetailPage /> },
  { path: "/clubs/:clubId/manage/teams/:teamId", element: <TeamManagePage /> },
  
  // 심판/리포트/순위 라우트
  { path: "/clubs/:clubId/manage/fixtures/:id/assign", element: <FixtureAssignPage /> },
  { path: "/clubs/:clubId/manage/fixtures/:id/report", element: <FixtureReportPage /> },
  { path: "/clubs/:clubId/divisions/:div/table", element: <DivisionTablePage /> },
  
  // 가용성/자동배정/수당 라우트
  { path: "/clubs/:clubId/manage/officials/availability", element: <OfficialAvailabilityPage /> },
  { path: "/clubs/:clubId/manage/fixtures/auto-assign", element: <AutoAssignPage /> },
  { path: "/clubs/:clubId/manage/payouts", element: <PayoutsPage /> },
  
  // ✅ /academies 경로 추가
  { path: "/academies", element: <AcademyList /> },
  { path: "/academies/:id/admin", element: <AcademyAdmin /> },
  { path: "/academies/:id/attendance", element: <AcademyAttendance /> },
  
  // ✅ 레거시 → 신규로 리다이렉트
  { path: "/app/group", element: <Navigate to="/meetups" replace /> },
  { path: "/app/meetups", element: <Navigate to="/meetups" replace /> },
  
  // ✅ /jobs 경로 추가
  { path: "/jobs", element: <JobsPage /> },
  { path: "/jobs/new", element: <div>일자리 등록 (구현 예정)</div> },
  { path: "/jobs/:id", element: <div>일자리 상세 (구현 예정)</div> },
  { path: "/jobs/apply", element: <ApplicationMakerPage /> },
  { path: "/jobs/:jobId/apply", element: <ApplicationMakerPage /> },
  
  // ✅ /me/saves 경로 추가 (저장함)
  { path: "/me/saves", element: <SavesPage /> },
  
  // ✅ /me/tickets 경로 추가 (내 티켓)
  { path: "/me/tickets", element: <MyTicketsPage /> },
  
  // ✅ /me/profile 경로 추가 (프로필 편집)
  { path: "/me/profile", element: <ProfileEditPage /> },
  
  // ✅ /admin 경로 추가
  { path: "/admin", element: <AdminPage /> },
  { path: "/admin/kpi", element: <AdminKPICharts /> },
  
  // ✅ /events 경로를 직접 처리
  { path: "/events", element: <EventList /> },
  { path: "/events/new", element: <EventCreate /> },
  { 
    path: "/events/:id", 
    element: <EventPage />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <EventInfo /> },
      { path: "community", element: <EventCommunity /> },
      { path: "matches", element: <MatchesBoard /> },
      { path: "courts", element: <CourtsBoard /> },
      { path: "live", element: <LiveBoard /> },
      { path: "manage", element: <ManageTab /> },
      { path: "checkout", element: <Checkout /> },
    ]
  },
  // 응급 백업 절대경로(임시)
  { path: "/events/:id/checkout", element: <Checkout /> },
  { path: "/events/:id/audit", element: <EventAudit /> },
            { path: "/events/:id/checkin", element: <CheckinPage /> },
            { path: "/events/:id/ticket/:regId", element: <Ticket /> },
            { path: "/events/:id/scan", element: <StaffScan /> },
            { path: "/events/:id/pass", element: <Pass /> },
            { path: "/events/:id/scan", element: <Scan /> },
            { path: "/events/:id/counter", element: <CounterBoard /> },
            { path: "/events/:id/timeline", element: <TimelineBoard /> },
            { path: "/events/:id/ref/:courtId", element: <RefPad /> },
  { path: "/events/:id/analytics", element: <EventAnalytics /> },
  { path: "/events/:id/payments", element: <EventPayments /> },
  { path: "/events/:id/logs", element: <LogsDashboard /> },

            // ✅ 결제 페이지
            { path: "/checkout", element: <Checkout /> },
            { path: "/pay/return", element: <PayReturn /> },
            { path: "/pay/success", element: <PaySuccess /> },
            { path: "/pay/fail", element: <PayFail /> },

            // ✅ 관리자 페이지
            { path: "/admin/revenue", element: <Revenue /> },
            { path: "/admin/settlement", element: <MonthlySettlement /> },
  
  // ✅ 설정 페이지
  { path: "/settings/notifications", element: <NotificationsSettings /> },
  
  // ✅ 로그인은 가드 밖에 둡니다
  { path: "/login", element: <LoginPage /> },

  // ✅ 보호 구간은 가드로 래핑하고 Outlet으로 자식 렌더
  {
    path: "/app",
    element: <AppWithAuthGuard />,
    children: [
      // ★ /app으로 오면 /app/market 으로
      { index: true, element: <Navigate to="/app/market" replace /> },

      // 마켓 관련 라우트들
      {
        path: "market",
        element: <MarketLayout />,
        children: [
          { index: true, element: <MarketPage /> },
          { path: "new", element: <MarketNew3Set /> },
          { path: ":id", element: <MarketDetail /> },
          { path: ":id/edit", element: <MarketEditPage /> },
        ],
      },

      // 모임 관련 라우트들
      { path: "group", element: <GroupPage /> },

      // 일자리 관련 라우트들
      { path: "jobs", element: <JobsPage /> },

      // 채팅 관련 라우트들
      { path: "chat", element: <ChatList /> },
      { path: "chat/:id", element: <ChatRoom /> },

      // ★ 정의되지 않은 모든 경로도 /app/market 으로
      { path: "*", element: <Navigate to="/app/market" replace /> },
    ],
  },
  
  // ✅ Join 관련 라우트들
  { path: "/join/success", element: <JoinSuccessPage /> },
  { path: "/join/fail", element: <JoinFailPage /> },
  
  // ✅ 구독 관련 라우트들
  { path: "/subscription/success", element: <SubscriptionSuccessPage /> },
  { path: "/subscription/cancel", element: <SubscriptionCancelPage /> },
  
  // ✅ 스마트 결제 라우트들
  { path: "/payment/smart/:clubId", element: <SmartPaymentPage /> },
  
  // ✅ Toss 빌링키 라우트들
  { path: "/billing/success", element: <BillingSuccessPage /> },
  { path: "/billing/fail", element: <BillingFailPage /> },
  { path: "/billing/register/:clubId", element: <BillingRegisterPage /> },
  
  // ✅ 404 처리
  { path: "*", element: <ErrorBoundary /> },
]);