import Document, { Html, Head, Main, NextScript, type DocumentContext } from 'next/document'

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    const locale = this.props.locale || 'en'
    return (
      <Html lang={locale}>
        <Head>
          {/* Viewport for responsive layouts */}
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          {/* PWA Meta Tags */}
          <meta name="application-name" content="Imboni Serve" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Imboni Serve" />
          <meta name="format-detection" content="telephone=no" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="theme-color" content="#667eea" />
          
          {/* Favicon */}
          <link rel="icon" type="image/png" href="/imgs/imboni-serve-favicon.png" />
          <link rel="apple-touch-icon" href="/imgs/imboni-serve-favicon.png" />
          
          {/* Manifest */}
          <link rel="manifest" href="/manifest.json" />
          
          {/* Performance: Preconnect/DNS Prefetch */}
          <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
          <link rel="dns-prefetch" href="//res.cloudinary.com" />
          <link rel="preconnect" href="https://storage.googleapis.com" crossOrigin="" />
          <link rel="dns-prefetch" href="//storage.googleapis.com" />
          <link rel="preconnect" href="https://img.youtube.com" crossOrigin="" />
          <link rel="dns-prefetch" href="//img.youtube.com" />
          <link rel="preconnect" href="https://ws-eu.pusher.com" crossOrigin="" />
          <link rel="dns-prefetch" href="//ws-eu.pusher.com" />
          <link rel="preconnect" href="https://sockjs-eu.pusher.com" crossOrigin="" />
          <link rel="dns-prefetch" href="//sockjs-eu.pusher.com" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
