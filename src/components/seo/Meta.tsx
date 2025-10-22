import React from 'react';

export function Meta({ 
  title, 
  description, 
  ogImage, 
  url, 
  locale = 'ko_KR' 
}: {
  title: string;
  description?: string;
  ogImage?: string;
  url?: string;
  locale?: string;
}) {
  return (
    <>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={locale} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      {url && <link rel="canonical" href={url} />}
      <meta name="twitter:card" content="summary_large_image" />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
    </>
  );
}
