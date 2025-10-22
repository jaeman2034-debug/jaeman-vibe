import { Link, useNavigate } from "react-router-dom";
import { useSEO } from "../hooks/useSEO";
import { useBlogs } from "../hooks/useBlogs";
import { useBlogContext } from "../contexts/BlogContext";
import { useEffect, useState } from "react";
import BlogCard from "../components/BlogCard";
import SearchFilter from "../components/SearchFilter";

export default function BlogListPage() {
  const { blogs: contextBlogs, setBlogs } = useBlogContext();
  const { blogs, loading, error, refreshBlogs } = useBlogs();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [filteredBlogs, setFilteredBlogs] = useState(contextBlogs);

  // SEO 설정
  useSEO({
    title: "블로그 목록 - 야고 스포츠 플랫폼",
    description: "야고 스포츠 플랫폼의 최신 블로그 글들을 확인하세요. 스포츠 소식, 커뮤니티 정보, 이벤트 등 다양한 내용을 제공합니다.",
    keywords: "야고, 스포츠, 블로그, 목록, 커뮤니티, 소식, 이벤트",
    ogType: "website"
  });

  // 초기 데이터 로드 시 Context에 설정
  useEffect(() => {
    if (blogs.length > 0 && contextBlogs.length === 0) {
      setBlogs(blogs);
    }
  }, [blogs, contextBlogs.length, setBlogs]);

  // 필터링 로직
  useEffect(() => {
    let filtered = contextBlogs.length > 0 ? contextBlogs : blogs;
    
    // 검색 필터
    if (searchQuery) {
      filtered = filtered.filter(blog => 
        blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.authorName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // 카테고리 필터
    if (categoryFilter) {
      filtered = filtered.filter(blog => blog.category === categoryFilter);
    }
    
    // 태그 필터
    if (tagFilter) {
      filtered = filtered.filter(blog => 
        blog.tags && blog.tags.includes(tagFilter)
      );
    }
    
    setFilteredBlogs(filtered);
  }, [contextBlogs, blogs, searchQuery, categoryFilter, tagFilter]);

  // Context의 블로그 목록을 사용 (새로 작성된 글이 포함됨)
  const displayBlogs = filteredBlogs;

  if (loading) {
    return <p className="text-gray-500 text-center mt-8">불러오는 중...</p>;
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={refreshBlogs}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const handleBlogClick = (blogId: string) => {
    navigate(`/blogs/${blogId}`);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category);
  };

  const handleTagFilter = (tag: string) => {
    setTagFilter(tag);
  };

  // 카테고리와 태그 데이터
  const categories = ["스포츠", "경기일정", "경기후기", "회원소식", "공지사항"];
  const popularTags = ["축구", "동호회", "소흘FC", "포천", "경기", "친목", "모임"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📚 블로그</h1>
              <p className="text-gray-600 mt-1">야고 스포츠 플랫폼의 최신 소식을 확인하세요</p>
            </div>
            <Link 
              to="/blogs/new" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium shadow-md"
            >
              ✏️ 새 글 작성
            </Link>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 검색 및 필터 */}
        <SearchFilter 
          onSearch={handleSearch}
          onCategoryFilter={handleCategoryFilter}
          onTagFilter={handleTagFilter}
          categories={categories}
          popularTags={popularTags}
        />
        
        {displayBlogs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">아직 작성된 블로그가 없습니다</h3>
            <p className="text-gray-600 mb-6">첫 번째 블로그 글을 작성해보세요!</p>
            <Link 
              to="/blogs/new" 
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              글 작성하기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayBlogs.map((blog) => (
              <BlogCard 
                key={blog.id} 
                blog={{
                  ...blog,
                  commentsCount: 0,
                  likes: Math.floor(Math.random() * 50),
                  views: Math.floor(Math.random() * 200),
                  category: "스포츠",
                  tags: ["축구", "동호회", "소흘FC"]
                }}
                onClick={() => handleBlogClick(blog.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
