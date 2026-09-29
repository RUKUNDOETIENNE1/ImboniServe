"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentLifecycleService = exports.InvalidStateTransitionError = exports.DocumentLifecycleState = void 0;
const prisma_1 = require("../../../lib/prisma");
var DocumentLifecycleState;
(function (DocumentLifecycleState) {
    DocumentLifecycleState["UPLOADED"] = "UPLOADED";
    DocumentLifecycleState["EXTRACTED"] = "EXTRACTED";
    DocumentLifecycleState["INTELLIGENCE_DONE"] = "INTELLIGENCE_DONE";
    DocumentLifecycleState["MATCHED"] = "MATCHED";
    DocumentLifecycleState["RECONCILED"] = "RECONCILED";
    DocumentLifecycleState["ANALYZED"] = "ANALYZED";
    DocumentLifecycleState["REVIEW_REQUIRED"] = "REVIEW_REQUIRED";
    DocumentLifecycleState["APPROVED"] = "APPROVED";
    DocumentLifecycleState["APPLIED"] = "APPLIED";
    DocumentLifecycleState["FAILED"] = "FAILED";
})(DocumentLifecycleState || (exports.DocumentLifecycleState = DocumentLifecycleState = {}));
class InvalidStateTransitionError extends Error {
    constructor(from, to) {
        super(`Invalid lifecycle transition: ${from} -> ${to}`);
        this.name = 'InvalidStateTransitionError';
    }
}
exports.InvalidStateTransitionError = InvalidStateTransitionError;
const ALLOWED_TRANSITIONS = {
    [DocumentLifecycleState.UPLOADED]: [DocumentLifecycleState.EXTRACTED],
    [DocumentLifecycleState.EXTRACTED]: [DocumentLifecycleState.INTELLIGENCE_DONE],
    [DocumentLifecycleState.INTELLIGENCE_DONE]: [DocumentLifecycleState.MATCHED],
    [DocumentLifecycleState.MATCHED]: [DocumentLifecycleState.RECONCILED],
    [DocumentLifecycleState.RECONCILED]: [DocumentLifecycleState.ANALYZED],
    [DocumentLifecycleState.ANALYZED]: [DocumentLifecycleState.REVIEW_REQUIRED, DocumentLifecycleState.APPROVED],
    [DocumentLifecycleState.REVIEW_REQUIRED]: [DocumentLifecycleState.APPROVED, DocumentLifecycleState.FAILED],
    [DocumentLifecycleState.APPROVED]: [DocumentLifecycleState.APPLIED],
    [DocumentLifecycleState.APPLIED]: [],
    [DocumentLifecycleState.FAILED]: [],
};
const STAGE_BY_STATE = {
    [DocumentLifecycleState.UPLOADED]: 'upload',
    [DocumentLifecycleState.EXTRACTED]: 'extraction',
    [DocumentLifecycleState.INTELLIGENCE_DONE]: 'intelligence',
    [DocumentLifecycleState.MATCHED]: 'matching',
    [DocumentLifecycleState.RECONCILED]: 'reconciliation',
    [DocumentLifecycleState.ANALYZED]: 'anomaly_detection',
    [DocumentLifecycleState.REVIEW_REQUIRED]: 'review',
    [DocumentLifecycleState.APPROVED]: 'approval',
    [DocumentLifecycleState.APPLIED]: 'application',
    [DocumentLifecycleState.FAILED]: 'failure',
};
const LEGACY_STATUS_BY_STATE = {
    [DocumentLifecycleState.UPLOADED]: 'UPLOADED',
    [DocumentLifecycleState.EXTRACTED]: 'EXTRACTED',
    [DocumentLifecycleState.INTELLIGENCE_DONE]: 'INTELLIGENCE_DONE',
    [DocumentLifecycleState.MATCHED]: 'REVIEW',
    [DocumentLifecycleState.RECONCILED]: 'REVIEW',
    [DocumentLifecycleState.ANALYZED]: 'REVIEW',
    [DocumentLifecycleState.REVIEW_REQUIRED]: 'REVIEW',
    [DocumentLifecycleState.APPROVED]: 'APPROVED',
    [DocumentLifecycleState.APPLIED]: 'APPLIED',
    [DocumentLifecycleState.FAILED]: 'FAILED',
};
const SCAN_JOB_STATUS_BY_STATE = {
    [DocumentLifecycleState.UPLOADED]: 'UPLOADED',
    [DocumentLifecycleState.EXTRACTED]: 'EXTRACTED',
    [DocumentLifecycleState.INTELLIGENCE_DONE]: 'INTELLIGENCE_DONE',
    [DocumentLifecycleState.MATCHED]: 'REVIEW',
    [DocumentLifecycleState.RECONCILED]: 'REVIEW',
    [DocumentLifecycleState.ANALYZED]: 'REVIEW',
    [DocumentLifecycleState.REVIEW_REQUIRED]: 'REVIEW',
    [DocumentLifecycleState.APPROVED]: 'APPROVED',
    [DocumentLifecycleState.APPLIED]: 'APPLIED',
    [DocumentLifecycleState.FAILED]: 'FAILED',
};
function normalizeState(value) {
    switch (value) {
        case 'UPLOADED':
        case 'OCR_PROCESSING':
            return DocumentLifecycleState.UPLOADED;
        case 'EXTRACTED':
            return DocumentLifecycleState.EXTRACTED;
        case 'INTELLIGENCE_DONE':
            return DocumentLifecycleState.INTELLIGENCE_DONE;
        case 'REVIEW':
            return DocumentLifecycleState.REVIEW_REQUIRED;
        case 'APPROVED':
            return DocumentLifecycleState.APPROVED;
        case 'APPLIED':
            return DocumentLifecycleState.APPLIED;
        case 'FAILED':
            return DocumentLifecycleState.FAILED;
        case 'MATCHED':
            return DocumentLifecycleState.MATCHED;
        case 'RECONCILED':
            return DocumentLifecycleState.RECONCILED;
        case 'ANALYZED':
            return DocumentLifecycleState.ANALYZED;
        case 'REVIEW_REQUIRED':
            return DocumentLifecycleState.REVIEW_REQUIRED;
        default:
            return DocumentLifecycleState.UPLOADED;
    }
}
class DocumentLifecycleService {
    static allowedNextStates(state) {
        const normalized = normalizeState(String(state));
        return ALLOWED_TRANSITIONS[normalized] || [];
    }
    static stageForState(state) {
        const normalized = normalizeState(String(state));
        return STAGE_BY_STATE[normalized];
    }
    static legacyStatusForState(state) {
        const normalized = normalizeState(String(state));
        return LEGACY_STATUS_BY_STATE[normalized];
    }
    static scanJobStatusForState(state) {
        const normalized = normalizeState(String(state));
        return SCAN_JOB_STATUS_BY_STATE[normalized];
    }
    static normalizeState(value) {
        return normalizeState(value);
    }
    static isFinalState(state) {
        const normalized = normalizeState(String(state));
        return normalized === DocumentLifecycleState.APPLIED || normalized === DocumentLifecycleState.FAILED;
    }
    static async getDocumentSnapshot(documentId, tx) {
        const client = tx || prisma_1.prisma;
        return client.scannedDocument.findUnique({
            where: { id: documentId },
            select: {
                id: true,
                scanJobId: true,
                lifecycleState: true,
                status: true,
                updatedAt: true,
                businessId: true,
            },
        });
    }
    static async recordDocumentEvent(tx, args) {
        await tx.documentEventTimeline.create({
            data: {
                scannedDocumentId: args.scannedDocumentId,
                stage: args.stage,
                status: args.status,
                metadata: args.metadata ? args.metadata : undefined,
            },
        });
    }
    static async transitionDocumentLifecycleOnTransaction(tx, documentId, nextState, metadata = {}, options = {}) {
        const snapshot = await this.getDocumentSnapshot(documentId, tx);
        if (!snapshot)
            throw new Error(`ScannedDocument not found: ${documentId}`);
        const current = normalizeState(snapshot.lifecycleState || snapshot.status);
        const target = normalizeState(nextState);
        if (options.expectedCurrentState && current !== options.expectedCurrentState && !options.force) {
            throw new InvalidStateTransitionError(current, target);
        }
        if (current === target) {
            if (!options.skipTimeline) {
                await this.recordDocumentEvent(tx, {
                    scannedDocumentId: documentId,
                    stage: options.stage || this.stageForState(target),
                    status: target,
                    metadata: { ...metadata, idempotent: true, previousState: current, nextState: target },
                });
            }
            return { documentId, from: current, to: target, transitioned: false };
        }
        const allowed = this.allowedNextStates(current);
        if (!options.force && !allowed.includes(target)) {
            throw new InvalidStateTransitionError(current, target);
        }
        const legacyStatus = this.legacyStatusForState(target);
        const stage = options.stage || this.stageForState(target);
        await tx.scannedDocument.update({
            where: { id: documentId },
            data: {
                lifecycleState: target,
                status: legacyStatus,
            },
        });
        if (snapshot.scanJobId) {
            await tx.scanJob.update({
                where: { id: snapshot.scanJobId },
                data: { status: this.scanJobStatusForState(target) },
            });
        }
        await this.recordDocumentEvent(tx, {
            scannedDocumentId: documentId,
            stage,
            status: target,
            metadata: {
                ...metadata,
                previousState: current,
                nextState: target,
                legacyStatus,
            },
        });
        await tx.documentProcessingLog.create({
            data: {
                scanJobId: snapshot.scanJobId,
                stage,
                level: 'info',
                message: `Lifecycle transition ${current} -> ${target}`,
                payload: {
                    previousState: current,
                    nextState: target,
                    ...metadata,
                },
            },
        });
        return { documentId, from: current, to: target, transitioned: true };
    }
    static async transitionDocumentLifecycle(documentId, nextState, metadata = {}, options = {}) {
        const p = prisma_1.prisma;
        return p.$transaction(async (tx) => this.transitionDocumentLifecycleOnTransaction(tx, documentId, nextState, metadata, options));
    }
}
exports.DocumentLifecycleService = DocumentLifecycleService;
