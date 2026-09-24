import { GetServerSideProps } from 'next'
import ArticleListing from '@/components/content/ArticleListing'
import { getRouteTypes } from '@/lib/content/constants'
import { prisma } from '@/lib/prisma'

const ROUTE_META: Record<string, { title: string; desc: string }> = {
  blog: { title: 'Blog', desc: 'Articles, announcements, and updates from ImboniServe.' },
  stories: { title: 'Stories', desc: 'Founder stories, product stories, and customer case studies.' },
  insights: { title: 'Insights', desc: 'Industry insights and analysis for hospitality businesses.' },
  guides: { title: 'Guides', desc: 'Practical guides to help you grow your hospitality business.' },
}

export function makeListingPage(route: string): { getServerSideProps: GetServerSideProps; default: React.FC<any> } {
  const meta = ROUTE_META[route] || ROUTE_META.blog

  const getServerSideProps: GetServerSideProps = async (ctx) => {
    const types = getRouteTypes(route)
    const page = parseInt((ctx.query.page as string) || '1') || 1
    const pageSize = 12

    const where = {
      status: 'PUBLISHED',
      publishedAt: { lte: new Date() },
      type: { in: types },
    }

    const [items, total] = await Promise.all([
      (prisma as any).editorialArticle.findMany({
        where,
        orderBy: [{ publishedAt: 'desc' }],
        take: pageSize,
        skip: (page - 1) * pageSize,
        include: {
          author: { select: { id: true, name: true } },
          topic: { select: { id: true, name: true, slug: true } },
        },
      }),
      (prisma as any).editorialArticle.count({ where }),
    ])

    return {
      props: {
        sectionTitle: meta.title,
        sectionDescription: meta.desc,
        articles: JSON.parse(JSON.stringify(items)),
        total,
        page,
        pageSize,
        basePath: `/${route}`,
      },
    }
  }

  const Page: React.FC<any> = (props) => <ArticleListing {...props} />

  return { getServerSideProps, default: Page }
}
