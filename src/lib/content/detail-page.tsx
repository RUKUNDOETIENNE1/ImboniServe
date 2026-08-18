import { GetServerSideProps } from 'next'
import ArticleDetail from '@/components/content/ArticleDetail'
import { getRouteTypes, getTypePath } from '@/lib/content/constants'
import { renderMarkdown } from '@/lib/content/markdown'
import { readingTime } from '@/lib/content/slug'
import { prisma } from '@/lib/prisma'
import { PlatformMediaService } from '@/lib/content/platform-media.service'

const SECTION_META: Record<string, { name: string; path: string }> = {
  blog: { name: 'Blog', path: '/blog' },
  stories: { name: 'Stories', path: '/stories' },
  insights: { name: 'Insights', path: '/insights' },
  guides: { name: 'Guides', path: '/guides' },
}

export function makeDetailPage(route: string): { getServerSideProps: GetServerSideProps; default: React.FC<any> } {
  const section = SECTION_META[route] || SECTION_META.blog

  const getServerSideProps: GetServerSideProps = async (ctx) => {
    const { slug } = ctx.params as { slug: string }
    const types = getRouteTypes(route)

    const article = await (prisma as any).editorialArticle.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
        publishedAt: { lte: new Date() },
        type: { in: types },
      },
      include: {
        author: { select: { id: true, name: true } },
        topic: { select: { id: true, name: true, slug: true } },
        articleTags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        productLinks: { orderBy: { sortOrder: 'asc' } },
      },
    })

    if (!article) return { notFound: true }

    let relatedArticles: any[] = []
    if (article.topicId) {
      relatedArticles = await (prisma as any).editorialArticle.findMany({
        where: {
          topicId: article.topicId,
          status: 'PUBLISHED',
          publishedAt: { lte: new Date() },
          id: { not: article.id },
        },
        orderBy: [{ publishedAt: 'desc' }],
        take: 3,
        select: { id: true, title: true, slug: true, type: true, excerpt: true, coverImageId: true, publishedAt: true },
      })
    }

    let coverImageUrl: string | null = null
    if (article.coverImageId) {
      const media = await PlatformMediaService.getMedia(article.coverImageId)
      if (media) coverImageUrl = PlatformMediaService.getPublicUrl(media.storageKey)
    }

    const bodyHtml = article.bodyFormat === 'MARKDOWN' ? renderMarkdown(article.body) : article.body
    const seoMeta = article.seoMeta || {}
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${ctx.req.headers.host || 'imboniserve.com'}`
    const articlePath = `/${getTypePath(article.type)}/${article.slug}`

    const publicArticle = {
      id: article.id,
      type: article.type,
      title: article.title,
      subtitle: article.subtitle,
      slug: article.slug,
      excerpt: article.excerpt,
      bodyHtml,
      publishedAt: article.publishedAt?.toISOString() || null,
      updatedAt: article.updatedAt?.toISOString() || null,
      coverImageUrl,
      topic: article.topic,
      tags: (article.articleTags || []).map((at: any) => at.tag),
      author: article.author,
      seoMeta: {
        metaTitle: seoMeta.metaTitle || `${article.title} | ImboniServe`,
        metaDescription: seoMeta.metaDescription || article.excerpt || '',
        canonicalUrl: seoMeta.canonicalUrl || `${baseUrl}${articlePath}`,
        ogTitle: seoMeta.ogTitle || seoMeta.metaTitle || article.title,
        ogDescription: seoMeta.ogDescription || seoMeta.metaDescription || article.excerpt || '',
        ogImage: coverImageUrl,
        twitterCard: seoMeta.twitterCard || 'summary_large_image',
        noIndex: seoMeta.noIndex || false,
      },
      productLinks: (article.productLinks || []).map((pl: any) => ({
        productKey: pl.productKey,
        productLabel: pl.productLabel,
        linkType: pl.linkType,
      })),
      readingTime: readingTime(article.body),
      canonicalUrl: `${baseUrl}${articlePath}`,
    }

    return {
      props: {
        article: JSON.parse(JSON.stringify(publicArticle)),
        relatedArticles: JSON.parse(JSON.stringify(relatedArticles)),
        sectionName: section.name,
        sectionPath: section.path,
      },
    }
  }

  const Page: React.FC<any> = (props) => <ArticleDetail {...props} />

  return { getServerSideProps, default: Page }
}
