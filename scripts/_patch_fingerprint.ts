// @ts-nocheck
import * as fs from 'fs'

const file = 'src/lib/die/services/procurement-reconciliation.service.ts'
let content = fs.readFileSync(file, 'utf8')
const hasCRLF = content.includes('\r\n')
const normalized = content.replace(/\r\n/g, '\n')

// Fix 1: extend fingerprint to include deliveryReference
const oldFingerprintFn = "function buildFingerprint(doc: Pick<ScannedDocumentRecord, 'businessId' | 'documentType' | 'purchaseOrderNumber' | 'supplierId' | 'totalCents'>): string {\n  return createHash('sha256')\n    .update([\n      doc.businessId,\n      doc.documentType,\n      doc.purchaseOrderNumber ?? '',\n      doc.supplierId ?? '',\n      doc.totalCents?.toString() ?? '',\n    ].join('|'))\n    .digest('hex')\n}"

const newFingerprintFn = "function buildFingerprint(doc: Pick<ScannedDocumentRecord, 'businessId' | 'documentType' | 'purchaseOrderNumber' | 'supplierId' | 'totalCents' | 'deliveryReference'>): string {\n  return createHash('sha256')\n    .update([\n      doc.businessId,\n      doc.documentType,\n      doc.purchaseOrderNumber ?? '',\n      doc.supplierId ?? '',\n      doc.totalCents?.toString() ?? '',\n      doc.deliveryReference ?? '',\n    ].join('|'))\n    .digest('hex')\n}"

if (!normalized.includes(oldFingerprintFn)) {
  console.error('ERROR: Could not find buildFingerprint function')
  process.exit(1)
}

let patched = normalized.replace(oldFingerprintFn, newFingerprintFn)
if (hasCRLF) patched = patched.replace(/\n/g, '\r\n')
fs.writeFileSync(file, patched, 'utf8')
console.log('buildFingerprint patched successfully')
