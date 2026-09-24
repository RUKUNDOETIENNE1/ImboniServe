import type { GetServerSideProps } from 'next'
import { prisma } from '@/lib/prisma'
import { getTypePath } from '@/lib/content/constants'

function generateSiteMap(baseUrl: string, articles: Array<{ slug: string; type: string; publishedAt: Date | null; updatedAt: Date }>) {
  const staticPages = [
    '/',
    '/pricing',
    '/discover',
    '/store',
    '/faq',
    '/terms',
    '/privacy',
    '/cookies',
    '/login',
    '/signup',
    '/unsubscribe',
    '/blog',
    '/stories',
    '/insights',
    '/guides',
  ]

  const staticUrls = staticPages
    .map((path) => `  <url>\n    <loc>${baseUrl}${path}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${path === '/' ? '1.0' : '0.6'}</priority>\n  </url>`)
    .join('\n')

  const articleUrls = articles
    .map((a) => {
      const path = `/${getTypePath(a.type)}/${a.slug}`
      const lastmod = a.updatedAt.toISOString()
      return `  <url>\n    <loc>${baseUrl}${path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${articleUrls}
</urlset>`
}

export const getServerSideProps: GetServerSideProps = async ({ res, req }) => {
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'imboniserve.com'
  const baseUrl = `${proto}://${host}`

  const articles = await (prisma as any).editorialArticle.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { lte: new Date() },
    },
    select: {
      slug: true,
      type: true,
      publishedAt: true,
      updatedAt: true,
    },
    orderBy: [{ publishedAt: 'desc' }],
  })

  const sitemap = generateSiteMap(baseUrl, articles)

  res.setHeader('Content-Type', 'application/xml')
  res.write(sitemap)
  res.end()

  return { props: {} }
}

export default function SiteMap() {
  return null
}
