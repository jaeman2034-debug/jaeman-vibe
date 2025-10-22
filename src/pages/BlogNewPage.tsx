import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSEO } from "../hooks/useSEO";
import { useCreateBlog } from "../hooks/useBlogs";
import { useBlogContext } from "../contexts/BlogContext";

export default function BlogNewPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const { create, loading: submitting, error } = useCreateBlog();
  const { addBlog } = useBlogContext();

  // SEO 설정
  useSEO({
    title: "블로그 글쓰기 - 야고 스포츠 플랫폼",
    description: "야고 스포츠 플랫폼에서 새로운 블로그 글을 작성하세요. 스포츠 소식, 커뮤니티 정보, 이벤트 등을 공유할 수 있습니다.",
    keywords: "야고, 스포츠, 블로그, 글쓰기, 작성, 커뮤니티, 소식",
    ogType: "website"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim() || !author.trim()) {
      alert("제목, 내용, 작성자를 모두 입력해주세요.");
      return;
    }

    try {
      const newBlog = await create({ title, content, author });
      
      // Context에 새 블로그 추가
      addBlog(newBlog);
      
      alert(`블로그가 성공적으로 작성되었습니다!\n작성자: ${author}`);
      navigate("/blogs");
    } catch (err) {
      console.error("블로그 작성 오류:", err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-6">📝 새 블로그 작성</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            제목
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="블로그 제목을 입력하세요"
            required
          />
        </div>

        <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
            작성자
          </label>
          <input
            id="author"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="작성자 이름을 입력하세요 (예: 소흘 FC 60대 운영진)"
            required
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            내용
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={15}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="블로그 내용을 입력하세요"
            required
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate("/blogs")}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={submitting}
          >
            취소
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? "작성 중..." : "작성하기"}
          </button>
        </div>
      </form>
    </div>
  );
}
