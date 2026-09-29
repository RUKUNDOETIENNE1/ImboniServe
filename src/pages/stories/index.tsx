import { makeListingPage } from '@/lib/content/listing-page'

const { getServerSideProps, default: Page } = makeListingPage('stories')

export { getServerSideProps }
export default Page
