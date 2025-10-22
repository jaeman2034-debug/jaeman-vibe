import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
}

export function useSEO({
  title = "야고 스포츠 플랫폼",
  description = "야고 스포츠 플랫폼 - 스포츠 커뮤니티, 마켓, 모임, 구인구직을 한 곳에서",
  keywords = "야고, 스포츠, 커뮤니티, 마켓, 모임, 구인구직, 블로그",
  ogTitle,
  ogDescription,
  ogImage = "/og-image.jpg",
  ogType = "website",
  canonical
}: SEOProps = {}) {
  useEffect(() => {
    // 기본 메타 태그 업데이트
    document.title = title;
    
    // Description 메타 태그
    updateMetaTag("description", description);
    
    // Keywords 메타 태그
    updateMetaTag("keywords", keywords);
    
    // Open Graph 메타 태그
    updateMetaTag("og:title", ogTitle || title);
    updateMetaTag("og:description", ogDescription || description);
    updateMetaTag("og:image", ogImage);
    updateMetaTag("og:type", ogType);
    updateMetaTag("og:url", window.location.href);
    
    // Twitter Card 메타 태그
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", ogTitle || title);
    updateMetaTag("twitter:description", ogDescription || description);
    updateMetaTag("twitter:image", ogImage);
    
    // Canonical URL
    if (canonical) {
      updateCanonicalLink(canonical);
    }
    
    // 네이버 검색엔진 최적화
    updateMetaTag("naver-site-verification", "네이버 사이트 인증 코드");
    
  }, [title, description, keywords, ogTitle, ogDescription, ogImage, ogType, canonical]);
}

function updateMetaTag(name: string, content: string) {
  if (!content) return;
  
  // 기존 메타 태그 찾기
  let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
  
  if (!meta) {
    // Open Graph 태그인 경우
    meta = document.querySelector(`meta[property="${name}"]`) as HTMLMetaElement;
  }
  
  if (!meta) {
    // 새 메타 태그 생성
    meta = document.createElement("meta");
    if (name.startsWith("og:") || name.startsWith("twitter:")) {
      meta.setAttribute("property", name);
    } else {
      meta.setAttribute("name", name);
    }
    document.head.appendChild(meta);
  }
  
  meta.setAttribute("content", content);
}

function updateCanonicalLink(url: string) {
  let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
  
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  
  canonical.setAttribute("href", url);
}

// 블로그 전용 SEO 훅
export function useBlogSEO(blog?: {
  id: string;
  title: string;
  content: string;
  authorName: string;
  createdAt: any;
}) {
  const description = blog 
    ? `${blog.content.substring(0, 160)}...` 
    : "야고 스포츠 플랫폼 블로그 - 최신 스포츠 소식과 커뮤니티 정보";
  
  const title = blog 
    ? `${blog.title} - 야고 스포츠 블로그`
    : "야고 스포츠 블로그";
  
  const keywords = blog
    ? `야고, 스포츠, 블로그, ${blog.title}, ${blog.authorName}`
    : "야고, 스포츠, 블로그, 커뮤니티, 소식";
  
  useSEO({
    title,
    description,
    keywords,
    ogTitle: blog?.title,
    ogDescription: description,
    ogType: "article",
    canonical: blog ? `${window.location.origin}/blogs/${blog.id}` : undefined
  });
}
