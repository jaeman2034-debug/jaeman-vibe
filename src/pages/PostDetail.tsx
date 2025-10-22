import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../lib/firebase";
import { doc, getDoc, collection, getDocs, orderBy, query } from "firebase/firestore";
import Comments from "../components/Comments";

interface Post {
  id: string;
  title: string;
  content: string;
  imageUrl?: string; // ?¨ì¼ ?´ë?ì§€ (?˜ìœ„ ?¸í™˜??
  imageUrls?: string[]; // ?¤ì¤‘ ?´ë?ì§€ (?˜ìœ„ ?¸í™˜??
  mediaUrls?: { url: string; type: string }[]; // ?µí•© ë¯¸ë””??(?´ë?ì§€ + ?™ì˜??
  fileUrls?: { url: string; name: string }[]; // ì²¨ë? ?Œì¼
  createdAt: any;
}

// Comment ?¸í„°?˜ì´?¤ëŠ” Comments ì»´í¬?ŒíŠ¸?ì„œ ?•ì˜??
interface PostDetailProps {
  teamId?: string;
  postId?: string;
}

export default function PostDetail({ teamId: propTeamId, postId: propPostId }: PostDetailProps) {
  // URL ?Œë¼ë¯¸í„°?ì„œ teamId?€ postId ê°€?¸ì˜¤ê¸?  const { teamId: urlTeamId, postId: urlPostId } = useParams<{ teamId?: string; postId?: string }>();
  
  // propsê°€ ?ˆìœ¼ë©?props ?¬ìš©, ?†ìœ¼ë©?URL ?Œë¼ë¯¸í„° ?¬ìš©
  const teamId = propTeamId || urlTeamId || "";
  const postId = propPostId || urlPostId || "";
  
  // ?”ë²„ê¹…ìš© ë¡œê·¸
  console.log("PostDetail Debug:", { propTeamId, urlTeamId, propPostId, urlPostId, teamId, postId });
  console.log("PostDetail URL:", window.location.pathname);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '?“„';
      case 'doc':
      case 'docx': return '?“';
      case 'xls':
      case 'xlsx': return '?“Š';
      case 'ppt':
      case 'pptx': return '?“‹';
      case 'txt': return '?“ƒ';
      case 'zip':
      case 'rar': return '?—œï¸?;
      default: return '?“';
    }
  };

  // ?°ì¹˜ ?¤ì??´í”„ ì²˜ë¦¬
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      prevImage();
    }
  };

  // ìºëŸ¬?€ ?¤ë¹„ê²Œì´???¨ìˆ˜??  const nextImage = () => {
    if (!post?.imageUrls) return;
    setCurrentImageIndex((prev) => (prev + 1) % post.imageUrls.length);
  };

  const prevImage = () => {
    if (!post?.imageUrls) return;
    setCurrentImageIndex((prev) => 
      prev === 0 ? post.imageUrls.length - 1 : prev - 1
    );
  };

  const goToImage = (index: number) => {
    if (!post?.imageUrls) return;
    setCurrentImageIndex(index);
  };

  // ?¤ë³´???¤ë¹„ê²Œì´??  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [post?.imageUrls]);

  // ?ë™ ?¬ë¼?´ë“œ (? íƒ?¬í•­ - ì£¼ì„ ?´ì œ?˜ì—¬ ?¬ìš©)
  // useEffect(() => {
  //   if (!post?.imageUrls || post.imageUrls.length <= 1) return;
    
  //   const interval = setInterval(() => {
  //     setCurrentImageIndex((prev) => (prev + 1) % post.imageUrls.length);
  //   }, 5000); // 5ì´ˆë§ˆ???ë™ ?¬ë¼?´ë“œ

  //   return () => clearInterval(interval);
  // }, [post?.imageUrls]);

