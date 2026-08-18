import { makeListingPage } from '@/lib/content/listing-page'

const { getServerSideProps, default: Page } = makeListingPage('insights')

export { getServerSideProps }
export default Page
