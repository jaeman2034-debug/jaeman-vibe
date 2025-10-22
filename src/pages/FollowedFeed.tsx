import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, getDocs, startAfter } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import BlogCard from "../components/BlogCard";
import SkeletonCard from "../components/SkeletonCard";
import Spinner from "../components/Spinner";
import { useNavigate } from "react-router-dom";
import { extractColorFromImage } from "../utils/extractColorFromImage";

export default function FollowedFeed() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [followedTeams, setFollowedTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("latest"); // latest | likes
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitial = async () => {
      if (!currentUser) {
        setPosts([]);
        setLoading(false);
        return;
      }

      try {
        const teamSnap = await getDocs(collection(db, "teams"));
        const followed = teamSnap.docs.filter((d) =>
          (d.data() as any).followers?.includes(currentUser.uid)
        );
        
        // ?� ?�이??처리 (?�상 추출 ?�함)
        const processedTeams = await Promise.all(
          followed.map(async (d) => {
            const data = d.data() as any;
            // ?� 컬러가 ?�고 로고가 ?�다�??��?지?�서 ?�상 추출
            if (!data.color && data.logoUrl) {
              try {
                const extractedColor = await extractColorFromImage(data.logoUrl);
                data.color = extractedColor;
              } catch (err) {
                console.error("?� 로고 ?�상 추출 ?�패:", err);
                data.color = "#3B82F6";
              }
            }
            return { id: d.id, ...data };
          })
        );
        
        setFollowedTeams(processedTeams);

        if (followed.length === 0) {
          setPosts([]);
          setLoading(false);
          return;
        }

        // 초기?�는 ?�체 ?�드 보여주기
        const teamIds = followed.map((d) => d.id);
        const teamBatch = teamIds.slice(0, 10); // Firestore 'in' 쿼리 ?�한 ?�??
        const q = query(
          collection(db, "blogs"),
          where("teamId", "in", teamBatch),
          orderBy("createdAt", "desc"),
          limit(10)
        );

        const snap = await getDocs(q);
        const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        
        // �?게시글???� ?�상 ?�보 추�?
        const postsWithTeamColor = docs.map(post => {
          const team = processedTeams.find(t => t.id === post.teamId);
          return {
            ...post,
            teamColor: team?.color || "#3B82F6"
          };
        });
        
        setPosts(postsWithTeamColor);
        setLastDoc(snap.docs[snap.docs.length - 1]);
        setHasMore(snap.docs.length === 10);
        setLoading(false);
      } catch (err) {
        console.error("?� 구독 목록 불러?�기 ?�패:", err);
        setLoading(false);
      }
    };

    fetchInitial();
  }, [currentUser]);

  const loadMore = async () => {
    if (!hasMore || loadingMore || !currentUser) return;
    setLoadingMore(true);
    
    try {
      const teamIds = followedTeams.map((t) => t.id);
      const teamBatch = teamIds.slice(0, 10); // Firestore 'in' 쿼리 ?�한 ?�??      
      const q = query(
        collection(db, "blogs"),
        where("teamId", "in", teamBatch),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(10)
      );
      
      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      
      // �?게시글???� ?�상 ?�보 추�?
      const postsWithTeamColor = docs.map(post => {
        const team = followedTeams.find(t => t.id === post.teamId);
        return {
          ...post,
          teamColor: team?.color || "#3B82F6"
        };
      });
      
      setPosts((prev) => [...prev, ...postsWithTeamColor]);
      setLastDoc(snap.docs[snap.docs.length - 1]);
      setHasMore(snap.docs.length === 10);
    } catch (err) {
      console.error("추�? 로드 ?�패:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // IntersectionObserver�??�동 로드
  useEffect(() => {
    if (!hasMore) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );
    
    const sentinel = document.querySelector("#scroll-sentinel");
    if (sentinel) observer.observe(sentinel);
    
    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [hasMore, loadingMore, lastDoc, followedTeams]);

  if (loading) return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">?��? ?�로?�한 ?� ?�드</h2>
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">?��? ?�로?�한 ?� ?�드</h2>

      {/* ?� ?�터 + ?�렬 ?�션 */}
      {followedTeams.length > 0 && (
        <div className="mb-6 flex gap-3 items-center">
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="all">?�체 보기</option>
            {followedTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="latest">최신??/option>
            <option value="likes">좋아?�순</option>
          </select>
        </div>
      )}

      {posts.length === 0 ? (
        <p className="text-gray-500">?�로?�한 ?�??게시글???�습?�다.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
            {posts
              .filter((post) =>
                selectedTeam === "all" ? true : post.teamId === selectedTeam
              )
              .sort((a, b) => {
                if (sortOption === "likes") {
                  return (b.likes || 0) - (a.likes || 0);
                }
                // 최신?? createdAt 기�? ?�림차순
                const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
                const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
                return bTime - aTime;
              })
                  .map((post) => (
                    <div key={post.id} style={{ ["--team-color" as any]: post.teamColor }}>
                      <BlogCard blog={post} onClick={() => navigate(`/blogs/${post.id}`)} />
                    </div>
                  ))}

            {/* 로딩 중일 ???�켈?�톤 카드 + ?�피??*/}
            {loadingMore && (
              <>
                {Array.from({ length: 2 }).map((_, i) => (
                  <SkeletonCard key={`skeleton-${i}`} />
                ))}
                <div className="absolute inset-0 flex justify-center items-center bg-white/60 dark:bg-gray-900/60">
                  <Spinner
                    color={followedTeams[0]?.color || "#3B82F6"}
                    size={40}
                  />
                </div>
              </>
            )}
          </div>
          {hasMore && !loadingMore && (
            <div
              id="scroll-sentinel"
              className="h-10 flex justify-center items-center text-gray-400"
            >
              ?�크롤하�???불러?�니??            </div>
          )}
        </>
      )}
    </div>
  );
}


