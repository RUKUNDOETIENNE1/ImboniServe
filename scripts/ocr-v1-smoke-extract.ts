import 'dotenv/config'

import crypto from 'node:crypto'
import puppeteer from 'puppeteer'

import { prisma } from '../src/lib/prisma'
import { StorageService } from '../src/lib/services/storage.service'
import { extractQueue } from '../src/lib/die/queue/queues'

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function renderSampleReceiptBuffers(): Promise<{ png: Buffer; pdf: Buffer }> {
  const html = `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; padding: 28px; }
        .hdr { display:flex; justify-content:space-between; }
        .box { border:1px solid #e5e7eb; padding:16px; border-radius:10px; }
        h1 { font-size: 20px; margin: 0 0 6px 0; }
        .meta { font-size: 12px; color: #111827; }
        table { width:100%; border-collapse: collapse; margin-top: 14px; }
        th, td { border-bottom: 1px solid #e5e7eb; text-align:left; padding: 10px 6px; font-size: 12px; }
        th { background: #f9fafb; }
        .right { text-align:right; }
        .total { margin-top: 16px; font-weight: 700; font-size: 14px; text-align:right; }
        .pagebreak { page-break-after: always; }
      </style>
    </head>
    <body>
      <div class="hdr">
        <div>
          <h1>Fresh Produce Ltd</h1>
          <div class="meta">Invoice #INV-1001</div>
          <div class="meta">Invoice Date: 2026-06-25</div>
          <div class="meta">Currency: RWF</div>
        </div>
        <div class="box">
          <div class="meta">Bill To: Nyama Cafe</div>
          <div class="meta">Kigali, RW</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th class="right">Qty</th>
            <th>Unit</th>
            <th class="right">Unit Price</th>
            <th class="right">Line Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tomatoes</td>
            <td class="right">50</td>
            <td>kg</td>
            <td class="right">2500</td>
            <td class="right">125000</td>
          </tr>
          <tr>
            <td>Onions</td>
            <td class="right">20</td>
            <td>kg</td>
            <td class="right">1800</td>
            <td class="right">36000</td>
          </tr>
          <tr>
            <td>Cooking Oil</td>
            <td class="right">10</td>
            <td>l</td>
            <td class="right">7000</td>
            <td class="right">70000</td>
          </tr>
        </tbody>
      </table>

      <div class="total">Total Amount: 231000 RWF</div>

      <div class="pagebreak"></div>

      <h1>Fresh Produce Ltd (Page 2)</h1>
      <div class="meta">Notes: Thank you for your business.</div>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th class="right">Qty</th>
            <th>Unit</th>
            <th class="right">Unit Price</th>
            <th class="right">Line Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Rice</td>
            <td class="right">25</td>
            <td>kg</td>
            <td class="right">3200</td>
            <td class="right">80000</td>
          </tr>
        </tbody>
      </table>
    </body>
  </html>
  `

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 900, height: 1400, deviceScaleFactor: 1 })
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const png = await page.screenshot({ fullPage: true, type: 'png' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
    })

    return { png: Buffer.from(png), pdf: Buffer.from(pdf) }
  } finally {
    await browser.close()
  }
}

async function ensureScanJobAndDocument(args: {
  businessId: string
  userId: string
  storageKey: string
  sourceMime: string
  sourceHash: string
}): Promise<{ scanJobId: string; scannedDocumentId: string }> {
  const existing = await prisma.scanJob.findFirst({
    where: { businessId: args.businessId, sourceHash: args.sourceHash },
    select: { id: true },
  })

  if (existing?.id) {
    const doc = await prisma.scannedDocument.findUnique({ where: { scanJobId: existing.id }, select: { id: true } })
    if (!doc?.id) throw new Error('Existing ScanJob found but ScannedDocument missing')
    return { scanJobId: existing.id, scannedDocumentId: doc.id }
  }

  const { scanJobId, scannedDocumentId } = await prisma.$transaction(async (tx) => {
    const scanJob = await tx.scanJob.create({
      data: {
        businessId: args.businessId,
        createdByUserId: args.userId,
        documentType: 'SUPPLIER_INVOICE',
        sourceFileKey: args.storageKey,
        sourceMime: args.sourceMime,
        sourceHash: args.sourceHash,
        status: 'UPLOADED',
      },
      select: { id: true },
    })

    const scannedDocument = await tx.scannedDocument.create({
      data: {
        scanJobId: scanJob.id,
        businessId: args.businessId,
        documentType: 'SUPPLIER_INVOICE',
        status: 'UPLOADED',
        lifecycleState: 'UPLOADED',
      },
      select: { id: true },
    })

    await tx.documentEventTimeline.create({
      data: {
        scannedDocumentId: scannedDocument.id,
        stage: 'upload',
        status: 'UPLOADED',
        metadata: {
          documentType: 'SUPPLIER_INVOICE',
          mimeType: args.sourceMime,
          sourceHash: args.sourceHash,
          uploadedAt: new Date().toISOString(),
        },
      },
    })

    await tx.documentProcessingLog.create({
      data: { scanJobId: scanJob.id, stage: 'upload', level: 'info', message: 'File uploaded (smoke)' },
    })

    return { scanJobId: scanJob.id, scannedDocumentId: scannedDocument.id }
  })

  return { scanJobId, scannedDocumentId }
}

