// @ts-nocheck
import * as fs from 'fs'

const file = 'src/lib/die/services/procurement-reconciliation.service.ts'
let content = fs.readFileSync(file, 'utf8')

// Replace the resolution block at the "both PO and GRN matched" branch
// Normalize to LF for matching, then restore original line ending style
const hasCRLF = content.includes('\r\n')
const normalized = content.replace(/\r\n/g, '\n')

const oldBlock = `      return {\n        matchType: poDecision.matchType === 'EXACT_PO' ? 'EXACT_PO' : 'FUZZY_PO',\n        confidence: Math.max(poDecision.confidence, grnDecision.confidence),\n        purchaseOrderId: poDecision.purchaseOrderId,\n        goodsReceivedNoteId: grnDecision.goodsReceivedNoteId,\n      }\n    }`

const newBlock = `      // GRN exact-match (delivery reference) takes precedence over a fuzzy PO match.\n      // Exact PO match takes precedence over a fuzzy GRN match.\n      // When both are exact, GRN_MATCH is the canonical result (GRN is confirmed delivery).\n      const grnIsExact = grnDecision.kind === 'exact' && grnDecision.confidence >= 0.99\n      const poIsExact = poDecision.matchType === 'EXACT_PO'\n      const resolvedMatchType = grnIsExact ? 'GRN_MATCH' : poIsExact ? 'EXACT_PO' : 'FUZZY_PO'\n      return {\n        matchType: resolvedMatchType,\n        confidence: Math.max(poDecision.confidence, grnDecision.confidence),\n        purchaseOrderId: poDecision.purchaseOrderId,\n        goodsReceivedNoteId: grnDecision.goodsReceivedNoteId,\n      }\n    }`

if (!normalized.includes(oldBlock)) {
  console.error('ERROR: Could not find target block to replace')
  process.exit(1)
}

let patched = normalized.replace(oldBlock, newBlock)
if (hasCRLF) patched = patched.replace(/\n/g, '\r\n')
content = patched
fs.writeFileSync(file, content, 'utf8')
console.log('Patched successfully')
