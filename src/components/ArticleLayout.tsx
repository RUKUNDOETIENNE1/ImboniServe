import React from 'react'
import Head from 'next/head'
import PublicLayout from './PublicLayout'

interface ArticleLayoutProps {
  children: React.ReactNode
  title: string
  metaDescription?: string
  canonicalUrl?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  publishedAt?: string
  updatedAt?: string
  authorName?: string
  articleSection?: string
  noIndex?: boolean
}

export default function ArticleLayout({
  children,
  title,
  metaDescription,
  canonicalUrl,
  ogTitle,
  ogDescription,
  ogImage,
  publishedAt,
  updatedAt,
  authorName,
  articleSection,
  noIndex,
}: ArticleLayoutProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  const pageTitle = `${title} | ImboniServe`
  const description = metaDescription || ''
  const canonical = canonicalUrl || undefined
  const ogImg = ogImage || (siteUrl ? `${siteUrl}/imgs/logo2.png` : '/imgs/logo2.png')

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    image: ogImg ? [ogImg] : undefined,
    datePublished: publishedAt || undefined,
    dateModified: updatedAt || publishedAt || undefined,
    author: authorName ? { '@type': 'Person', name: authorName } : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'ImboniServe',
      logo: {
        '@type': 'ImageObject',
        url: siteUrl ? `${siteUrl}/imgs/logo2.png` : '/imgs/logo2.png',
      },
    },
    mainEntityOfPage: canonical ? { '@type': 'WebPage', '@id': canonical } : undefined,
    articleSection: articleSection || undefined,
  }

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        {canonical && <link rel="canonical" href={canonical} />}
        {noIndex && <meta name="robots" content="noindex,nofollow" />}

        <meta property="og:type" content="article" />
        <meta property="og:title" content={ogTitle || pageTitle} />
        <meta property="og:description" content={ogDescription || description} />
        {canonical && <meta property="og:url" content={canonical} />}
        <meta property="og:image" content={ogImg} />
        {publishedAt && <meta property="article:published_time" content={publishedAt} />}
        {updatedAt && <meta property="article:modified_time" content={updatedAt} />}
        {articleSection && <meta property="article:section" content={articleSection} />}
        {authorName && <meta property="article:author" content={authorName} />}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle || pageTitle} />
        <meta name="twitter:description" content={ogDescription || description} />
        <meta name="twitter:image" content={ogImg} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
      </Head>
      <PublicLayout title={pageTitle} metaDescription={description}>
        {children}
      </PublicLayout>
    </>
  )
}
