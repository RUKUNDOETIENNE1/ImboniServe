import { makeDetailPage } from '@/lib/content/detail-page'

const { getServerSideProps, default: Page } = makeDetailPage('guides')

export { getServerSideProps }
export default Page
