"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcurementReconciliationService = void 0;
const crypto_1 = require("crypto");
const prisma_1 = require("../../prisma");
function normalizeIdentifier(value) {
    if (!value)
        return '';
    return value.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}
function normalizeText(value) {
    if (!value)
        return '';
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ');
}
function tokenize(value) {
    const normalized = normalizeText(value);
    if (!normalized)
        return [];
    return normalized.split(' ').filter(Boolean);
}
function clamp(n, min = 0, max = 1) {
    if (Number.isNaN(n))
        return min;
    return Math.min(max, Math.max(min, n));
}
function jaccardScore(aTokens, bTokens) {
    if (aTokens.length === 0 || bTokens.length === 0)
        return 0;
    const a = new Set(aTokens);
    const b = new Set(bTokens);
    const intersection = [...a].filter((t) => b.has(t)).length;
    const union = new Set([...a, ...b]).size;
    return union === 0 ? 0 : intersection / union;
}
function charOverlapScore(a, b) {
    if (!a || !b)
        return 0;
    if (a === b)
        return 1;
    const setA = new Set(a.replace(/\s+/g, '').split(''));
    const setB = new Set(b.replace(/\s+/g, '').split(''));
    const intersection = [...setA].filter((c) => setB.has(c)).length;
    const union = new Set([...setA, ...setB]).size;
    return union === 0 ? 0 : intersection / union;
}
function stringSimilarity(a, b) {
    const left = normalizeText(a);
    const right = normalizeText(b);
    if (!left || !right)
        return 0;
    if (left === right)
        return 1;
    if (left.includes(right) || right.includes(left)) {
        const longer = Math.max(left.length, right.length);
        const shorter = Math.min(left.length, right.length);
        return clamp(0.65 + (0.35 * shorter) / Math.max(1, longer));
    }
    const tokenScore = jaccardScore(tokenize(left), tokenize(right));
    const charScore = charOverlapScore(left, right);
    return clamp(tokenScore * 0.7 + charScore * 0.3);
}
function quantitySimilarity(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number')
        return 0.5;
    if (a === 0 && b === 0)
        return 1;
    const denom = Math.max(Math.abs(a), Math.abs(b), 1);
    const diff = Math.abs(a - b) / denom;
    return clamp(1 - diff);
}
function unitSimilarity(a, b) {
    const left = normalizeIdentifier(a);
    const right = normalizeIdentifier(b);
    if (!left || !right)
        return 0.5;
    return left === right ? 1 : 0.5;
}
function priceSimilarity(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number')
        return 0.5;
    if (a === 0 && b === 0)
        return 1;
    const denom = Math.max(Math.abs(a), Math.abs(b), 1);
    const diff = Math.abs(a - b) / denom;
    return clamp(1 - diff);
}
function dateDifferenceDays(a, b) {
    if (!a || !b)
        return null;
    const ms = Math.abs(a.getTime() - b.getTime());
    return ms / (1000 * 60 * 60 * 24);
}
function dateWindowScore(days, maxDays = 3) {
    if (days === null)
        return 0;
    if (days > maxDays)
        return 0;
    return clamp(1 - days / maxDays);
}
function legacyStateFor(matchType) {
    switch (matchType) {
        case 'EXACT_PO':
        case 'FUZZY_PO':
            return 'MATCHED_PO';
        case 'GRN_MATCH':
            return 'MATCHED_GRN';
        case 'CONFLICT':
            return 'CONFLICT';
        default:
            return 'UNMATCHED';
    }
}
function buildFingerprint(doc) {
    return (0, crypto_1.createHash)('sha256')
        .update([
        doc.businessId,
        doc.documentType,
        doc.purchaseOrderNumber ?? '',
        doc.supplierId ?? '',
        doc.totalCents?.toString() ?? '',
        doc.deliveryReference ?? '',
    ].join('|'))
        .digest('hex');
}
function scoreDocumentLineAgainstItem(docItem, candidate) {
    if (docItem.productId && candidate.productId && docItem.productId === candidate.productId) {
        return 1;
    }
    const nameScore = stringSimilarity(docItem.productName, candidate.productName);
    const quantityScore = quantitySimilarity(docItem.quantity, candidate.quantity);
    const unitScore = unitSimilarity(docItem.unit, candidate.unit);
    const priceScore = priceSimilarity(docItem.totalPriceCents, candidate.totalPriceCents);
    return clamp(nameScore * 0.65 + quantityScore * 0.15 + unitScore * 0.1 + priceScore * 0.1);
}
function scoreItemCollection(docItems, candidateItems) {
    if (docItems.length === 0 || candidateItems.length === 0) {
        return { score: 0, coverage: 0, detail: [] };
    }
    let total = 0;
    let matched = 0;
    const detail = [];
    for (const docItem of docItems) {
        let best = 0;
        for (const candidate of candidateItems) {
            const candidateScore = scoreDocumentLineAgainstItem(docItem, candidate);
            if (candidateScore > best)
                best = candidateScore;
            if (best === 1)
                break;
        }
        detail.push({ docLine: docItem.lineNo, best });
        total += best;
        if (best >= 0.7)
            matched += 1;
    }
    const average = total / docItems.length;
    const coverage = matched / docItems.length;
    const balance = Math.min(docItems.length, candidateItems.length) / Math.max(docItems.length, candidateItems.length);
    return {
        score: clamp(average * 0.75 + coverage * 0.15 + balance * 0.1),
        coverage,
        detail,
    };
}
function isPartialGrn(status) {
    if (!status)
        return true;
    const normalized = status.toUpperCase();
    return normalized.includes('PARTIAL') || normalized.includes('PENDING');
}
function buildLinkType(confidence, matchType) {
    if (matchType === 'CONFLICT' || matchType === 'NO_MATCH' || matchType === 'RECONCILIATION_FAILED') {
        return 'REVIEW_SUGGESTION';
    }
    return confidence >= 0.85 ? 'AUTO_MATCH' : 'REVIEW_SUGGESTION';
}
function dedupeLinks(rows) {
    const seen = new Set();
    const deduped = [];
    for (const row of rows) {
        const key = `${row.scannedDocumentId}:${row.entityType}:${row.entityId}`;
        if (seen.has(key))
            continue;
        seen.add(key);
        deduped.push(row);
    }
    return deduped;
}
async function logProcessingEvent(scanJobId, level, message, payload) {
    const p = prisma_1.prisma;
    await p.documentProcessingLog.create({
        data: {
            scanJobId,
            stage: 'reconciliation',
            level,
            message,
            payload: payload,
        },
    });
}
class ProcurementReconciliationService {
    static async reconcileDocument(scannedDocumentId) {
        const p = prisma_1.prisma;
        const doc = await p.scannedDocument.findUnique({
            where: { id: scannedDocumentId },
            select: {
                id: true,
                scanJobId: true,
                businessId: true,
                documentType: true,
                supplierId: true,
                purchaseOrderNumber: true,
                deliveryReference: true,
                documentDate: true,
                currency: true,
                totalCents: true,
                items: {
                    select: {
                        id: true,
                        lineNo: true,
                        productName: true,
                        productId: true,
                        supplierProductId: true,
                        quantity: true,
                        unit: true,
                        unitPriceCents: true,
                        totalPriceCents: true,
                    },
                    orderBy: { lineNo: 'asc' },
                },
            },
        });
        if (!doc) {
            throw new Error(`ScannedDocument not found: ${scannedDocumentId}`);
        }
        if (!doc.businessId) {
            throw new Error(`ScannedDocument ${scannedDocumentId} is missing businessId`);
        }
        const [purchaseOrders, goodsReceivedNotes] = await Promise.all([
            p.purchaseOrder.findMany({
                where: { businessId: doc.businessId },
                select: {
                    id: true,
                    poNumber: true,
                    supplierId: true,
                    businessId: true,
                    totalCents: true,
                    status: true,
                    createdAt: true,
                    items: {
                        select: {
                            id: true,
                            productName: true,
                            productId: true,
                            quantity: true,
                            unit: true,
                            unitPriceCents: true,
                            totalPriceCents: true,
                        },
                        orderBy: { createdAt: 'asc' },
                    },
                },
            }),
            p.goodsReceivedNote.findMany({
                where: { businessId: doc.businessId },
                select: {
                    id: true,
                    grnNumber: true,
                    purchaseOrderId: true,
                    supplierId: true,
                    businessId: true,
                    receivedAt: true,
                    status: true,
                    items: {
                        select: {
                            id: true,
                            productName: true,
                            orderedQuantity: true,
                            receivedQuantity: true,
                            unit: true,
                            unitPriceCents: true,
                            totalPriceCents: true,
                            poItemId: true,
                        },
                        orderBy: { createdAt: 'asc' },
                    },
                },
            }),
        ]);
        const fingerprint = buildFingerprint(doc);
        const startedAt = new Date();
        const currencyMismatch = !!doc.currency && doc.currency.toUpperCase() !== 'RWF';
        await logProcessingEvent(doc.scanJobId, 'info', 'RECONCILIATION_STARTED', {
            scannedDocumentId: doc.id,
            businessId: doc.businessId,
            fingerprint,
        }).catch((logErr) => {
            console.error('[ProcurementReconciliation] Failed to log start', logErr);
        });
        try {
            const existing = await p.procurementReconciliation.findUnique({
                where: { fingerprint },
                select: {
                    id: true,
                    scannedDocumentId: true,
                    purchaseOrderId: true,
                    goodsReceivedNoteId: true,
                    matchType: true,
                    confidence: true,
                },
            });
            if (existing && existing.scannedDocumentId !== doc.id) {
                await logProcessingEvent(doc.scanJobId, 'warn', 'RECONCILIATION_COMPLETED', {
                    scannedDocumentId: doc.id,
                    duplicateInvoice: true,
                    existingReconciliationId: existing.id,
                    fingerprint,
                }).catch((logErr) => {
                    console.error('[ProcurementReconciliation] Failed to log completion', logErr);
                });
                return {
                    success: true,
                    scannedDocumentId: doc.id,
                    businessId: doc.businessId,
                    matchType: existing.matchType,
                    confidence: existing.confidence ?? 0,
                    purchaseOrderId: existing.purchaseOrderId,
                    goodsReceivedNoteId: existing.goodsReceivedNoteId,
                    fingerprint,
                    reconciliationStatus: existing.matchType,
                    duplicateInvoice: true,
                    currencyMismatch,
                };
            }
            const poDecision = this.matchPurchaseOrder(doc, purchaseOrders);
            const grnDecision = this.matchGoodsReceivedNote(doc, goodsReceivedNotes, poDecision);
            const finalDecision = this.resolveFinalDecision(poDecision, grnDecision);
            const reconciliationStatus = finalDecision.matchType === 'RECONCILIATION_FAILED'
                ? 'RECONCILIATION_FAILED'
                : finalDecision.matchType;
            const scannedDocumentUpdate = {
                matchedPurchaseOrderId: finalDecision.purchaseOrderId,
                matchedGoodsReceivedNoteId: finalDecision.goodsReceivedNoteId,
                reconciliationStatus,
                confidenceScore: finalDecision.confidence,
            };
            const linkRows = dedupeLinks(this.buildLinks(doc, finalDecision));
            // Single atomic transaction: scannedDocument update + reconciliation upsert + entity links
            await p.$transaction(async (tx) => {
                await tx.scannedDocument.update({
                    where: { id: doc.id },
                    data: scannedDocumentUpdate,
                });
                await tx.procurementReconciliation.upsert({
                    where: { fingerprint },
                    create: {
                        scannedDocumentId: doc.id,
                        businessId: doc.businessId,
                        purchaseOrderId: finalDecision.purchaseOrderId,
                        goodsReceivedNoteId: finalDecision.goodsReceivedNoteId,
                        matchType: finalDecision.matchType,
                        fingerprint,
                        state: legacyStateFor(finalDecision.matchType),
                        confidence: finalDecision.confidence,
                    },
                    update: {
                        businessId: doc.businessId,
                        purchaseOrderId: finalDecision.purchaseOrderId,
                        goodsReceivedNoteId: finalDecision.goodsReceivedNoteId,
                        matchType: finalDecision.matchType,
                        state: legacyStateFor(finalDecision.matchType),
                        confidence: finalDecision.confidence,
                    },
                });
                if (linkRows.length > 0) {
                    await tx.documentEntityLink.createMany({
                        data: linkRows,
                        skipDuplicates: true,
                    });
                }
            }, { timeout: 15000 });
            await logProcessingEvent(doc.scanJobId, 'info', 'RECONCILIATION_COMPLETED', {
                scannedDocumentId: doc.id,
                businessId: doc.businessId,
                matchType: finalDecision.matchType,
                confidence: finalDecision.confidence,
                purchaseOrderId: finalDecision.purchaseOrderId,
                goodsReceivedNoteId: finalDecision.goodsReceivedNoteId,
                fingerprint,
                lineCount: doc.items.length,
                poCandidates: purchaseOrders.length,
                grnCandidates: goodsReceivedNotes.length,
            }).catch((logErr) => {
                console.error('[ProcurementReconciliation] Failed to log completion', logErr);
            });
            return {
                success: true,
                scannedDocumentId: doc.id,
                businessId: doc.businessId,
                matchType: finalDecision.matchType,
                confidence: finalDecision.confidence,
                purchaseOrderId: finalDecision.purchaseOrderId,
                goodsReceivedNoteId: finalDecision.goodsReceivedNoteId,
                fingerprint,
                reconciliationStatus,
                duplicateInvoice: false,
                conflictReason: finalDecision.conflictReason,
                currencyMismatch,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            try {
                await p.scannedDocument.update({
                    where: { id: doc.id },
                    data: {
                        reconciliationStatus: 'RECONCILIATION_FAILED',
                        confidenceScore: 0,
                    },
                });
            }
            catch (updateErr) {
                // Best-effort failure marking only; never crash the worker.
                console.error('[ProcurementReconciliation] Failed to mark document as failed', updateErr);
            }
            await logProcessingEvent(doc.scanJobId, 'error', 'RECONCILIATION_FAILED', {
                scannedDocumentId: doc.id,
                businessId: doc.businessId,
                fingerprint,
                error: message,
            }).catch((logErr) => {
                console.error('[ProcurementReconciliation] Failed to log failure', logErr);
            });
            return {
                success: false,
                scannedDocumentId: doc.id,
                businessId: doc.businessId,
                matchType: 'RECONCILIATION_FAILED',
                confidence: 0,
                purchaseOrderId: null,
                goodsReceivedNoteId: null,
                fingerprint,
                reconciliationStatus: 'RECONCILIATION_FAILED',
                duplicateInvoice: false,
                error: message,
                conflictReason: message,
                currencyMismatch,
            };
        }
    }
    static matchPurchaseOrder(doc, purchaseOrders) {
        const normalizedPoNumber = normalizeIdentifier(doc.purchaseOrderNumber);
        const sameBusiness = purchaseOrders.filter((po) => po.businessId === doc.businessId);
        if (normalizedPoNumber) {
            const exactMatches = sameBusiness.filter((po) => normalizeIdentifier(po.poNumber) === normalizedPoNumber);
            if (exactMatches.length > 1) {
                return {
                    id: null,
                    confidence: 0,
                    reason: `Multiple exact PO matches for ${doc.purchaseOrderNumber}`,
                    kind: 'exact',
                    conflict: true,
                    purchaseOrderId: null,
                    matchType: 'CONFLICT',
                };
            }
            if (exactMatches.length === 1) {
                return {
                    id: exactMatches[0].id,
                    confidence: 1,
                    reason: 'Exact purchase order number match',
                    kind: 'exact',
                    conflict: false,
                    purchaseOrderId: exactMatches[0].id,
                    matchType: 'EXACT_PO',
                };
            }
        }
        const supplierAmountCandidates = sameBusiness.filter((po) => {
            if (!doc.supplierId)
                return false;
            if (po.supplierId !== doc.supplierId)
                return false;
            if (typeof doc.totalCents !== 'number' || doc.totalCents <= 0)
                return false;
            const diff = Math.abs(po.totalCents - doc.totalCents);
            return diff / Math.max(1, doc.totalCents) <= 0.05;
        }).map((po) => {
            const amountDiff = typeof doc.totalCents === 'number'
                ? Math.abs(po.totalCents - doc.totalCents) / Math.max(1, doc.totalCents)
                : 1;
            const confidence = clamp(1 - amountDiff);
            return {
                id: po.id,
                confidence,
                reason: `Supplier and total amount within ${Math.round((1 - confidence) * 100)}%`,
                kind: 'supplier_amount',
                conflict: false,
                purchaseOrderId: po.id,
                matchType: 'FUZZY_PO',
            };
        });
        const supplierAmountSelected = this.selectCandidate(supplierAmountCandidates, 0.7);
        if (supplierAmountSelected.conflict) {
            return {
                id: null,
                confidence: supplierAmountSelected.confidence,
                reason: supplierAmountSelected.reason,
                kind: supplierAmountSelected.kind,
                conflict: true,
                purchaseOrderId: null,
                matchType: 'CONFLICT',
            };
        }
        if (supplierAmountSelected.id) {
            return supplierAmountSelected;
        }
        const fuzzyCandidates = sameBusiness.map((po) => {
            const itemScore = scoreItemCollection(doc.items, po.items);
            const confidence = clamp(itemScore.score);
            return {
                id: po.id,
                confidence,
                reason: `Fuzzy PO score ${confidence.toFixed(3)} from ${itemScore.coverage.toFixed(2)} coverage`,
                kind: 'fuzzy',
                conflict: false,
                purchaseOrderId: po.id,
                matchType: 'FUZZY_PO',
            };
        });
        const fuzzySelected = this.selectCandidate(fuzzyCandidates, 0.65);
        if (fuzzySelected.conflict) {
            return {
                id: null,
                confidence: fuzzySelected.confidence,
                reason: fuzzySelected.reason,
                kind: fuzzySelected.kind,
                conflict: true,
                purchaseOrderId: null,
                matchType: 'CONFLICT',
            };
        }
        if (fuzzySelected.id) {
            return fuzzySelected;
        }
        return {
            id: null,
            confidence: 0,
            reason: 'No purchase order match',
            kind: 'fuzzy',
            conflict: false,
            purchaseOrderId: null,
            matchType: 'NO_MATCH',
        };
    }
    static matchGoodsReceivedNote(doc, goodsReceivedNotes, poDecision) {
        const sameBusiness = goodsReceivedNotes.filter((grn) => grn.businessId === doc.businessId);
        const normalizedDelivery = normalizeIdentifier(doc.deliveryReference);
        if (normalizedDelivery) {
            const exactMatches = sameBusiness.filter((grn) => normalizeIdentifier(grn.grnNumber) === normalizedDelivery);
            if (exactMatches.length > 1) {
                return {
                    id: null,
                    confidence: 0,
                    reason: `Multiple exact GRN matches for ${doc.deliveryReference}`,
                    kind: 'exact',
                    conflict: true,
                    goodsReceivedNoteId: null,
                    purchaseOrderId: null,
                    matchType: 'CONFLICT',
                };
            }
            if (exactMatches.length === 1) {
                const match = exactMatches[0];
                if (isPartialGrn(match.status)) {
                    return {
                        id: null,
                        confidence: 0,
                        reason: `GRN ${match.grnNumber} indicates partial delivery`,
                        kind: 'exact',
                        conflict: true,
                        goodsReceivedNoteId: null,
                        purchaseOrderId: null,
                        matchType: 'CONFLICT',
                    };
                }
                return {
                    id: match.id,
                    confidence: 1,
                    reason: 'Exact delivery reference match',
                    kind: 'exact',
                    conflict: false,
                    goodsReceivedNoteId: match.id,
                    purchaseOrderId: match.purchaseOrderId,
                    matchType: 'GRN_MATCH',
                };
            }
        }
        const dateWindowCandidates = sameBusiness.filter((grn) => {
            if (!doc.supplierId)
                return false;
            if (grn.supplierId !== doc.supplierId)
                return false;
            if (!doc.documentDate)
                return false;
            const days = dateDifferenceDays(grn.receivedAt, doc.documentDate);
            return days !== null && days <= 3;
        }).map((grn) => {
            const days = dateDifferenceDays(grn.receivedAt, doc.documentDate);
            const confidence = dateWindowScore(days, 3);
            return {
                id: grn.id,
                confidence,
                reason: `Supplier/date window match (${days?.toFixed(1) ?? 'n/a'} days)`,
                kind: 'date',
                conflict: false,
                goodsReceivedNoteId: grn.id,
                purchaseOrderId: grn.purchaseOrderId,
                matchType: 'GRN_MATCH',
                status: grn.status,
            };
        });
        const dateSelected = this.selectCandidate(dateWindowCandidates, 0.65);
        if (dateSelected.conflict) {
            return {
                id: null,
                confidence: dateSelected.confidence,
                reason: dateSelected.reason,
                kind: dateSelected.kind,
                conflict: true,
                goodsReceivedNoteId: null,
                purchaseOrderId: null,
                matchType: 'CONFLICT',
            };
        }
        if (dateSelected.id) {
            if (isPartialGrn(goodsReceivedNotes.find((g) => g.id === dateSelected.id)?.status)) {
                return {
                    id: null,
                    confidence: 0,
                    reason: 'Matched GRN indicates partial delivery',
                    kind: 'date',
                    conflict: true,
                    goodsReceivedNoteId: null,
                    purchaseOrderId: null,
                    matchType: 'CONFLICT',
                };
            }
            return dateSelected;
        }
        const fuzzyCandidates = sameBusiness.map((grn) => {
            const itemScore = scoreItemCollection(doc.items, grn.items.map((item) => ({
                productName: item.productName,
                productId: null,
                quantity: item.receivedQuantity,
                unit: item.unit,
                unitPriceCents: item.unitPriceCents,
                totalPriceCents: item.totalPriceCents,
            })));
            const supplierBonus = doc.supplierId && grn.supplierId === doc.supplierId ? 0.1 : 0;
            const linkedPoBonus = poDecision.purchaseOrderId && grn.purchaseOrderId === poDecision.purchaseOrderId ? 0.1 : 0;
            const confidence = clamp(itemScore.score + supplierBonus + linkedPoBonus);
            return {
                id: grn.id,
                confidence,
                reason: `Fuzzy GRN score ${confidence.toFixed(3)} from ${itemScore.coverage.toFixed(2)} coverage`,
                kind: 'item_similarity',
                conflict: false,
                goodsReceivedNoteId: grn.id,
                purchaseOrderId: grn.purchaseOrderId,
                matchType: 'GRN_MATCH',
                status: grn.status,
            };
        });
        const fuzzySelected = this.selectCandidate(fuzzyCandidates, 0.65);
        if (fuzzySelected.conflict) {
            return {
                id: null,
                confidence: fuzzySelected.confidence,
                reason: fuzzySelected.reason,
                kind: fuzzySelected.kind,
                conflict: true,
                goodsReceivedNoteId: null,
                purchaseOrderId: null,
                matchType: 'CONFLICT',
            };
        }
        if (fuzzySelected.id) {
            const matchedGrn = goodsReceivedNotes.find((g) => g.id === fuzzySelected.id);
            if (matchedGrn && isPartialGrn(matchedGrn.status)) {
                return {
                    id: null,
                    confidence: 0,
                    reason: 'Matched GRN indicates partial delivery',
                    kind: 'item_similarity',
                    conflict: true,
                    goodsReceivedNoteId: null,
                    purchaseOrderId: null,
                    matchType: 'CONFLICT',
                };
            }
            return fuzzySelected;
        }
        return {
            id: null,
            confidence: 0,
            reason: 'No goods received note match',
            kind: 'item_similarity',
            conflict: false,
            goodsReceivedNoteId: null,
            purchaseOrderId: null,
            matchType: 'NO_MATCH',
        };
    }
    static selectCandidate(candidates, threshold) {
        if (candidates.length === 0) {
            return {
                id: null,
                confidence: 0,
                reason: 'No candidates',
                kind: 'fuzzy',
                conflict: false,
            };
        }
        const ordered = [...candidates].sort((a, b) => {
            if (b.confidence !== a.confidence)
                return b.confidence - a.confidence;
            if (a.kind !== b.kind)
                return a.kind.localeCompare(b.kind);
            return (a.id ?? "").localeCompare(b.id ?? "");
        });
        const best = ordered[0];
        if (best.confidence < threshold) {
            return {
                ...best,
                id: null,
                conflict: false,
            };
        }
        const nearBest = ordered.filter((candidate) => candidate.confidence >= threshold && (best.confidence - candidate.confidence) <= 0.03);
        if (nearBest.length > 1) {
            return {
                ...best,
                id: null,
                conflict: true,
                reason: `Ambiguous match between ${nearBest.length} candidates`,
            };
        }
        return {
            ...best,
            id: best.id,
            conflict: false,
        };
    }
    static resolveFinalDecision(poDecision, grnDecision) {
        if (poDecision.conflict || grnDecision.conflict) {
            return {
                matchType: 'CONFLICT',
                confidence: 0,
                purchaseOrderId: null,
                goodsReceivedNoteId: null,
                conflictReason: poDecision.reason || grnDecision.reason || 'Conflict',
            };
        }
        if (poDecision.purchaseOrderId && grnDecision.goodsReceivedNoteId) {
            if (grnDecision.purchaseOrderId && grnDecision.purchaseOrderId !== poDecision.purchaseOrderId) {
                return {
                    matchType: 'CONFLICT',
                    confidence: 0,
                    purchaseOrderId: null,
                    goodsReceivedNoteId: null,
                    conflictReason: 'PO and GRN do not refer to the same underlying purchase order',
                };
            }
            // GRN exact-match (delivery reference) takes precedence over a fuzzy PO match.
            // Exact PO match takes precedence over a fuzzy GRN match.
            // When both are exact, GRN_MATCH is the canonical result (GRN is confirmed delivery).
            const grnIsExact = grnDecision.kind === 'exact' && grnDecision.confidence >= 0.99;
            const poIsExact = poDecision.matchType === 'EXACT_PO';
            const resolvedMatchType = grnIsExact ? 'GRN_MATCH' : poIsExact ? 'EXACT_PO' : 'FUZZY_PO';
            return {
                matchType: resolvedMatchType,
                confidence: Math.max(poDecision.confidence, grnDecision.confidence),
                purchaseOrderId: poDecision.purchaseOrderId,
                goodsReceivedNoteId: grnDecision.goodsReceivedNoteId,
            };
        }
        if (poDecision.purchaseOrderId) {
            return {
                matchType: poDecision.matchType === 'EXACT_PO' ? 'EXACT_PO' : 'FUZZY_PO',
                confidence: poDecision.confidence,
                purchaseOrderId: poDecision.purchaseOrderId,
                goodsReceivedNoteId: null,
            };
        }
        if (grnDecision.goodsReceivedNoteId) {
            return {
                matchType: 'GRN_MATCH',
                confidence: grnDecision.confidence,
                purchaseOrderId: null,
                goodsReceivedNoteId: grnDecision.goodsReceivedNoteId,
            };
        }
        return {
            matchType: 'NO_MATCH',
            confidence: 0,
            purchaseOrderId: null,
            goodsReceivedNoteId: null,
        };
    }
    static buildLinks(doc, finalDecision) {
        const rows = [];
        if (doc.supplierId) {
            rows.push({
                scannedDocumentId: doc.id,
                entityType: 'SUPPLIER',
                entityId: doc.supplierId,
                linkType: buildLinkType(finalDecision.confidence, finalDecision.matchType),
                confidence: finalDecision.confidence,
            });
        }
        for (const item of doc.items) {
            if (item.productId) {
                rows.push({
                    scannedDocumentId: doc.id,
                    entityType: 'INVENTORY_ITEM',
                    entityId: item.productId,
                    linkType: buildLinkType(finalDecision.confidence, finalDecision.matchType),
                    confidence: finalDecision.confidence,
                });
            }
        }
        if (finalDecision.purchaseOrderId) {
            rows.push({
                scannedDocumentId: doc.id,
                entityType: 'PO',
                entityId: finalDecision.purchaseOrderId,
                linkType: buildLinkType(finalDecision.confidence, finalDecision.matchType),
                confidence: finalDecision.confidence,
            });
        }
        if (finalDecision.goodsReceivedNoteId) {
            rows.push({
                scannedDocumentId: doc.id,
                entityType: 'GRN',
                entityId: finalDecision.goodsReceivedNoteId,
                linkType: buildLinkType(finalDecision.confidence, finalDecision.matchType),
                confidence: finalDecision.confidence,
            });
        }
        return rows;
    }
}
exports.ProcurementReconciliationService = ProcurementReconciliationService;
