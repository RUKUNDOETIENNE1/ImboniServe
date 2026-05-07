import Link from 'next/link'

export default function Custom404() {
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
      <h1 style={{ fontSize: '72px', margin: '0', color: '#667eea' }}>404</h1>
      <h2 style={{ fontSize: '24px', fontWeight: 'normal', color: '#4a5568', marginTop: '10px' }}>
        Page Not Found
      </h2>
      <p style={{ color: '#718096', marginTop: '20px', maxWidth: '500px' }}>
        The page you're looking for doesn't exist or has been moved.
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
        Go Back Home
      </Link>
    </div>
  )
}
