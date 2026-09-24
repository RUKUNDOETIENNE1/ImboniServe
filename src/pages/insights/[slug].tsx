import { makeDetailPage } from '@/lib/content/detail-page'

const { getServerSideProps, default: Page } = makeDetailPage('insights')

export { getServerSideProps }
export default Page
