import type { GetServerSideProps } from 'next'

function generateSiteMap(baseUrl: string) {
  const pages = [
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
  ]
  const urls = pages
    .map((path) => `  <url>\n    <loc>${baseUrl}${path}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${path === '/' ? '1.0' : '0.6'}</priority>\n  </url>`) 
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}

export const getServerSideProps: GetServerSideProps = async ({ res, req }) => {
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'imboniserve.com'
  const baseUrl = `${proto}://${host}`

  const sitemap = generateSiteMap(baseUrl)

  res.setHeader('Content-Type', 'application/xml')
  res.write(sitemap)
  res.end()

  return { props: {} }
}

export default function SiteMap() {
  return null
}
