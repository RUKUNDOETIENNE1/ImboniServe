/**
 * GET /api/invoices/[id]/download
 *
 * Returns an HTML invoice (print-ready) for a given Invoice record.
 * The browser can save it as PDF using Ctrl+P → Save as PDF.
 * Puppeteer-based PDF generation is available as an option if needed.
 *
 * Only the business owner / admin can download their invoices.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { prisma } from '@/lib/prisma'

function formatRWF(cents: number): string {
  return `RWF ${(cents / 100).toLocaleString('en-RW', { minimumFractionDigits: 0 })}`
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString('en-RW', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { id } = req.query
  const { userId, businessId } = ctx

  const invoice = await prisma.invoice.findUnique({
    where: { id: String(id) },
    include: {
      subscription: {
        include: {
          plan: { select: { name: true, code: true } },
          business: { select: { name: true, phone: true, city: true, ownerId: true, id: true } },
        },
      },
    },
  })

  if (!invoice) return res.status(404).json({ error: 'Invoice not found' })

  const business = invoice.subscription.business
  const isAdmin = (ctx.roles || []).includes('ADMIN')

  if (!isAdmin && business.ownerId !== userId && business.id !== businessId) {
    return res.status(403).json({ error: 'Unauthorized' })
  }

  const plan = invoice.subscription.plan
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Invoice ${invoice.invoiceNumber} — Imboni Serve</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: #1e293b; background: #fff; padding: 40px; max-width: 680px; margin: auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .brand { font-size: 24px; font-weight: 700; color: #1e3a5f; }
    .brand-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
    .badge { background: ${invoice.status === 'PAID' ? '#dcfce7' : '#fef9c3'}; color: ${invoice.status === 'PAID' ? '#166534' : '#854d0e'}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .meta-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
    .meta-value { font-size: 14px; font-weight: 500; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #1e3a5f; color: #fff; padding: 10px 12px; text-align: left; font-size: 12px; }
    td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .total-row td { font-weight: 700; font-size: 15px; background: #f8fafc; }
    .footer { text-align: center; color: #94a3b8; font-size: 11px; margin-top: 40px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Imboni Serve</div>
      <div class="brand-sub">Restaurant Management Platform</div>
    </div>
    <span class="badge">${invoice.status}</span>
  </div>

  <div class="meta">
    <div>
      <div class="meta-label">Invoice Number</div>
      <div class="meta-value">${invoice.invoiceNumber}</div>
    </div>
    <div>
      <div class="meta-label">Invoice Date</div>
      <div class="meta-value">${formatDate(invoice.createdAt)}</div>
    </div>
    <div>
      <div class="meta-label">Due Date</div>
      <div class="meta-value">${formatDate(invoice.dueDate)}</div>
    </div>
    ${invoice.paidAt ? `<div>
      <div class="meta-label">Paid On</div>
      <div class="meta-value">${formatDate(invoice.paidAt)}</div>
    </div>` : ''}
    <div>
      <div class="meta-label">Bill To</div>
      <div class="meta-value">${business.name}<br><span style="color:#64748b;font-size:12px">${business.city}, Rwanda • ${business.phone}</span></div>
    </div>
    <div>
      <div class="meta-label">Payment Method</div>
      <div class="meta-value">${invoice.paymentMethod ?? 'N/A'}</div>
    </div>
  </div>

  <hr class="divider">

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Plan</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Monthly Subscription — ${plan.name} Plan</td>
        <td>${plan.code}</td>
        <td style="text-align:right">${formatRWF(invoice.amountCents)}</td>
      </tr>
      <tr class="total-row">
        <td colspan="2">Total</td>
        <td style="text-align:right">${formatRWF(invoice.amountCents)} ${invoice.currency}</td>
      </tr>
    </tbody>
  </table>

  ${invoice.paymentReference ? `<p style="font-size:12px;color:#64748b">Payment Ref: ${invoice.paymentReference}</p>` : ''}

  <div class="footer">
    <p>Imboni Serve — Digital Management Platform for Rwanda's Hospitality Industry</p>
    <p style="margin-top:4px">Questions? Contact support at ${process.env.APP_URL || 'https://imboni.rw'}</p>
    <p style="margin-top:4px">Generated on ${new Date().toLocaleString('en-RW')} (EAT)</p>
  </div>

  <script>
    // Auto-trigger print dialog for PDF saving
    if (window.location.search.includes('print=1')) {
      window.onload = () => window.print();
    }
  </script>
</body>
</html>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Content-Disposition', `inline; filename="invoice-${invoice.invoiceNumber}.html"`)
  return res.status(200).send(html)
}

export default requirePermission('payments.read')(handler)
