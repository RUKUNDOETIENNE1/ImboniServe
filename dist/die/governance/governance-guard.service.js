"use strict";
// DIE Governance Guard — soft enforcement and anomaly detection (NO BLOCKING)
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernanceGuardService = void 0;
class GovernanceGuardService {
    constructor(engine) {
        this.engine = engine;
    }
    /**
     * Detect anomalies before enable operation (SOFT ENFORCEMENT ONLY)
     * Returns detected anomalies but DOES NOT BLOCK
     */
    async detectEnableAnomalies(pluginId, businessId = null) {
        const anomalies = [];
        const state = this.engine.getState(pluginId, businessId);
        // Anomaly: Enable without install
        if (!state || state.lifecycleState === 'DISCOVERED') {
            const anomaly = {
                pluginId,
                businessId,
                anomalyType: 'ENABLE_WITHOUT_INSTALL',
                detectedAt: new Date().toISOString(),
                details: `Plugin ${pluginId} is being enabled without prior installation`,
                severity: 'MEDIUM',
            };
            anomalies.push(anomaly);
            console.warn(`[GovernanceGuard] ANOMALY DETECTED: ${anomaly.anomalyType} - ${anomaly.details}`);
            // Record anomaly in audit trail
            this.engine['stateService'].appendAuditEvent({
                pluginId,
                businessId,
                eventType: 'ANOMALY_DETECTED',
                metadata: {
                    anomalyType: anomaly.anomalyType,
                    anomalyDetails: anomaly.details,
                    severity: anomaly.severity,
                },
            });
        }
        // Anomaly: Repeated enable/disable cycles
        if (state && state.enableCount > 5 && state.disableCount > 5) {
            const anomaly = {
                pluginId,
                businessId,
                anomalyType: 'REPEATED_LIFECYCLE_INCONSISTENCY',
                detectedAt: new Date().toISOString(),
                details: `Plugin ${pluginId} has ${state.enableCount} enables and ${state.disableCount} disables (possible instability)`,
                severity: 'LOW',
            };
            anomalies.push(anomaly);
            console.warn(`[GovernanceGuard] ANOMALY DETECTED: ${anomaly.anomalyType} - ${anomaly.details}`);
        }
        return anomalies;
    }
    /**
     * Detect anomalies before disable operation (SOFT ENFORCEMENT ONLY)
     */
    async detectDisableAnomalies(pluginId, businessId = null) {
        const anomalies = [];
        const state = this.engine.getState(pluginId, businessId);
        // Anomaly: Disable without enable
        if (!state || state.lifecycleState !== 'ENABLED') {
            const anomaly = {
                pluginId,
                businessId,
                anomalyType: 'UNUSUAL_STATE_TRANSITION',
                detectedAt: new Date().toISOString(),
                details: `Plugin ${pluginId} is being disabled but current state is ${state?.lifecycleState ?? 'UNKNOWN'}`,
                severity: 'LOW',
            };
            anomalies.push(anomaly);
            console.warn(`[GovernanceGuard] ANOMALY DETECTED: ${anomaly.anomalyType} - ${anomaly.details}`);
            // Record anomaly in audit trail
            this.engine['stateService'].appendAuditEvent({
                pluginId,
                businessId,
                eventType: 'ANOMALY_DETECTED',
                metadata: {
                    anomalyType: anomaly.anomalyType,
                    anomalyDetails: anomaly.details,
                    severity: anomaly.severity,
                },
            });
        }
        return anomalies;
    }
    /**
     * Detect anomalies before install operation (SOFT ENFORCEMENT ONLY)
     */
    async detectInstallAnomalies(pluginId, businessId = null) {
        const anomalies = [];
        const state = this.engine.getState(pluginId, businessId);
        // Anomaly: Repeated installs
        if (state && state.installCount > 3) {
            const anomaly = {
                pluginId,
                businessId,
                anomalyType: 'REPEATED_LIFECYCLE_INCONSISTENCY',
                detectedAt: new Date().toISOString(),
                details: `Plugin ${pluginId} has been installed ${state.installCount} times (possible reinstall loop)`,
                severity: 'MEDIUM',
            };
            anomalies.push(anomaly);
            console.warn(`[GovernanceGuard] ANOMALY DETECTED: ${anomaly.anomalyType} - ${anomaly.details}`);
            // Record anomaly in audit trail
            this.engine['stateService'].appendAuditEvent({
                pluginId,
                businessId,
                eventType: 'ANOMALY_DETECTED',
                metadata: {
                    anomalyType: anomaly.anomalyType,
                    anomalyDetails: anomaly.details,
                    severity: anomaly.severity,
                },
            });
        }
        return anomalies;
    }
    /**
     * Get all detected anomalies from audit trail
     */
    getAllAnomalies(businessId = null) {
        const auditEvents = businessId
            ? this.engine.getAuditTrailForBusiness(businessId)
            : this.engine.getRecentAuditEvents(500);
        const anomalies = [];
        for (const event of auditEvents) {
            if (event.eventType === 'ANOMALY_DETECTED' && event.metadata) {
                anomalies.push({
                    pluginId: event.pluginId,
                    businessId: event.businessId,
                    anomalyType: event.metadata.anomalyType,
                    detectedAt: event.timestamp,
                    details: event.metadata.anomalyDetails,
                    severity: event.metadata.severity ?? 'LOW',
                });
            }
        }
        return anomalies;
    }
}
exports.GovernanceGuardService = GovernanceGuardService;
