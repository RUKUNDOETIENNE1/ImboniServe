import React from 'react'
import Link from 'next/link'
import ArticleLayout from '@/components/ArticleLayout'
import NewsletterSignup from '@/components/NewsletterSignup'
import type { ArticleType } from '@/lib/content/constants'
import { ARTICLE_TYPE_LABELS, getTypePath } from '@/lib/content/constants'

interface ArticleCardData {
  id: string
  type: string
  title: string
  slug: string
  excerpt?: string | null
  coverImageId?: string | null
  publishedAt: string
  author?: { name?: string | null } | null
  topic?: { name?: string | null; slug?: string | null } | null
}

interface ArticleListingProps {
  sectionTitle: string
  sectionDescription?: string
  articles: ArticleCardData[]
  total: number
  page: number
  pageSize: number
  basePath: string
}

export default function ArticleListing({
  sectionTitle,
  sectionDescription,
  articles,
  total,
  page,
  pageSize,
  basePath,
}: ArticleListingProps) {
  const totalPages = Math.ceil(total / pageSize)

  return (
    <ArticleLayout title={`${sectionTitle} | ImboniServe`} metaDescription={sectionDescription}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{sectionTitle}</h1>
          {sectionDescription && (
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{sectionDescription}</p>
          )}
        </header>

        {articles.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-20">
            No articles published yet. Check back soon.
          </p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => {
              const articlePath = `/${getTypePath(article.type)}/${article.slug}`
              return (
                <Link
                  key={article.id}
                  href={articlePath}
                  className="group block bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 dark:border-gray-700"
                >
                  <div className="p-6">
                    {article.topic && (
                      <span className="inline-block text-xs font-medium text-imboni-blue dark:text-blue-400 mb-2">
                        {article.topic.name}
                      </span>
                    )}
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-imboni-blue dark:group-hover:text-blue-400 transition">
                      {article.title}
                    </h2>
                    {article.excerpt && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-3 text-xs text-gray-400">
                      {article.author?.name && <span>{article.author.name}</span>}
                      {article.publishedAt && (
                        <span>
                          {new Date(article.publishedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mt-12 flex items-center justify-center gap-4">
            {page > 1 && (
              <Link
                href={`${basePath}?page=${page - 1}`}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                ← Previous
              </Link>
            )}
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`${basePath}?page=${page + 1}`}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                Next →
              </Link>
            )}
          </nav>
        )}

        <div className="mt-16">
          <NewsletterSignup variant="inline" />
        </div>
      </div>
    </ArticleLayout>
  )
}
