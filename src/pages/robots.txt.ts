import type { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async ({ res, req }) => {
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'imboniserve.com'
  const baseUrl = `${proto}://${host}`

  const robots = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`

  res.setHeader('Content-Type', 'text/plain')
  res.write(robots)
  res.end()

  return { props: {} }
}

export default function Robots() {
  return null
}
