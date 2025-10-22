/**
 * SEO 및 메타데이터 관리
 */

export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

/**
 * 기본 SEO 메타데이터
 */
export const DEFAULT_SEO: SEOData = {
  title: 'YAGO VIBE - 스포츠인의 중고거래·모임·구인구직 올인원 플랫폼',
  description: '스포츠인을 위한 중고거래, 이벤트 모임, 구인구직 플랫폼. 안전하고 신뢰할 수 있는 스포츠 커뮤니티에서 거래하고 소통하세요.',
  keywords: [
    '스포츠', '중고거래', '이벤트', '구인구직', '커뮤니티',
    '축구', '농구', '야구', '테니스', '골프', '수영',
    '야고바이브', 'yagovibe', '스포츠마켓'
  ],
  image: '/og-image.png',
  url: 'https://app.yagovibe.com',
  type: 'website'
};

/**
 * 페이지별 SEO 데이터 생성
 */
export function generateSEOData(page: string, data?: Partial<SEOData>): SEOData {
  const baseSEO = { ...DEFAULT_SEO };
  
  switch (page) {
    case 'home':
      return {
        ...baseSEO,
        title: 'YAGO VIBE - 스포츠인의 올인원 플랫폼',
        description: '스포츠인을 위한 중고거래, 이벤트 모임, 구인구직 플랫폼'
      };
      
    case 'market':
      return {
        ...baseSEO,
        title: '중고거래 마켓 - YAGO VIBE',
        description: '스포츠 용품 중고거래 마켓. 안전하고 신뢰할 수 있는 거래를 경험하세요.',
        keywords: [...baseSEO.keywords!, '중고거래', '스포츠용품', '마켓']
      };
      
    case 'events':
      return {
        ...baseSEO,
        title: '스포츠 이벤트 - YAGO VIBE',
        description: '다양한 스포츠 이벤트와 모임에 참여하고 새로운 사람들과 만나보세요.',
        keywords: [...baseSEO.keywords!, '이벤트', '모임', '스포츠활동']
      };
      
    case 'jobs':
      return {
        ...baseSEO,
        title: '스포츠 구인구직 - YAGO VIBE',
        description: '스포츠 관련 일자리를 찾거나 인재를 구하는 곳입니다.',
        keywords: [...baseSEO.keywords!, '구인구직', '채용', '일자리', '스포츠직업']
      };
      
    case 'market-item':
      return {
        ...baseSEO,
        title: data?.title ? `${data.title} - YAGO VIBE` : '상품 상세',
        description: data?.description || '스포츠 용품 중고거래 상품을 확인해보세요.',
        type: 'product',
        ...data
      };
      
    case 'event-detail':
      return {
        ...baseSEO,
        title: data?.title ? `${data.title} - YAGO VIBE` : '이벤트 상세',
        description: data?.description || '스포츠 이벤트에 참여해보세요.',
        type: 'article',
        ...data
      };
      
    default:
      return { ...baseSEO, ...data };
  }
}

/**
 * JSON-LD 구조화 데이터 생성
 */
