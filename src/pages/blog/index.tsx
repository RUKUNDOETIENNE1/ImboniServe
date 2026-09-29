import { makeListingPage } from '@/lib/content/listing-page'

const { getServerSideProps, default: Page } = makeListingPage('blog')

export { getServerSideProps }
export default Page
