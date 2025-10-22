import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { collection, onSnapshot, query, where, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../lib/firebase";
import BlogCard from "../components/BlogCard";
import { useAuth } from "../hooks/useAuth";
import { extractColorFromImage } from "../utils/extractColorFromImage";
import { generateTeamGradient } from "../utils/gradientUtils";

export default function TeamBlogs() {
  const { teamId } = useParams<{ teamId: string }>();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<any>(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const hasFollowed = Boolean(team?.followers?.includes(currentUser?.uid));

  const toggleFollow = async () => {
    if (!currentUser) return alert("ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??");
    if (!teamId) return;
    const ref = doc(db, "teams", teamId);
    await updateDoc(ref, {
      followers: hasFollowed
        ? arrayRemove(currentUser.uid)
        : arrayUnion(currentUser.uid),
      followersCount: hasFollowed
        ? Math.max(0, (team?.followersCount || 1) - 1)
        : (team?.followersCount || 0) + 1,
    });
  };

  useEffect(() => {
    if (!teamId) return;
    const q = query(collection(db, "blogs"), where("teamId", "==", teamId));
    const unsub = onSnapshot(q, async (snap) => {
      const postsData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      
      // ê°?ê²Œì‹œê¸€???€ ?‰ìƒ ?•ë³´ ì¶”ê?
      const postsWithTeamColor = postsData.map(post => ({
        ...post,
        teamColor: team?.color || "#3B82F6"
      }));
      
      setPosts(postsWithTeamColor);
      setLoading(false);
    });
    return () => unsub();
  }, [teamId, team?.color]);

  useEffect(() => {
    const fetchTeam = async () => {
      if (!teamId) return;
      const snap = await getDoc(doc(db, "teams", teamId));
      if (snap.exists()) {
        let data = snap.data();
        // ?€ ì»¬ëŸ¬ê°€ ?†ê³  ë¡œê³ ê°€ ?ˆë‹¤ë©??´ë?ì§€?ì„œ ?‰ìƒ ì¶”ì¶œ
        if (!data.color && data.logoUrl) {
          try {
            const extractedColor = await extractColorFromImage(data.logoUrl);
            data.color = extractedColor;
          } catch (err) {
            console.error("?€ ë¡œê³  ?‰ìƒ ì¶”ì¶œ ?¤íŒ¨:", err);
            data.color = "#3B82F6";
          }
        }
        setTeam(data);
      }
    };
    fetchTeam();
  }, [teamId]);

  if (loading) {
    return <div className="max-w-4xl mx-auto p-4 text-gray-500">ë¶ˆëŸ¬?¤ëŠ” ì¤?..</div>;
  }

  return (
    <div 
      className="max-w-4xl mx-auto p-4"
      style={{ ["--team-color" as any]: team?.color || "#3B82F6" }}
    >
      {team && (
        <div
          className="rounded-xl p-4 md:p-6 mb-6 text-white shadow-lg"
          style={{
            background: generateTeamGradient(team.color || "#3B82F6"),
          }}
        >
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {team.logoUrl ? (
              <img
                src={team.logoUrl}
                alt="?€ ë¡œê³ "
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/30 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-md flex-shrink-0">
                ?
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-bold mb-1">{team.name}</h2>
              {team.description && (
                <p className="text-xs sm:text-sm opacity-90 mb-3">{team.description}</p>
              )}
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={toggleFollow}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    hasFollowed 
                      ? "bg-white/20 text-white border border-white/30 hover:bg-white/30" 
                      : "bg-white text-gray-800 hover:bg-white/90 shadow-md"
                  }`}
                >
                  {hasFollowed ? "?¸íŒ”ë¡œìš°" : "?”ë¡œ??}
                </button>
                <span className="text-xs opacity-80 bg-white/20 px-2 py-1 rounded-full">
                  ?”ë¡œ??{team.followersCount || 0}ëª?                </span>
              </div>
            </div>
          </div>
        </div>
      )}
          <h3 className="text-xl font-semibold mb-4 team-title border-b pb-1">?€ ë¸”ë¡œê·?/h3>
      {posts.length === 0 ? (
        <p className="text-gray-500">ê²Œì‹œê¸€???†ìŠµ?ˆë‹¤.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post) => (
            <div key={post.id} style={{ ["--team-color" as any]: post.teamColor }}>
              <BlogCard blog={post} onClick={() => navigate(`/blogs/${post.id}`)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


