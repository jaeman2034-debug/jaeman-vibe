import { Routes, Route, Navigate } from "react-router-dom";
import { initializeFCM } from '@/lib/fcm';
import { startVitals } from '@/lib/vitals';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import StartScreen from "./start/StartScreen";
import StartFab from "./start/StartFab";
import AuthStart from "./pages/AuthStart";
import LoginSuccess from "./pages/LoginSuccess";
import PublicClubBlog from "./pages/PublicClubBlog";
import ClubListPage from "./screens/clubs/ClubListPage";
import ClubBlogList from "./blog/ClubBlogList";
import ClubBlogForm from "./blog/ClubBlogForm";
import ClubBlogDetail from "./blog/ClubBlogDetail";
import ClubBlogPending from "./blog/ClubBlogPending";
import ClubBlogHome from "./pages/ClubBlogHome";
import ClubSelectPage from "./screens/clubs/ClubSelectPage";
import TeamPublicForm from "./pages/team/TeamPublicForm";
import TeamPublicContribForm from "./pages/team/TeamPublicContribForm";
import BlogPage from "./pages/BlogPage";
import BlogListPage from "./pages/BlogListPage";
import BlogDetailPage from "./pages/BlogDetailPage";
import BlogNewPage from "./pages/BlogNewPage";
import SitemapManager from "./pages/SitemapManager";
import { BlogProvider } from "./contexts/BlogContext";

export default function App() {
  const [showStart, setShowStart] = useState(false);

  useEffect(() => {
    // Web Vitals 수집 시작
    startVitals();

    // FCM 초기화 (권한 요청 없이)
    initializeFCM();

    // 사용자 로그인 상태 변경 시 FCM 재등록 (권한이 있는 경우에만)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && Notification.permission === 'granted') {
        // 로그인 시 FCM 등록 (권한이 있는 경우에만)
        initializeFCM();
      }
    });

    return () => unsubscribe();
  }, []);

  // ?start=1 이면 자동으로 스타트 스크린 열기
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("start") === "1") setShowStart(true);
  }, []);

  return (
    <BlogProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/start" replace />} />
        <Route path="/start" element={<AuthStart />} />
        <Route path="/login" element={<AuthStart />} />
        <Route path="/login/success" element={<LoginSuccess />} />
        <Route path="/clubs" element={<ClubListPage />} />
        <Route path="/clubs/select" element={<ClubSelectPage />} />
        <Route path="/clubs/:clubId" element={<ClubBlogHome />} />
        <Route path="/clubs/:clubId/b" element={<PublicClubBlog />} />
        <Route path="/clubs/:clubId/blog" element={<ClubBlogList />} />
        <Route path="/clubs/:clubId/blog/new" element={<ClubBlogForm />} />
        <Route path="/clubs/:clubId/blog/pending" element={<ClubBlogPending />} />
        <Route path="/clubs/:clubId/blog/:postId" element={<ClubBlogDetail />} />
        <Route path="/clubs/:clubId/blog/:postId/edit" element={<ClubBlogForm />} />
        <Route path="/teams/:teamId/public" element={<TeamPublicForm />} />
        <Route path="/teams/:teamId/public/contrib" element={<TeamPublicContribForm />} />
        <Route path="/blog" element={<BlogPage />} />
               <Route path="/blogs" element={<BlogListPage />} />
               <Route path="/blogs/new" element={<BlogNewPage />} />
               <Route path="/blogs/:id" element={<BlogDetailPage />} />
               <Route path="/posts" element={<PostsPage />} />
               <Route path="/sitemap" element={<SitemapManager />} />
        <Route path="/market" element={<div>마켓 페이지</div>} />
        <Route path="*" element={<Navigate to="/start" replace />} />
      </Routes>
      {showStart && <StartScreen onClose={() => setShowStart(false)} />}
      <StartScreen />
      <StartFab />
    </BlogProvider>
  );
}