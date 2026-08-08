import { prisma } from '@/lib/prisma'

function pad(n: number, width = 4) {
  const s = String(n)
  return s.length >= width ? s : '0'.repeat(width - s.length) + s
}

export class InvoiceNumberService {
  /**
   * Generate a human-friendly invoice number with daily sequence.
   * Format: PREFIX-YYYYMMDD-#### (e.g., INV-20260601-0007)
   */
  static async next(prefix = 'INV'): Promise<string> {
    const now = new Date()
    const y = now.getFullYear()
    const m = (now.getMonth() + 1).toString().padStart(2, '0')
    const d = now.getDate().toString().padStart(2, '0')

    const dateKey = `${y}${m}${d}`
    const likePrefix = `${prefix}-${dateKey}-`

    // Find the latest invoice number for today and increment its suffix
    const last = await prisma.paymentTransaction.findFirst({
      where: { invoiceNumber: { startsWith: likePrefix } },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    })

    let nextSeq = 1
    if (last?.invoiceNumber) {
      const parts = last.invoiceNumber.split('-')
      const lastSuffix = parts[2] || '0000'
      const parsed = parseInt(lastSuffix, 10)
      if (!isNaN(parsed)) nextSeq = parsed + 1
    }

    const seq = pad(nextSeq)
    return `${prefix}-${dateKey}-${seq}`
  }
}
