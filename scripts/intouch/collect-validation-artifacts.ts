import { prisma } from '../../src/lib/prisma'

function parseArgs() {
  const args = process.argv.slice(2)
  const out: Record<string, string> = {}
  for (let i = 0; i < args.length; i++) {
    const [k, v] = args[i].split('=')
    if (k && v) out[k.replace(/^--/, '')] = v
  }
  return out
}

async function main() {
  const args = parseArgs()
  const id = args.id
  const ref = args.ref
  const order = args.order

  if (!id && !ref && !order) {
    console.error('Usage: tsx scripts/intouch/collect-validation-artifacts.ts --id=<paymentTransactionId> | --ref=<providerReference> | --order=<orderId>')
    process.exit(1)
  }

  const tx = await prisma.paymentTransaction.findFirst({
    where: {
      OR: [
        id ? { id } : undefined,
        ref ? { referenceId: ref } : undefined,
        order ? { transactionId: order } : undefined,
      ].filter(Boolean) as any,
    },
    include: {
      subscription: true,
    },
  })

  if (!tx) {
    console.error('PaymentTransaction not found')
    process.exit(2)
  }

  const billingEvents = await prisma.billingEvent.findMany({
    where: { paymentTransactionId: tx.id },
    orderBy: { occurredAt: 'asc' },
  })

  const sub = tx.subscriptionId
    ? await prisma.subscription.findUnique({ where: { id: tx.subscriptionId } })
    : null

  const auditLogs = await prisma.activityLog.findMany({
    where: { businessId: tx.businessId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const out = {
    requestPayloadSentToInTouch: tx.rawRequest,
    providerResponseAtInitiation: tx.rawStatus,
    webhookPayloadReceived: tx.rawCallback, // webhook handler stores payload here
    paymentTransaction: tx,
    billingEvents,
    subscription: sub,
    recentAuditLogs: auditLogs,
  }

  // Pretty-print JSON
  console.log(JSON.stringify(out, null, 2))
}

main().finally(async () => {
  await prisma.$disconnect()
})
