import { prisma } from '@/lib/prisma'
import { DocumentLifecycleService, DocumentLifecycleState } from './document-lifecycle.service'

type FieldRow = { fieldName: string; fieldValue: string; confidence: number | null }

const HEADER_FIELD_MAP: Record<string, string[]> = {
  invoiceNumber: ['invoicenumber', 'invoiceid', 'invoiceno', 'invoice#', 'invoicenum', 'inv#', 'invno', 'inv_number', 'documentnumber', 'docnumber'],
  purchaseOrderNumber: ['purchaseordernumber', 'purchaseorderid', 'ponumber', 'po#', 'pono', 'purchaseorder', 'orderreference', 'ordernumber'],
  deliveryReference: ['deliveryreference', 'deliverynumber', 'deliveryno', 'deliveryid', 'shipmentnumber', 'waybillnumber', 'dnnumber', 'dn#'],
  documentDate: ['documentdate', 'invoicedate', 'date', 'issuedate', 'transactiondate', 'billingdate', 'invoicedt'],
  currency: ['currency', 'currencycode', 'invoicecurrency'],
  subtotalCents: ['subtotal', 'subtotalamount', 'nettotal', 'netamount', 'amountbeforetax', 'taxableamount', 'baseamount'],
  taxCents: ['tax', 'taxamount', 'vat', 'vatamount', 'gst', 'gstamount', 'salestax', 'taxrate', 'totaltax'],
  totalCents: ['total', 'totalamount', 'grandtotal', 'invoicetotal', 'amountdue', 'totaldue', 'totalincludingtax', 'amountpayable', 'totalpayable'],
}

const LINE_FIELD_MAP: Record<string, string[]> = {
  quantity: ['quantity', 'qty', 'amount', 'units', 'count', 'numberofunits', 'orderedqty', 'receivedqty'],
  unit: ['unit', 'unitofmeasure', 'uom', 'measureunit', 'measure'],
  unitPriceCents: ['unitprice', 'price', 'unitcost', 'cost', 'rate', 'priceper', 'unitamount', 'listprice'],
  totalPriceCents: ['totalprice', 'total', 'linetotal', 'lineamount', 'amount', 'extendedprice', 'extendedamount', 'totalcost'],
}

function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function buildReverseMap(map: Record<string, string[]>): Map<string, string> {
  const out = new Map<string, string>()
  for (const [target, aliases] of Object.entries(map)) {
    for (const alias of aliases) out.set(alias, target)
  }
  return out
}

const HEADER_REVERSE = buildReverseMap(HEADER_FIELD_MAP)
const LINE_REVERSE = buildReverseMap(LINE_FIELD_MAP)

function parseCents(raw: string): number | null {
  if (!raw) return null
  let s = raw.replace(/[^\d.,]/g, '')
  if (!s) return null
  if (/^[\d.]+,(\d{2})$/.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.')
  } else {
    s = s.replace(/,/g, '')
  }
  const n = parseFloat(s)
  return Number.isNaN(n) ? null : Math.round(n * 100)
}

function parseDate(raw: string): Date | null {
  if (!raw) return null
  const native = new Date(raw.trim())
  if (!Number.isNaN(native.getTime())) return native
  const dmyMatch = raw.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch
    const candidate = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
    if (!Number.isNaN(candidate.getTime())) return candidate
  }
  return null
}

function parseQuantity(raw: string): number | null {
  if (!raw) return null
  const n = parseFloat(raw.replace(/[^\d.,]/g, '').replace(/,/g, ''))
  return Number.isNaN(n) ? null : n
}

function computeConfidence(rows: FieldRow[]): number | null {
  const vals = rows.map((r) => r.confidence).filter((v): v is number => typeof v === 'number')
  if (vals.length === 0) return null
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 1000) / 1000
}

export interface DocumentIntelligenceReplayResult {
  scannedDocumentId: string
  headerFieldsPromoted: number
  lineItemsEnriched: number
  confidenceOverall: number | null
  validationScore: number | null
}

