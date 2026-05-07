import type { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/affiliate',
      permanent: false,
    },
  }
}

export default function AffiliateDashboardRedirect() {
  return null
}
