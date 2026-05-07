import type { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const params = new URLSearchParams(query as Record<string, string>).toString()
  return {
    redirect: {
      destination: `/discover${params ? `?${params}` : ''}`,
      permanent: true,
    },
  }
}

export default function ExploreBusinessesAlias() {
  return null
}
