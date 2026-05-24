import DashboardLayout from '@/components/DashboardLayout'
import TemplatesGallery from '@/components/templates/TemplatesGallery'
import type { GetServerSideProps } from 'next'

export default function TemplatesPage() {
  return (
    <DashboardLayout>
      <TemplatesGallery />
    </DashboardLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
