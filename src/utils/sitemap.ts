import { useEffect, useState } from "react";

// 사이트맵 생성 함수
export function generateSitemap(blogs: Array<{ id: string; title: string; createdAt: any }>) {
  const baseUrl = window.location.origin;
  const currentDate = new Date().toISOString();
  
  const staticPages = [
    {
      url: `${baseUrl}/`,
      lastmod: currentDate,
      changefreq: "daily",
      priority: "1.0"
    },
    {
      url: `${baseUrl}/blogs`,
      lastmod: currentDate,
      changefreq: "daily",
      priority: "0.8"
    },
    {
      url: `${baseUrl}/blogs/new`,
      lastmod: currentDate,
      changefreq: "weekly",
      priority: "0.6"
    },
    {
      url: `${baseUrl}/clubs`,
      lastmod: currentDate,
      changefreq: "daily",
      priority: "0.7"
    },
    {
      url: `${baseUrl}/market`,
      lastmod: currentDate,
      changefreq: "daily",
      priority: "0.7"
    },
    {
      url: `${baseUrl}/meetups`,
      lastmod: currentDate,
      changefreq: "daily",
      priority: "0.7"
    }
  ];

  const blogPages = blogs.map(blog => ({
    url: `${baseUrl}/blogs/${blog.id}`,
    lastmod: new Date(blog.createdAt?.seconds * 1000 || blog.createdAt).toISOString(),
    changefreq: "weekly",
    priority: "0.6"
  }));

  const allPages = [...staticPages, ...blogPages];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return sitemap;
}

// 사이트맵 다운로드 함수
export function downloadSitemap(sitemap: string) {
  const blob = new Blob([sitemap], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sitemap.xml';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 사이트맵 API 엔드포인트 생성
export function createSitemapEndpoint() {
  return async (req: Request) => {
    // 실제 구현에서는 데이터베이스에서 블로그 목록을 가져와야 함
    const mockBlogs = [
      { id: "1", title: "야고 플랫폼 블로그 시스템", createdAt: { seconds: Date.now() / 1000 } },
      { id: "2", title: "블로그 기능 테스트", createdAt: { seconds: Date.now() / 1000 - 3600 } }
    ];
    
    const sitemap = generateSitemap(mockBlogs);
    
    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600' // 1시간 캐시
      }
    });
  };
}

// robots.txt 생성
export function generateRobotsTxt() {
  const baseUrl = window.location.origin;
  
  return `User-agent: *
Allow: /

# 사이트맵
Sitemap: ${baseUrl}/sitemap.xml

# 크롤링 지연 (선택사항)
Crawl-delay: 1

# 네이버 봇 허용
User-agent: Yeti
Allow: /

# 구글 봇 허용
User-agent: Googlebot
Allow: /

# 빙 봇 허용
User-agent: Bingbot
Allow: /`;
}

// robots.txt 다운로드 함수
export function downloadRobotsTxt() {
  const robotsTxt = generateRobotsTxt();
  const blob = new Blob([robotsTxt], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'robots.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
