import { makeListingPage } from '@/lib/content/listing-page'

const { getServerSideProps, default: Page } = makeListingPage('guides')

export { getServerSideProps }
export default Page
