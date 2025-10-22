import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBlogSEO } from "../hooks/useSEO";
import { useBlog, useUpdateBlog, useDeleteBlog } from "../hooks/useBlogs";
import { getComments, createComment, updateComment, deleteComment, Comment } from "../services/blogService";
import { useBlogContext } from "../contexts/BlogContext";

export default function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { blog, loading: blogLoading, error: blogError } = useBlog(id || "");
  const { update: updateBlog, loading: updateLoading } = useUpdateBlog();
  const { remove: deleteBlog, loading: deleteLoading } = useDeleteBlog();
  const { blogs: contextBlogs, updateBlog: updateContextBlog, deleteBlog: deleteContextBlog } = useBlogContext();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Context에서 블로그 데이터 가져오기 (새로 작성된 글 포함)
  const currentBlog = contextBlogs.find(b => b.id === id) || blog;

  // SEO 설정 (블로그 데이터가 로드된 후)
  useBlogSEO(currentBlog);

  // 댓글 로드
  useEffect(() => {
    if (id) {
      loadComments();
    }
  }, [id]);

  const loadComments = async () => {
    if (!id) return;
    
    try {
      setCommentsLoading(true);
      const data = await getComments(id);
      setComments(data);
    } catch (error) {
      console.error("댓글 로드 오류:", error);
    } finally {
      setCommentsLoading(false);
    }
  };

  // 블로그 수정
  const handleUpdate = async () => {
    if (!id || !editTitle.trim() || !editContent.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    try {
      await updateBlog({ id, title: editTitle, content: editContent });
      
      // Context에서도 블로그 업데이트
      updateContextBlog(id, { title: editTitle, content: editContent });
      
      alert("수정 완료!");
      setIsEditing(false);
    } catch (error) {
      console.error("블로그 수정 오류:", error);
    }
  };

  // 블로그 삭제
  const handleDelete = async () => {
    if (!id) return;
    
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteBlog(id);
      
      // Context에서도 블로그 삭제
      deleteContextBlog(id);
      
      alert("삭제 완료!");
      navigate("/blogs");
    } catch (error) {
      console.error("블로그 삭제 오류:", error);
    }
  };

  // 댓글 추가
  const handleAddComment = async () => {
    if (!id || !newComment.trim()) return;

    try {
      await createComment({ blogId: id, content: newComment });
      setNewComment("");
      loadComments(); // 댓글 목록 새로고침
    } catch (error) {
      console.error("댓글 작성 오류:", error);
    }
  };

  // 댓글 수정
  const handleEditComment = (comment: Comment) => {
    setEditingId(comment.id);
    setEditCommentContent(comment.content);
  };

  const handleUpdateComment = async () => {
    if (!editingId || !editCommentContent.trim()) return;

    try {
      await updateComment({ id: editingId, content: editCommentContent });
      setEditingId(null);
      setEditCommentContent("");
      loadComments(); // 댓글 목록 새로고침
    } catch (error) {
      console.error("댓글 수정 오류:", error);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;

    try {
      await deleteComment(commentId);
      loadComments(); // 댓글 목록 새로고침
    } catch (error) {
      console.error("댓글 삭제 오류:", error);
    }
  };

  if (blogLoading) {
    return <p className="text-gray-500 text-center mt-8">불러오는 중...</p>;
  }

  if (blogError) {
    return (
      <div className="max-w-3xl mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{blogError}</p>
        </div>
      </div>
    );
  }

  if (!currentBlog) {
    return <p className="text-gray-500 text-center mt-8">블로그를 찾을 수 없습니다.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto mt-8">
      {isEditing ? (
        <>
          <input
            className="w-full border p-2 rounded mb-4"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <textarea
            className="w-full border p-2 rounded mb-4"
            rows={10}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
          <button
            onClick={handleUpdate}
            disabled={updateLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            {updateLoading ? "저장 중..." : "저장"}
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="bg-gray-400 text-white px-4 py-2 rounded"
          >
            취소
          </button>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-4">{currentBlog.title}</h1>
          <div className="text-gray-700 mb-6 whitespace-pre-line">{currentBlog.content}</div>
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="font-medium">작성자:</span>
                  <span className="text-blue-600 font-semibold">{currentBlog.authorName}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">작성일:</span>
                  <span>{new Date(currentBlog.createdAt?.seconds * 1000 || currentBlog.createdAt).toLocaleString()}</span>
                </span>
              </div>
            </div>
            <div>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-yellow-500 text-white px-4 py-2 rounded mr-2"
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                {deleteLoading ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </>
      )}

      <hr className="my-6" />

      {/* 댓글 작성 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">댓글 작성</h3>
        <textarea
          className="w-full border p-2 rounded"
          rows={3}
          placeholder="댓글을 입력하세요..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button
          onClick={handleAddComment}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
        >
          댓글 등록
        </button>
      </div>

      {/* 댓글 목록 */}
      <div>
        <h3 className="text-lg font-semibold mb-3">댓글 {comments.length}개</h3>
        {commentsLoading ? (
          <p className="text-gray-500">댓글을 불러오는 중...</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => (
              <li key={comment.id} className="border-b py-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {editingId === comment.id ? (
                      <>
                        <textarea
                          value={editCommentContent}
                          onChange={(e) => setEditCommentContent(e.target.value)}
                          className="w-full border p-1 text-sm"
                        />
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={handleUpdateComment}
                            className="text-blue-500 text-xs"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-gray-400 text-xs"
                          >
                            취소
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-800">{comment.content}</p>
                        <span className="text-xs text-gray-400">
                          {comment.authorName} • {new Date(comment.createdAt?.seconds * 1000 || comment.createdAt).toLocaleString()}
                        </span>
                      </>
                    )}
                  </div>
                  {editingId !== comment.id && (
                    <div className="ml-2 flex flex-col gap-1">
                      <button
                        onClick={() => handleEditComment(comment)}
                        className="text-blue-500 text-xs"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-500 text-xs"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}