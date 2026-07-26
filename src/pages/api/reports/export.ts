import type { NextApiRequest, NextApiResponse } from 'next'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { ReportService } from '@/lib/services/report.service'
import { prisma } from '@/lib/prisma'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { businessId } = ctx

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { type, date } = req.query
  const reportType = (type as string) || 'daily'

  try {
    let report: any
    let periodLabel: string
    let business: any

    business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true, currency: true, taxMode: true, taxRate: true },
    })

    if (reportType === 'daily') {
      const targetDate = date ? new Date(date as string) : new Date()
      report = await ReportService.generateDailyReport(businessId, targetDate)
      periodLabel = `Daily Report — ${targetDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
    } else if (reportType === 'weekly') {
      report = await ReportService.generateWeeklyReport(businessId, date ? new Date(date as string) : undefined)
      periodLabel = `Weekly Report — ${new Date(report.startDate).toLocaleDateString()} to ${new Date(report.endDate).toLocaleDateString()}`
    } else {
      const now = new Date()
      report = await ReportService.generateMonthlyReport(businessId, now.getFullYear(), now.getMonth() + 1)
      periodLabel = `Monthly Report — ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    }

    const currency = business?.currency || 'RWF'
    const businessName = business?.name || 'Your Business'
    const fmt = (cents: number) => `${currency} ${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

    const revenue = report.sales?.revenue || report.summary?.revenue || 0
    const cost = report.profit?.cost || report.summary?.cost || 0
    const profit = report.profit?.profit || report.summary?.profit || 0
    const margin = report.profit?.margin || report.summary?.margin || 0
    const orderCount = report.sales?.count || 0
    const avgOrder = orderCount > 0 ? revenue / orderCount : 0

    // Build payment breakdown rows
    const paymentRows = (report.paymentMethods || [])
      .map((p: any) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${p.method}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${p.count}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${fmt(p.amount)}</td>
        </tr>
      `)
      .join('')

    // Build top items rows (weekly/monthly)
    const topItemsRows = (report.topSellingItems || [])
      .slice(0, 10)
      .map((item: any, i: number) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${i + 1}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${item.name || item.menuItemName || '—'}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${item.quantity || item.count || 0}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${fmt(item.revenueCents || item.totalRevenueCents || 0)}</td>
        </tr>
      `)
      .join('')

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${periodLabel}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; padding: 40px; }
  .header { text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #0ea5e9; }
  .header h1 { font-size: 24px; color: #0ea5e9; margin-bottom: 4px; }
  .header p { font-size: 14px; color: #64748b; }
  .business-name { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
  .period { font-size: 13px; color: #64748b; }
  .generated { font-size: 11px; color: #94a3b8; margin-top: 8px; }
  .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
  .summary-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; }
  .summary-card .label { font-size: 12px; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  .summary-card .value { font-size: 22px; font-weight: 700; }
  .summary-card.revenue .value { color: #16a34a; }
  .summary-card.cost .value { color: #dc2626; }
  .summary-card.profit .value { color: #2563eb; }
  .summary-card.margin .value { color: #7c3aed; }
  .section { margin-bottom: 28px; }
  .section h2 { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #334155; }
  table { width: 100%; border-collapse: collapse; }
  th { padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
  td { font-size: 13px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
</style>
</head>
<body>
  <div class="header">
    <div class="business-name">${businessName}</div>
    <h1>${periodLabel}</h1>
    <p class="generated">Generated on ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
  </div>

  <div class="summary-grid">
    <div class="summary-card revenue">
      <div class="label">Revenue</div>
      <div class="value">${fmt(revenue)}</div>
    </div>
    <div class="summary-card cost">
      <div class="label">Cost</div>
      <div class="value">${fmt(cost)}</div>
    </div>
    <div class="summary-card profit">
      <div class="label">Net Profit</div>
      <div class="value">${fmt(profit)}</div>
    </div>
    <div class="summary-card margin">
      <div class="label">Margin</div>
      <div class="value">${margin.toFixed(1)}%</div>
    </div>
  </div>

  <div class="section">
    <h2>Sales Summary</h2>
    <table>
      <thead>
        <tr>
          <th>Metric</th>
          <th style="text-align: right;">Value</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">Total Orders</td><td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${orderCount}</td></tr>
        <tr><td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">Total Revenue</td><td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${fmt(revenue)}</td></tr>
        <tr><td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">Average Order Value</td><td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${fmt(avgOrder)}</td></tr>
        <tr><td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">Total Cost</td><td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #dc2626;">${fmt(cost)}</td></tr>
        <tr><td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">Net Profit</td><td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #16a34a; font-weight: 600;">${fmt(profit)}</td></tr>
        <tr style="background: #f8fafc;"><td style="padding: 8px 12px; font-weight: 600;">Profit Margin</td><td style="padding: 8px 12px; text-align: right; font-weight: 700; color: #2563eb;">${margin.toFixed(1)}%</td></tr>
      </tbody>
    </table>
  </div>

  ${paymentRows ? `
  <div class="section">
    <h2>Payment Method Breakdown</h2>
    <table>
      <thead>
        <tr>
          <th>Method</th>
          <th style="text-align: right;">Count</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>${paymentRows}</tbody>
    </table>
  </div>` : ''}

  ${topItemsRows ? `
  <div class="section">
    <h2>Top Selling Items</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Item</th>
          <th style="text-align: right;">Quantity</th>
          <th style="text-align: right;">Revenue</th>
        </tr>
      </thead>
      <tbody>${topItemsRows}</tbody>
    </table>
  </div>` : ''}

  ${report.inventory?.alerts?.length ? `
  <div class="section">
    <h2>Inventory Alerts</h2>
    <table>
      <thead>
        <tr><th>Item</th><th style="text-align: right;">Current Stock</th><th style="text-align: right;">Min Level</th></tr>
      </thead>
      <tbody>
        ${report.inventory.alerts.map((a: any) => `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${a.name}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #dc2626;">${a.currentStock} ${a.unit || ''}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${a.minimumStockLevel} ${a.unit || ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>` : ''}

  <div class="footer">
    Generated by ImboniServe — Hospitality Intelligence Platform<br>
    This report is for internal use only.
  </div>
</body>
</html>`

    // Use Puppeteer to generate PDF
    const puppeteer = require('puppeteer')
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    })
    await browser.close()

    const filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    return res.status(200).send(pdf)
  } catch (error) {
    console.error('PDF export error:', error)
    return res.status(500).json({ error: 'Failed to generate PDF report' })
  }
}

export default requirePermission('reports.view')(handler)
