import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import ClubFinanceManagement from "../components/ClubFinanceManagement";

interface Club {
  id: string;
  name: string;
  description: string;
  location: string;
  sportType: string;
  memberCount: number;
  maxMembers: number;
  isPublic: boolean;
  createdAt: any;
  admins: string[];
  leaderId: string;
  leaderName: string;
}

interface ClubMember {
  id: string;
  userId: string;
  userName: string;
  role: "member" | "admin" | "leader";
  joinedAt: any;
  paidUntil: string;
  attendance: number;
  position?: string;
  phone?: string;
  age?: number;
}

interface ClubPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
}

export default function ClubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [posts, setPosts] = useState<ClubPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "finance" | "attendance" | "posts">("overview");
  const [showPostForm, setShowPostForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "" });

  // ?´ëŸ½ ?°ì´??ë¡œë“œ
  useEffect(() => {
    if (!id) return;

    const loadClubData = async () => {
      try {
        // ?´ëŸ½ ?•ë³´ ë¡œë“œ
        const clubDoc = await getDoc(doc(db, "clubs", id));
        if (!clubDoc.exists()) {
          alert("?´ëŸ½??ì°¾ì„ ???†ìŠµ?ˆë‹¤.");
          navigate("/clubs");
          return;
        }

        const clubData = { id: clubDoc.id, ...clubDoc.data() } as Club;
        setClub(clubData);

        // ë©¤ë²„ ?•ë³´ ë¡œë“œ
        const membersSnapshot = await getDocs(
          query(collection(db, "clubs", id, "members"), orderBy("joinedAt", "desc"))
        );
        const membersData = membersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ClubMember[];
        setMembers(membersData);

        // ê²Œì‹œê¸€ ë¡œë“œ
        const postsSnapshot = await getDocs(
          query(collection(db, "clubs", id, "posts"), orderBy("createdAt", "desc"))
        );
        const postsData = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ClubPost[];
        setPosts(postsData);

        setLoading(false);
      } catch (error) {
        console.error("?´ëŸ½ ?°ì´??ë¡œë“œ ?¤íŒ¨:", error);
        setLoading(false);
      }
    };

    loadClubData();
  }, [id, navigate]);

  // ê²Œì‹œê¸€ ?‘ì„±
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !id) return;

    try {
      await addDoc(collection(db, "clubs", id, "posts"), {
        title: newPost.title,
        content: newPost.content,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || "?µëª…",
        createdAt: new Date()
      });

      alert("ê²Œì‹œê¸€???‘ì„±?˜ì—ˆ?µë‹ˆ??");
      setShowPostForm(false);
      setNewPost({ title: "", content: "" });
      
      // ê²Œì‹œê¸€ ëª©ë¡ ?ˆë¡œê³ ì¹¨
      const postsSnapshot = await getDocs(
        query(collection(db, "clubs", id, "posts"), orderBy("createdAt", "desc"))
      );
      const postsData = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClubPost[];
      setPosts(postsData);
      
    } catch (error) {
      console.error("ê²Œì‹œê¸€ ?‘ì„± ?¤íŒ¨:", error);
      alert("ê²Œì‹œê¸€ ?‘ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
    }
  };

  const getSportIcon = (sportType: string) => {
    switch (sportType) {
      case "ì¶•êµ¬": return "??;
      case "?êµ¬": return "??";
      case "?¼êµ¬": return "??;
      case "ë°°ë“œë¯¼í„´": return "?¸";
      case "?Œë‹ˆ??: return "?¾";
      default: return "?ƒ";
    }
  };

  const getUserRole = () => {
    if (!club || !currentUser) return null;
    if (club.leaderId === currentUser.uid) return "leader";
    if (club.admins.includes(currentUser.uid)) return "admin";
    const member = members.find(m => m.userId === currentUser.uid);
    return member ? "member" : null;
  };

  const canManage = () => {
    const role = getUserRole();
    return role === "leader" || role === "admin";
  };

  const canPost = () => {
    const role = getUserRole();
    return role !== null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">?´ëŸ½ ?•ë³´ë¥?ë¶ˆëŸ¬?¤ëŠ” ì¤?..</p>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">?´ëŸ½??ì°¾ì„ ???†ìŠµ?ˆë‹¤.</p>
          <Link to="/clubs" className="text-blue-600 mt-2 inline-block">?´ëŸ½ ëª©ë¡?¼ë¡œ ?Œì•„ê°€ê¸?/Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ?¤ë” */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/clubs" className="text-blue-600 hover:text-blue-800">
                ???´ëŸ½ ëª©ë¡
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  {getSportIcon(club.sportType)} {club.name}
                </h1>
                <p className="text-gray-600 mt-1">?“ {club.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                club.isPublic 
                  ? "bg-green-100 text-green-800" 
                  : "bg-gray-100 text-gray-800"
              }`}>
                {club.isPublic ? "ê³µê°œ ?´ëŸ½" : "ë¹„ê³µê°??´ëŸ½"}
              </span>
              {canManage() && (
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  ?¤ì •
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ???¤ë¹„ê²Œì´??*/}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            {[
              { id: "overview", label: "ê°œìš”", icon: "?“Š" },
              { id: "members", label: "?Œì›", icon: "?‘¥" },
              { id: "finance", label: "?Œë¹„", icon: "?’°" },
              { id: "attendance", label: "ì¶œì„", icon: "?“…" },
              { id: "posts", label: "ê²Œì‹œ??, icon: "?“" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* ?´ëŸ½ ?•ë³´ */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">?´ëŸ½ ?•ë³´</h2>
              <p className="text-gray-700 mb-4">{club.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{club.memberCount}</div>
                  <div className="text-sm text-gray-600">?„ì¬ ?Œì›</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{club.maxMembers}</div>
                  <div className="text-sm text-gray-600">ìµœë? ?Œì›</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{club.sportType}</div>
                  <div className="text-sm text-gray-600">?´ë™ ì¢…ëª©</div>
                </div>
              </div>
            </div>

            {/* ìµœê·¼ ?œë™ */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">ìµœê·¼ ?œë™</h2>
              <div className="space-y-3">
                {posts.slice(0, 3).map((post) => (
                  <div key={post.id} className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold text-gray-900">{post.title}</h3>
                    <p className="text-sm text-gray-600">
                      {post.authorName} ??{post.createdAt?.toDate?.().toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {posts.length === 0 && (
                  <p className="text-gray-500 text-center py-8">?„ì§ ê²Œì‹œê¸€???†ìŠµ?ˆë‹¤.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">?Œì› ëª…ë‹¨</h2>
                {canManage() && (
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    ?Œì› ê´€ë¦?                  </button>
                )}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ?´ë¦„
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ??• 
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ê°€?…ì¼
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ì¶œì„
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ?Œë¹„ ?©ë?
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{member.userName}</div>
                          {member.userId === currentUser?.uid && (
                            <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              ??                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          member.role === "leader" 
                            ? "bg-red-100 text-red-800"
                            : member.role === "admin"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {member.role === "leader" ? "?Œì¥" : 
                           member.role === "admin" ? "?´ì˜ì§? : "?Œì›"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.joinedAt?.toDate?.().toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.attendance}??                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          new Date(member.paidUntil + "-01") > new Date()
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {member.paidUntil}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "finance" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">?Œë¹„ ê´€ë¦?/h2>
            {id && (
              <ClubFinanceManagement 
                clubId={id} 
                canManage={canManage()} 
              />
            )}
          </div>
        )}

        {activeTab === "attendance" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">ì¶œì„ ê´€ë¦?/h2>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">?“…</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">ì¶œì„ ê´€ë¦?ê¸°ëŠ¥ ì¤€ë¹?ì¤?/h3>
              <p className="text-gray-500">ê³?ì¶œì„ ì²´í¬ ë°?ê´€ë¦?ê¸°ëŠ¥???œê³µ???ˆì •?…ë‹ˆ??</p>
            </div>
          </div>
        )}

        {activeTab === "posts" && (
          <div className="space-y-6">
            {/* ê²Œì‹œê¸€ ëª©ë¡ */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">ê²Œì‹œ??/h2>
                {canPost() && (
                  <button
                    onClick={() => setShowPostForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ê¸€?°ê¸°
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                    <p className="text-gray-700 mb-2 line-clamp-2">{post.content}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{post.authorName}</span>
                      <span>{post.createdAt?.toDate?.().toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {posts.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">?“</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">?„ì§ ê²Œì‹œê¸€???†ìŠµ?ˆë‹¤</h3>
                    <p className="text-gray-500">ì²?ë²ˆì§¸ ê²Œì‹œê¸€???‘ì„±?´ë³´?¸ìš”!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ê²Œì‹œê¸€ ?‘ì„± ëª¨ë‹¬ */}
      {showPostForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">ê²Œì‹œê¸€ ?‘ì„±</h3>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">?œëª©</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="ê²Œì‹œê¸€ ?œëª©???…ë ¥?˜ì„¸??
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">?´ìš©</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 h-32"
                  placeholder="ê²Œì‹œê¸€ ?´ìš©???…ë ¥?˜ì„¸??
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPostForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  ì·¨ì†Œ
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ?‘ì„±?˜ê¸°
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
