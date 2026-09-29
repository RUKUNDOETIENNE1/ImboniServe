import { makeDetailPage } from '@/lib/content/detail-page'

const { getServerSideProps, default: Page } = makeDetailPage('stories')

export { getServerSideProps }
export default Page
