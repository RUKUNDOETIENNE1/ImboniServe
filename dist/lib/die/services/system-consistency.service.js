"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemConsistencyService = void 0;
const prisma_1 = require("../../../lib/prisma");
const document_lifecycle_service_1 = require("./document-lifecycle.service");
const SEVERITY_WEIGHT = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
};
function worstSeverity(issues) {
    if (issues.length === 0)
        return 'LOW';
    return issues.reduce((worst, issue) => (SEVERITY_WEIGHT[issue.severity] > SEVERITY_WEIGHT[worst] ? issue.severity : worst), 'LOW');
}
class SystemConsistencyService {
    static async validateDocumentConsistency(documentId) {
        const p = prisma_1.prisma;
        const doc = await p.scannedDocument.findUnique({
            where: { id: documentId },
            select: {
                id: true,
                lifecycleState: true,
                status: true,
                supplierId: true,
                matchedPurchaseOrderId: true,
                matchedGoodsReceivedNoteId: true,
                items: {
                    select: {
                        id: true,
                        productId: true,
                        supplierProductId: true,
                    },
                },
                reconciliation: {
                    select: {
                        id: true,
                        state: true,
                        matchType: true,
                    },
                },
                anomalyAlerts: {
                    select: { id: true },
                    take: 1,
                },
                entityLinks: {
                    select: {
                        id: true,
                        linkType: true,
                        entityType: true,
                    },
                },
                eventTimelines: {
                    select: { stage: true, status: true, createdAt: true },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });
        if (!doc) {
            return {
                documentId,
                issues: [{
                        code: 'DOCUMENT_NOT_FOUND',
                        message: `ScannedDocument not found: ${documentId}`,
                        severity: 'HIGH',
                    }],
                severity: 'HIGH',
            };
        }
        const lifecycleState = document_lifecycle_service_1.DocumentLifecycleService.normalizeState(doc.lifecycleState || doc.status);
        const issues = [];
        const hasMatch = Boolean(doc.supplierId ||
            doc.items.some((item) => item.productId || item.supplierProductId) ||
            doc.entityLinks.some((link) => link.linkType === 'AUTO_MATCH' || link.linkType === 'USER_CONFIRMED'));
        if (lifecycleState === document_lifecycle_service_1.DocumentLifecycleState.INTELLIGENCE_DONE ||
            lifecycleState === document_lifecycle_service_1.DocumentLifecycleState.MATCHED ||
            lifecycleState === document_lifecycle_service_1.DocumentLifecycleState.RECONCILED ||
            lifecycleState === document_lifecycle_service_1.DocumentLifecycleState.ANALYZED ||
            lifecycleState === document_lifecycle_service_1.DocumentLifecycleState.REVIEW_REQUIRED ||
            lifecycleState === document_lifecycle_service_1.DocumentLifecycleState.APPROVED ||
            lifecycleState === document_lifecycle_service_1.DocumentLifecycleState.APPLIED) {
            if (!hasMatch) {
                issues.push({
                    code: 'INTELLIGENCE_WITHOUT_MATCH',
                    message: 'Document reached intelligence stage but no supplier/product match was persisted.',
                    severity: 'MEDIUM',
                });
            }
        }
        if (lifecycleState === document_lifecycle_service_1.DocumentLifecycleState.MATCHED ||
            lifecycleState === document_lifecycle_service_1.DocumentLifecycleState.RECONCILED ||
            lifecycleState === document_lifecycle_service_1.DocumentLifecycleState.ANALYZED ||
            lifecycleState === document_lifecycle_service_1.DocumentLifecycleState.REVIEW_REQUIRED ||
            lifecycleState === document_lifecycle_service_1.DocumentLifecycleState.APPROVED ||
            lifecycleState === document_lifecycle_service_1.DocumentLifecycleState.APPLIED) {
            if (!doc.reconciliation) {
                issues.push({
                    code: 'MATCHED_WITHOUT_RECONCILIATION',
                    message: 'Document is past matching but has no reconciliation record.',
                    severity: 'HIGH',
                });
            }
        }
        if (doc.reconciliation?.state === 'CONFLICT' && doc.anomalyAlerts.length === 0) {
            issues.push({
                code: 'CONFLICT_WITHOUT_ANOMALY',
                message: 'Reconciliation conflict exists but no anomaly alert was created.',
                severity: 'HIGH',
            });
        }
        if (lifecycleState === document_lifecycle_service_1.DocumentLifecycleState.APPLIED) {
            const unresolvedLinks = doc.entityLinks.filter((link) => link.linkType === 'REVIEW_SUGGESTION');
            if (unresolvedLinks.length > 0) {
                issues.push({
                    code: 'APPLIED_WITH_PENDING_REVIEW_LINKS',
                    message: 'Applied document still contains unresolved review-suggestion links.',
                    severity: 'CRITICAL',
                    details: {
                        unresolvedLinkCount: unresolvedLinks.length,
                    },
                });
            }
        }
        return {
            documentId,
            issues,
            severity: worstSeverity(issues),
        };
    }
    static async validateBusinessConsistency(businessId, limit = 100) {
        const p = prisma_1.prisma;
        const docs = await p.scannedDocument.findMany({
            where: { businessId },
            select: { id: true },
            take: limit,
            orderBy: { updatedAt: 'desc' },
        });
        const reports = [];
        for (const doc of docs) {
            reports.push(await this.validateDocumentConsistency(doc.id));
        }
        return reports;
    }
}
exports.SystemConsistencyService = SystemConsistencyService;
