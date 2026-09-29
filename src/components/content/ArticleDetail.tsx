import React from 'react'
import Link from 'next/link'
import ArticleLayout from '@/components/ArticleLayout'
import NewsletterSignup from '@/components/NewsletterSignup'
import SocialShare from '@/components/SocialShare'
import { PRODUCT_KEYS } from '@/config/product-keys'
import { getTypePath } from '@/lib/content/constants'

interface ArticleDetailProps {
  article: {
    id: string
    type: string
    title: string
    subtitle?: string | null
    slug: string
    excerpt?: string | null
    bodyHtml: string
    publishedAt: string
    updatedAt: string
    coverImageUrl?: string | null
    topic?: { name?: string | null; slug?: string | null } | null
    tags?: Array<{ id: string; name: string; slug: string }> | null
    author?: { name?: string | null } | null
    seoMeta: {
      metaTitle: string
      metaDescription: string
      canonicalUrl: string
      ogTitle: string
      ogDescription: string
      ogImage?: string | null
      twitterCard: string
      noIndex: boolean
    }
    productLinks?: Array<{
      productKey: string
      productLabel?: string | null
      linkType: string
    }> | null
    readingTime: number
    canonicalUrl: string
  }
  relatedArticles: Array<{
    id: string
    title: string
    slug: string
    type: string
    excerpt?: string | null
    coverImageId?: string | null
    publishedAt: string
  }>
  sectionName: string
  sectionPath: string
}

export default function ArticleDetail({
  article,
  relatedArticles,
  sectionName,
  sectionPath,
}: ArticleDetailProps) {
  return (
    <ArticleLayout
      title={article.seoMeta.metaTitle}
      metaDescription={article.seoMeta.metaDescription}
      canonicalUrl={article.seoMeta.canonicalUrl}
      ogTitle={article.seoMeta.ogTitle}
      ogDescription={article.seoMeta.ogDescription}
      ogImage={article.seoMeta.ogImage || undefined}
      publishedAt={article.publishedAt}
      updatedAt={article.updatedAt}
      authorName={article.author?.name || undefined}
      articleSection={article.topic?.name || undefined}
      noIndex={article.seoMeta.noIndex}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <nav className="mb-6 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 overflow-hidden">
          <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-300 shrink-0">Home</Link>
          <span className="shrink-0">/</span>
          <Link href={sectionPath} className="hover:text-gray-700 dark:hover:text-gray-300 shrink-0">{sectionName}</Link>
          <span className="shrink-0">/</span>
          <span className="text-gray-700 dark:text-gray-300 truncate min-w-0">{article.title}</span>
        </nav>

        <header className="mb-8">
          {article.topic && (
            <span className="inline-block text-sm font-medium text-imboni-blue dark:text-blue-400 mb-3">
              {article.topic.name}
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
            {article.title}
          </h1>
          {article.subtitle && (
            <p className="mt-3 text-xl text-gray-600 dark:text-gray-400">{article.subtitle}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            {article.author?.name && <span>By {article.author.name}</span>}
            {article.publishedAt && (
              <span>
                {new Date(article.publishedAt).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })}
              </span>
            )}
            <span>{article.readingTime} min read</span>
          </div>
        </header>

        {article.coverImageUrl && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img src={article.coverImageUrl} alt={article.title} className="w-full h-auto object-cover" />
          </div>
        )}

        <article
          className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-a:text-imboni-blue dark:prose-a:text-blue-400 prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
        />

        {article.productLinks && article.productLinks.length > 0 && (
          <div className="mt-10 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Related ImboniServe Features
            </h3>
            <div className="flex flex-wrap gap-3">
              {article.productLinks.map((pl) => {
                const product = PRODUCT_KEYS[pl.productKey]
                return (
                  <Link
                    key={pl.productKey}
                    href={product?.url || '#'}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-imboni-blue dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                  >
                    {pl.productLabel || product?.label || pl.productKey}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {article.tags && article.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span key={tag.id} className="inline-block px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full">
                {tag.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <SocialShare url={article.canonicalUrl} title={article.title} text={article.excerpt || article.title} />
        </div>

        <div className="mt-12">
          <NewsletterSignup variant="inline" />
        </div>

        {relatedArticles.length > 0 && (
          <div className="mt-16">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Related Articles</h3>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedArticles.map((ra) => {
                const path = `/${getTypePath(ra.type)}/${ra.slug}`
                return (
                  <Link key={ra.id} href={path} className="group block bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-5 border border-gray-100 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-imboni-blue dark:group-hover:text-blue-400 transition">{ra.title}</h4>
                    {ra.excerpt && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{ra.excerpt}</p>}
                    <span className="mt-3 block text-xs text-gray-400">
                      {new Date(ra.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </ArticleLayout>
  )
}