async function waitForReviewRequired(scannedDocumentId: string, timeoutMs = 120_000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const doc = await prisma.scannedDocument.findUnique({
      where: { id: scannedDocumentId },
      select: { lifecycleState: true, status: true, confidenceOverall: true, validationScore: true },
    })
    if (!doc) throw new Error('ScannedDocument not found')
    if (doc.lifecycleState === 'REVIEW_REQUIRED') return doc
    await sleep(1500)
  }
  throw new Error('Timed out waiting for REVIEW_REQUIRED')
}

async function main() {
  const biz = await prisma.business.findFirst({ select: { id: true, ownerId: true, name: true } })
  if (!biz) throw new Error('No business found in database')

  const user = await prisma.user.findUnique({ where: { id: biz.ownerId }, select: { id: true, email: true } })
  if (!user) throw new Error('Business owner user not found')

  console.log('[OCR-V1] Using business:', { id: biz.id, name: biz.name })
  console.log('[OCR-V1] Using user:', { id: user.id, email: user.email })

  const { png, pdf } = await renderSampleReceiptBuffers()

  const pngUpload = await StorageService.uploadPrivateDocument(png, 'ocr-v1-sample.png', 'image/png', biz.id)
  const pdfUpload = await StorageService.uploadPrivateDocument(pdf, 'ocr-v1-sample.pdf', 'application/pdf', biz.id)

  const pngHash = crypto.createHash('sha256').update(png).digest('hex')
  const pdfHash = crypto.createHash('sha256').update(pdf).digest('hex')

  const pngDoc = await ensureScanJobAndDocument({
    businessId: biz.id,
    userId: user.id,
    storageKey: pngUpload.storageKey,
    sourceMime: 'image/png',
    sourceHash: pngHash,
  })

  const pdfDoc = await ensureScanJobAndDocument({
    businessId: biz.id,
    userId: user.id,
    storageKey: pdfUpload.storageKey,
    sourceMime: 'application/pdf',
    sourceHash: pdfHash,
  })

  console.log('[OCR-V1] Enqueue image extract:', pngDoc)
  await extractQueue.add(
    'extract',
    { scanJobId: pngDoc.scanJobId, fileKey: pngUpload.storageKey, mime: 'image/png', documentType: 'SUPPLIER_INVOICE' },
    { jobId: pngDoc.scanJobId }
  )

  console.log('[OCR-V1] Enqueue pdf extract:', pdfDoc)
  await extractQueue.add(
    'extract',
    { scanJobId: pdfDoc.scanJobId, fileKey: pdfUpload.storageKey, mime: 'application/pdf', documentType: 'SUPPLIER_INVOICE' },
    { jobId: pdfDoc.scanJobId }
  )

  console.log('[OCR-V1] Waiting for REVIEW_REQUIRED (image)...')
  const imgState = await waitForReviewRequired(pngDoc.scannedDocumentId)
  const imgCounts = await prisma.scannedDocumentItem.count({ where: { scannedDocumentId: pngDoc.scannedDocumentId } })
  const imgHeaderCount = await prisma.extractedDocumentHeaderField.count({ where: { scannedDocumentId: pngDoc.scannedDocumentId } })
  console.log('[OCR-V1] Image result:', { ...imgState, headerFields: imgHeaderCount, lineItems: imgCounts })

  console.log('[OCR-V1] Waiting for REVIEW_REQUIRED (pdf)...')
  const pdfState = await waitForReviewRequired(pdfDoc.scannedDocumentId)
  const pdfCounts = await prisma.scannedDocumentItem.count({ where: { scannedDocumentId: pdfDoc.scannedDocumentId } })
  const pdfHeaderCount = await prisma.extractedDocumentHeaderField.count({ where: { scannedDocumentId: pdfDoc.scannedDocumentId } })
  console.log('[OCR-V1] PDF result:', { ...pdfState, headerFields: pdfHeaderCount, lineItems: pdfCounts })

  console.log('[OCR-V1] DONE')
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('[OCR-V1] FAIL', e)
    process.exit(1)
  })