export function generateJsonLd(type: string, data: any): object {
  const baseUrl = 'https://app.yagovibe.com';
  
  switch (type) {
    case 'organization':
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'YAGO VIBE',
        url: baseUrl,
        logo: `${baseUrl}/icons/icon-512x512.png`,
        description: '스포츠인을 위한 중고거래·모임·구인구직 올인원 플랫폼',
        sameAs: [
          'https://www.instagram.com/yagovibe',
          'https://www.facebook.com/yagovibe'
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+82-2-1234-5678',
          contactType: 'customer service',
          availableLanguage: 'Korean'
        }
      };
      
    case 'product':
      return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: data.name,
        description: data.description,
        image: data.images || [],
        offers: {
          '@type': 'Offer',
          price: data.price,
          priceCurrency: 'KRW',
          availability: data.availability || 'https://schema.org/InStock',
          seller: {
            '@type': 'Person',
            name: data.sellerName || '판매자'
          }
        },
        category: data.category,
        condition: data.condition || 'https://schema.org/UsedCondition'
      };
      
    case 'event':
      return {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        location: {
          '@type': 'Place',
          name: data.locationName,
          address: data.locationAddress
        },
        organizer: {
          '@type': 'Organization',
          name: 'YAGO VIBE'
        },
        eventStatus: data.status || 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode'
      };
      
    case 'job-posting':
      return {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: data.title,
        description: data.description,
        datePosted: data.datePosted,
        validThrough: data.validThrough,
        employmentType: data.employmentType || 'FULL_TIME',
        hiringOrganization: {
          '@type': 'Organization',
          name: data.companyName || 'YAGO VIBE'
        },
        jobLocation: {
          '@type': 'Place',
          address: data.location
        },
        baseSalary: data.salary ? {
          '@type': 'MonetaryAmount',
          currency: 'KRW',
          value: {
            '@type': 'QuantitativeValue',
            value: data.salary,
            unitText: 'MONTH'
          }
        } : undefined
      };
      
    case 'breadcrumb':
      return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: data.items.map((item: any, index: number) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url
        }))
      };
      
    default:
      return {};
  }
}

/**
 * 메타 태그 생성
 */
export function generateMetaTags(seoData: SEOData): string {
  const {
    title,
    description,
    keywords,
    image,
    url,
    type,
    publishedTime,
    modifiedTime,
    author,
    section,
    tags
  } = seoData;
  
  const baseUrl = 'https://app.yagovibe.com';
  const fullImage = image?.startsWith('http') ? image : `${baseUrl}${image}`;
  const fullUrl = url?.startsWith('http') ? url : `${baseUrl}${url}`;
  
  return `
    <title>${title}</title>
    <meta name="description" content="${description}">
    ${keywords ? `<meta name="keywords" content="${keywords.join(', ')}">` : ''}
    <meta name="author" content="${author || 'YAGO VIBE'}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${fullImage}">
    <meta property="og:url" content="${fullUrl}">
    <meta property="og:type" content="${type || 'website'}">
    <meta property="og:site_name" content="YAGO VIBE">
    <meta property="og:locale" content="ko_KR">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${fullImage}">
    
    <!-- Additional Meta -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#0B1220">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="YAGO VIBE">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${fullUrl}">
    
    ${publishedTime ? `<meta property="article:published_time" content="${publishedTime}">` : ''}
    ${modifiedTime ? `<meta property="article:modified_time" content="${modifiedTime}">` : ''}
    ${author ? `<meta property="article:author" content="${author}">` : ''}
    ${section ? `<meta property="article:section" content="${section}">` : ''}
    ${tags ? tags.map(tag => `<meta property="article:tag" content="${tag}">`).join('\n    ') : ''}
  `.trim();
}

/**
 * 사이트맵 생성
 */
export function generateSitemap(pages: Array<{
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}>): string {
  const baseUrl = 'https://app.yagovibe.com';
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    ${page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : ''}
    ${page.changefreq ? `<changefreq>${page.changefreq}</changefreq>` : ''}
    ${page.priority ? `<priority>${page.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;
  
  return sitemap;
}

/**
 * 기본 사이트맵 페이지들
 */
export const DEFAULT_SITEMAP_PAGES = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/market', changefreq: 'hourly', priority: 0.9 },
  { url: '/events', changefreq: 'daily', priority: 0.9 },
  { url: '/jobs', changefreq: 'daily', priority: 0.8 },
  { url: '/clubs', changefreq: 'weekly', priority: 0.7 },
  { url: '/about', changefreq: 'monthly', priority: 0.5 },
  { url: '/privacy', changefreq: 'yearly', priority: 0.3 },
  { url: '/terms', changefreq: 'yearly', priority: 0.3 }
];