export class DocumentIntelligenceReplayService {
  static async replayIntelligenceStage(scannedDocumentId: string): Promise<DocumentIntelligenceReplayResult> {
    const p: any = prisma

    const headerRows: FieldRow[] = await p.extractedDocumentHeaderField.findMany({
      where: { scannedDocumentId },
      select: { fieldName: true, fieldValue: true, confidence: true },
    })

    const itemRows: Array<{ id: string; lineNo: number }> = await p.scannedDocumentItem.findMany({
      where: { scannedDocumentId },
      select: { id: true, lineNo: true },
      orderBy: { lineNo: 'asc' },
    })

    const headerCandidates: Record<string, { value: string; confidence: number }> = {}
    for (const row of headerRows) {
      const target = HEADER_REVERSE.get(normalizeKey(row.fieldName))
      if (!target) continue
      const confidence = row.confidence ?? 0
      if (!headerCandidates[target] || confidence > headerCandidates[target].confidence) {
        headerCandidates[target] = { value: row.fieldValue, confidence }
      }
    }

    const headerUpdate: Record<string, unknown> = {}
    let lowConfidence = false
    for (const [key, { value, confidence }] of Object.entries(headerCandidates)) {
      if (confidence < 0.5) lowConfidence = true
      switch (key) {
        case 'invoiceNumber':
        case 'purchaseOrderNumber':
        case 'deliveryReference':
          headerUpdate[key] = value.trim()
          break
        case 'currency':
          headerUpdate[key] = value.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || undefined
          break
        case 'documentDate': {
          const parsed = parseDate(value)
          if (parsed) headerUpdate[key] = parsed
          break
        }
        case 'subtotalCents':
        case 'taxCents':
        case 'totalCents': {
          const parsed = parseCents(value)
          if (parsed !== null) headerUpdate[key] = parsed
          break
        }
      }
    }

    if (Object.keys(headerUpdate).length > 0) {
      await p.scannedDocument.update({ where: { id: scannedDocumentId }, data: headerUpdate })
    }

    let lineItemsEnriched = 0
    for (const item of itemRows) {
      const fields: FieldRow[] = await p.extractedDocumentLineField.findMany({
        where: { scannedDocumentItemId: item.id },
        select: { fieldName: true, fieldValue: true, confidence: true },
      })

      const candidates: Record<string, { value: string; confidence: number }> = {}
      for (const row of fields) {
        const target = LINE_REVERSE.get(normalizeKey(row.fieldName))
        if (!target) continue
        const confidence = row.confidence ?? 0
        if (!candidates[target] || confidence > candidates[target].confidence) {
          candidates[target] = { value: row.fieldValue, confidence }
        }
      }

      const update: Record<string, unknown> = {}
      const confidences: Record<string, number> = {}
      for (const [key, { value, confidence }] of Object.entries(candidates)) {
        if (confidence < 0.5) lowConfidence = true
        switch (key) {
          case 'quantity': {
            const parsed = parseQuantity(value)
            if (parsed !== null) {
              update[key] = parsed
              confidences[key] = confidence
            }
            break
          }
          case 'unit':
            update[key] = value.trim().toUpperCase().slice(0, 10)
            confidences[key] = confidence
            break
          case 'unitPriceCents':
          case 'totalPriceCents': {
            const parsed = parseCents(value)
            if (parsed !== null) {
              update[key] = parsed
              confidences[key] = confidence
            }
            break
          }
        }
      }

      if (Object.keys(update).length > 0) {
        await p.scannedDocumentItem.update({
          where: { id: item.id },
          data: { ...update, confidences: Object.keys(confidences).length > 0 ? confidences : undefined },
        })
        lineItemsEnriched += 1
      }
    }

    const confidenceOverall = computeConfidence(headerRows)
    const validationScore = lowConfidence ? 0.5 : confidenceOverall
    await DocumentLifecycleService.transitionDocumentLifecycle(
      scannedDocumentId,
      DocumentLifecycleState.INTELLIGENCE_DONE,
      {
        confidenceOverall,
        validationScore,
        headerFieldsPromoted: Object.keys(headerUpdate).length,
        lineItemsEnriched,
      },
      { expectedCurrentState: DocumentLifecycleState.EXTRACTED, stage: 'intelligence' },
    )

    return {
      scannedDocumentId,
      headerFieldsPromoted: Object.keys(headerUpdate).length,
      lineItemsEnriched,
      confidenceOverall,
      validationScore,
    }
  }
}
