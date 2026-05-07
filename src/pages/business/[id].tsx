import type { GetServerSideProps } from 'next'
import { prisma } from '@/lib/prisma'

export const getServerSideProps: GetServerSideProps = async ({ params, query }) => {
  const id = params?.id as string | undefined
  if (!id) {
    return { notFound: true }
  }

  try {
    const profile = await prisma.businessProfile.findUnique({
      where: { businessId: id },
      select: { slug: true },
    })

    if (profile?.slug) {
      const qs = new URLSearchParams(query as Record<string, string>).toString()
      return {
        redirect: {
          destination: `/discover/${profile.slug}${qs ? `?${qs}` : ''}`,
          permanent: false,
        },
      }
    }

    return { notFound: true }
  } catch (_) {
    return { notFound: true }
  }
}

export default function BusinessIdAlias() {
  return null
}
