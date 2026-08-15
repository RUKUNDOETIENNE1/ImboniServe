import { makeDetailPage } from '@/lib/content/detail-page'

const { getServerSideProps, default: Page } = makeDetailPage('blog')

export { getServerSideProps }
export default Page
