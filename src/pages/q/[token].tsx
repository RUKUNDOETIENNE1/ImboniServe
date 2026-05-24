import type { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const token = ctx.params?.token as string | undefined
  if (!token) return { notFound: true }

  try {
    const { prisma } = await import('@/lib/prisma')
    const qr = await prisma.qrCode.findUnique({
      where: { token },
      select: { targetUrl: true },
    })

    if (!qr?.targetUrl) {
      return { notFound: true }
    }

    // Best-effort: increment scan counter and update lastScannedAt
    try {
      await prisma.qrCode.update({
        where: { token },
        data: {
          scanCount: { increment: 1 } as any,
          lastScannedAt: new Date(),
        } as any,
      })
    } catch {}

    return {
      redirect: {
        destination: qr.targetUrl,
        permanent: false,
      },
    }
  } catch (e) {
    return { notFound: true }
  }
}

export default function QRRedirect() {
  return null
}
