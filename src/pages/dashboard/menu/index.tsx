import type { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/dashboard/menu/dynamic-edit',
      permanent: false,
    },
  }
}

export default function MenuIndex() {
  return null
}
