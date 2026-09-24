import { NextPageContext } from 'next'
import { getTranslation, type Locale, defaultLocale } from '@/lib/i18n'

interface ErrorProps {
  statusCode?: number
  locale?: Locale
}

function Error({ statusCode, locale }: ErrorProps) {
  const t = (key: string, fallback: string) => getTranslation(locale || defaultLocale, key, fallback)
  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'system-ui' }}>
      <h1>
        {statusCode
          ? t('errors.server_error_code', `An error ${statusCode} occurred on server`)
          : t('errors.client_error', 'An error occurred on client')}
      </h1>
      <p>
        <a href="/" style={{ color: '#0070f3' }}>{t('errors.go_home_link', 'Go back home')}</a>
      </p>
    </div>
  )
}

Error.getInitialProps = ({ res, err, locale }: NextPageContext & { locale?: string }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode, locale: (locale as Locale) || defaultLocale }
}

export default Error