// ?“ê? ë¡œë“œ ?¨ìˆ˜??Comments ì»´í¬?ŒíŠ¸?ì„œ ì²˜ë¦¬??
  useEffect(() => {
    const loadPost = async () => {
      if (!postId) {
        console.log("PostDetail: postIdê°€ ?†ìŠµ?ˆë‹¤");
        setLoading(false);
        return;
      }
      
      try {
        // teamIdê°€ ?ˆìœ¼ë©?teams ì»¬ë ‰?˜ì—?? ?†ìœ¼ë©??¼ë°˜ posts ì»¬ë ‰?˜ì—??ì°¾ê¸°
        const postPath = teamId ? `teams/${teamId}/posts/${postId}` : `posts/${postId}`;
        console.log("PostDetail: ë¡œë“œ ?œë„ ì¤?..", { postPath, teamId, postId });
        
        const postDoc = await getDoc(doc(db, ...postPath.split('/')));
        console.log("PostDetail: ë¬¸ì„œ ì¡´ì¬ ?¬ë?:", postDoc.exists(), "?°ì´??", postDoc.data());
        
        if (postDoc.exists()) {
          setPost({ id: postDoc.id, ...postDoc.data() } as Post);
        } else {
          console.warn("??ê²Œì‹œê¸€ ?†ìŒ:", postId);
        }
      } catch (error) {
        console.error("ê²Œì‹œê¸€ ë¶ˆëŸ¬?¤ê¸° ?¤íŒ¨:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPost();
  }, [teamId, postId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">ê²Œì‹œê¸€??ë¶ˆëŸ¬?¤ëŠ” ì¤?..</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">ê²Œì‹œê¸€??ì°¾ì„ ???†ìŠµ?ˆë‹¤</h1>
          <p className="text-gray-600 dark:text-gray-400">?”ì²­?˜ì‹  ê²Œì‹œê¸€??ì¡´ì¬?˜ì? ?Šê±°???? œ?˜ì—ˆ?µë‹ˆ??</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
          {/* ê²Œì‹œê¸€ ë¯¸ë””???œì‹œ (?´ë?ì§€ + ?™ì˜?? */}
          {post.mediaUrls && post.mediaUrls.length > 0 ? (
            <div className="space-y-4 mb-8">
              {post.mediaUrls.map((media: { url: string; type: string }, idx: number) => (
                <div key={idx} className="relative">
                  {media.type === "video" ? (
                    <div className="relative">
                      <video
                        src={media.url}
                        className="w-full max-h-96 rounded-xl shadow-2xl"
                        controls
                        preload="metadata"
                      />
                      <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
                        ?¬ ?™ì˜??                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={media.url}
                        alt={`ê²Œì‹œê¸€ ?´ë?ì§€ ${idx + 1}`}
                        className="w-full max-h-96 object-cover rounded-xl shadow-2xl"
                      />
                      <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
                        ?“· ?´ë?ì§€
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : post.imageUrls && post.imageUrls.length > 0 ? (
            <div className="relative w-full max-w-4xl mx-auto mb-8">
              {/* ë©”ì¸ ?´ë?ì§€ */}
              <div 
                className="relative overflow-hidden rounded-xl shadow-2xl"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  src={post.imageUrls[currentImageIndex]}
                  alt={`ê²Œì‹œê¸€ ?´ë?ì§€ ${currentImageIndex + 1}`}
                  className="w-full h-96 md:h-[500px] object-cover transition-all duration-300 ease-in-out select-none"
                />
                
                {/* ì¢Œìš° ?¤ë¹„ê²Œì´??ë²„íŠ¼ */}
                {post.imageUrls.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute top-1/2 left-4 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 shadow-lg"
                      aria-label="?´ì „ ?´ë?ì§€"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute top-1/2 right-4 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 shadow-lg"
                      aria-label="?¤ìŒ ?´ë?ì§€"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* ?´ë?ì§€ ì¹´ìš´??*/}
                <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {currentImageIndex + 1} / {post.imageUrls.length}
                </div>

                {/* ?•ë? ë²„íŠ¼ */}
                <button
                  onClick={() => window.open(post.imageUrls[currentImageIndex], '_blank')}
                  className="absolute top-4 left-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 hover:scale-110 shadow-lg"
                  aria-label="?´ë?ì§€ ?•ë?"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </button>
              </div>

              {/* ?¸ë””ì¼€?´í„° ?„íŠ¸ */}
              {post.imageUrls.length > 1 && (
                <div className="flex justify-center mt-4 space-x-2">
                  {post.imageUrls.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => goToImage(idx)}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        idx === currentImageIndex 
                          ? "bg-blue-500 scale-125" 
                          : "bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
                      }`}
                      aria-label={`?´ë?ì§€ ${idx + 1}ë¡??´ë™`}
                    />
                  ))}
                </div>
              )}

              {/* ?¸ë„¤??ê°¤ëŸ¬ë¦?(? íƒ?¬í•­) */}
              {post.imageUrls.length > 1 && (
                <div className="flex justify-center mt-4 space-x-2 overflow-x-auto pb-2">
                  {post.imageUrls.map((url: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => goToImage(idx)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        idx === currentImageIndex 
                          ? "border-blue-500 scale-105" 
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                      }`}
                    >
                      <img
                        src={url}
                        alt={`?¸ë„¤??${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : post.imageUrl ? (
            // ?˜ìœ„ ?¸í™˜?? ?¨ì¼ ?´ë?ì§€
            <div className="w-full h-96 md:h-[500px] mb-8 rounded-xl overflow-hidden shadow-2xl">
              <img
                src={post.imageUrl}
                alt="ê²Œì‹œê¸€ ?´ë?ì§€"
                className="w-full h-full object-cover"
              />
            </div>
          ) : null}

          {/* ê²Œì‹œê¸€ ?´ìš© */}
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-100">
              {post.title}
            </h1>
            
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {post.createdAt?.toDate ? 
                post.createdAt.toDate().toLocaleString() : 
                new Date().toLocaleString()
              }
            </div>

            <div className="prose prose-lg max-w-none text-gray-700 dark:text-gray-300">
              <p className="whitespace-pre-line leading-relaxed">
                {post.content}
              </p>
            </div>

            {/* ì²¨ë??Œì¼ ëª©ë¡ */}
            {post.fileUrls && post.fileUrls.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  ?“ ì²¨ë??Œì¼ ({post.fileUrls.length}ê°?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {post.fileUrls.map((file: { url: string; name: string }, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {getFileIcon(file.name)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            ì²¨ë??Œì¼
                          </p>
                        </div>
                      </div>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        ?¤ìš´ë¡œë“œ
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ?“ê? ?¹ì…˜ */}
            <Comments postId={post.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
