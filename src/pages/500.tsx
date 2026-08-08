import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'

export default function Custom500() {
  const { t } = useTranslation()
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '72px', margin: '0', color: '#f56565' }}>500</h1>
      <h2 style={{ fontSize: '24px', fontWeight: 'normal', color: '#4a5568', marginTop: '10px' }}>
        {t('errors.server_error', 'Server Error')}
      </h2>
      <p style={{ color: '#718096', marginTop: '20px', maxWidth: '500px' }}>
        {t('errors.server_error_desc', 'Something went wrong on our end. Please try again later.')}
      </p>
      <Link href="/" style={{ 
        marginTop: '30px',
        padding: '12px 24px',
        background: '#667eea',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '8px',
        fontWeight: '500'
      }}>
        {t('errors.go_home', 'Go Back Home')}
      </Link>
    </div>
  )
}
