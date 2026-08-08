/**
 * Receipt & Invoice Generator
 * Generates HTML receipts/invoices for subscriptions and marketplace orders.
 * Can be extended to use Puppeteer for PDF generation if needed.
 */

interface ReceiptData {
  type: 'subscription' | 'marketplace'
  invoiceNumber: string
  date: Date
  paidAt?: Date
  dueDate?: Date
  status: string
  businessName: string
  businessPhone?: string
  businessCity?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  items: Array<{
    description: string
    quantity?: number
    unitPrice?: number
    total: number
  }>
  subtotal: number
  vat: number
  total: number
  currency: string
  paymentMethod?: string
  paymentReference?: string
  transactionId?: string
}

export class ReceiptGeneratorService {
  static generateHTML(data: ReceiptData): string {
    const fmt = (cents: number) => `${data.currency} ${(cents / 100).toLocaleString('en-RW', { minimumFractionDigits: 0 })}`
    const fmtDate = (d: Date) => new Date(d).toLocaleDateString('en-RW', { day: '2-digit', month: 'long', year: 'numeric' })

    const itemsHTML = data.items.map(item => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">${item.description}</td>
        ${item.quantity ? `<td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: center;">${item.quantity}</td>` : ''}
        ${item.unitPrice ? `<td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">${fmt(item.unitPrice)}</td>` : ''}
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">${fmt(item.total)}</td>
      </tr>
    `).join('')

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${data.type === 'subscription' ? 'Invoice' : 'Receipt'} ${data.invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: #1e293b; background: #fff; padding: 40px; max-width: 680px; margin: auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .brand { font-size: 24px; font-weight: 700; color: #1e3a5f; }
    .brand-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
    .badge { background: ${data.status === 'PAID' || data.status === 'SUCCESS' ? '#dcfce7' : '#fef9c3'}; color: ${data.status === 'PAID' || data.status === 'SUCCESS' ? '#166534' : '#854d0e'}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .meta-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
    .meta-value { font-size: 14px; font-weight: 500; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #1e3a5f; color: #fff; padding: 10px 12px; text-align: left; font-size: 12px; }
    td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .summary { background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .summary-row.total { font-weight: 700; font-size: 16px; border-top: 2px solid #cbd5e1; padding-top: 12px; margin-top: 8px; }
    .footer { text-align: center; color: #94a3b8; font-size: 11px; margin-top: 40px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Imboni Serve</div>
      <div class="brand-sub">${data.type === 'subscription' ? 'Subscription Invoice' : 'Marketplace Receipt'}</div>
    </div>
    <span class="badge">${data.status}</span>
  </div>

  <div class="meta">
    <div>
      <div class="meta-label">${data.type === 'subscription' ? 'Invoice' : 'Receipt'} Number</div>
      <div class="meta-value">${data.invoiceNumber}</div>
    </div>
    <div>
      <div class="meta-label">Date</div>
      <div class="meta-value">${fmtDate(data.date)}</div>
    </div>
    ${data.dueDate ? `<div>
      <div class="meta-label">Due Date</div>
      <div class="meta-value">${fmtDate(data.dueDate)}</div>
    </div>` : ''}
    ${data.paidAt ? `<div>
      <div class="meta-label">Paid On</div>
      <div class="meta-value">${fmtDate(data.paidAt)}</div>
    </div>` : ''}
    <div>
      <div class="meta-label">Bill To</div>
      <div class="meta-value">${data.businessName}<br><span style="color:#64748b;font-size:12px">${data.businessCity || ''}, Rwanda${data.businessPhone ? ' • ' + data.businessPhone : ''}</span></div>
    </div>
    ${data.paymentMethod ? `<div>
      <div class="meta-label">Payment Method</div>
      <div class="meta-value">${data.paymentMethod.replace(/_/g, ' ')}</div>
    </div>` : ''}
  </div>

  <hr class="divider">

  <table>
    <thead>
      <tr>
        <th>Description</th>
        ${data.items.some(i => i.quantity) ? '<th style="text-align:center">Qty</th>' : ''}
        ${data.items.some(i => i.unitPrice) ? '<th style="text-align:right">Unit Price</th>' : ''}
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-row">
      <span>Subtotal</span>
      <span>${fmt(data.subtotal)}</span>
    </div>
    <div class="summary-row">
      <span>VAT (18%)</span>
      <span>${fmt(data.vat)}</span>
    </div>
    <div class="summary-row total">
      <span>Total</span>
      <span>${fmt(data.total)} ${data.currency}</span>
    </div>
  </div>

  ${data.paymentReference ? `<p style="font-size:12px;color:#64748b">Payment Ref: ${data.paymentReference}</p>` : ''}
  ${data.transactionId ? `<p style="font-size:12px;color:#64748b;margin-top:4px">Transaction ID: ${data.transactionId}</p>` : ''}

  <div class="footer">
    <p>Imboni Serve — Digital Management Platform for Rwanda's Hospitality Industry</p>
    <p style="margin-top:4px">Questions? Contact support at ${process.env.APP_URL || 'https://imboni.rw'}</p>
    <p style="margin-top:4px">Generated on ${new Date().toLocaleString('en-RW')} (EAT)</p>
  </div>

  <script>
    if (window.location.search.includes('print=1')) {
      window.onload = () => window.print();
    }
  </script>
</body>
</html>`
  }

  static async generatePDFBuffer(data: ReceiptData): Promise<Buffer> {
    const html = this.generateHTML(data)
    const puppeteer = require('puppeteer')
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
    })
    await browser.close()
    return Buffer.from(pdfBuffer)
  }
}
