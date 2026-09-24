import type { NextApiRequest, NextApiResponse } from 'next'
import { EditorialService } from '@/lib/content/editorial.service'
import { renderMarkdown } from '@/lib/content/markdown'
import { readingTime } from '@/lib/content/slug'
import { getTypePath } from '@/lib/content/constants'
import { PlatformMediaService } from '@/lib/content/platform-media.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { slug } = req.query as { slug: string }

  const result = await EditorialService.getPublishedBySlug(slug)
  if (!result) return res.status(404).json({ error: 'Article not found' })

  const { article, relatedArticles } = result

  const bodyHtml = article.bodyFormat === 'MARKDOWN'
    ? renderMarkdown(article.body)
    : article.body

  let coverImageUrl: string | null = null
  if (article.coverImageId) {
    const media = await PlatformMediaService.getMedia(article.coverImageId)
    if (media) coverImageUrl = PlatformMediaService.getPublicUrl(media.storageKey)
  }

  const seoMeta = article.seoMeta || {}
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.host || 'imboniserve.com'}`
  const articlePath = `/${getTypePath(article.type)}/${article.slug}`

  const publicArticle = {
    id: article.id,
    type: article.type,
    title: article.title,
    subtitle: article.subtitle,
    slug: article.slug,
    excerpt: article.excerpt,
    bodyHtml,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
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

  return res.status(200).json({ article: publicArticle, relatedArticles })
}
