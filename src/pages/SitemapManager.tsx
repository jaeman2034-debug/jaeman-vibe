import { useState } from "react";
import { generateSitemap, downloadSitemap, generateRobotsTxt, downloadRobotsTxt } from "../utils/sitemap";

export default function SitemapManager() {
  const [blogs] = useState([
    { id: "1", title: "야고 플랫폼 블로그 시스템", createdAt: { seconds: Date.now() / 1000 } },
    { id: "2", title: "블로그 기능 테스트", createdAt: { seconds: Date.now() / 1000 - 3600 } }
  ]);

  const handleGenerateSitemap = () => {
    const sitemap = generateSitemap(blogs);
    downloadSitemap(sitemap);
  };

  const handleGenerateRobotsTxt = () => {
    downloadRobotsTxt();
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6">
      <h1 className="text-3xl font-bold mb-6">🔍 SEO 관리 도구</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* 사이트맵 생성 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">📋 사이트맵 생성</h2>
          <p className="text-gray-600 mb-4">
            검색엔진이 사이트를 크롤링할 수 있도록 사이트맵을 생성합니다.
          </p>
          <button
            onClick={handleGenerateSitemap}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            sitemap.xml 다운로드
          </button>
        </div>

        {/* robots.txt 생성 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">🤖 robots.txt 생성</h2>
          <p className="text-gray-600 mb-4">
            검색엔진 크롤러에게 사이트 접근 규칙을 알려줍니다.
          </p>
          <button
            onClick={handleGenerateRobotsTxt}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            robots.txt 다운로드
          </button>
        </div>
      </div>

      {/* SEO 가이드 */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-yellow-800">📚 네이버 SEO 가이드</h2>
        <div className="space-y-3 text-yellow-700">
          <div>
            <strong>1. 네이버 서치어드바이저 등록:</strong>
            <ul className="ml-4 mt-1 space-y-1">
              <li>• <a href="https://searchadvisor.naver.com" target="_blank" rel="noopener noreferrer" className="underline">네이버 서치어드바이저</a> 접속</li>
              <li>• 사이트 등록 후 소유권 확인</li>
              <li>• 사이트맵 제출</li>
            </ul>
          </div>
          <div>
            <strong>2. 메타 태그 최적화:</strong>
            <ul className="ml-4 mt-1 space-y-1">
              <li>• 각 페이지에 고유한 title, description 설정</li>
              <li>• Open Graph 태그로 소셜 미디어 최적화</li>
              <li>• 키워드 기반 메타 태그 작성</li>
            </ul>
          </div>
          <div>
            <strong>3. 콘텐츠 최적화:</strong>
            <ul className="ml-4 mt-1 space-y-1">
              <li>• 정기적인 블로그 포스팅</li>
              <li>• 내부 링크 구조화</li>
              <li>• 이미지 alt 태그 설정</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 현재 블로그 목록 */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">📝 현재 블로그 목록</h2>
        <div className="space-y-2">
          {blogs.map(blog => (
            <div key={blog.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <h3 className="font-medium">{blog.title}</h3>
                <p className="text-sm text-gray-500">
                  URL: /blogs/{blog.id}
                </p>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(blog.createdAt?.seconds * 1000 || blog.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
