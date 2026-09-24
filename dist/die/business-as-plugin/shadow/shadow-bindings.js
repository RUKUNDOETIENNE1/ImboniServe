"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shadowBindings = void 0;
const shadow_observability_1 = require("./shadow-observability");
// Read-only shadow bindings: do NOT persist; just keep ephemeral metrics and feed
const governance = {
    async recordLifecycle(event) {
        // Shadow-only: log for visibility; no persistence
        console.info('[Shadow][Governance]', event);
    },
};
const marketplace = {
    async recordUsage(signals) {
        // Shadow-only: log for visibility; no persistence
        console.info('[Shadow][Marketplace]', signals);
    },
};
const intelligence = {
    async recordMetrics(metrics) {
        // Shadow-only: log for visibility; no persistence
        console.info('[Shadow][Intelligence]', metrics);
    },
};
const observability = {
    async emitFeed(signal) {
        // Map domain-origin feed to unified source: use 'intelligence-core' to avoid adding new source types
        const source = 'intelligence-core';
        shadow_observability_1.shadowObservability.emit(source, signal.code, signal.message, signal.severity, {
            ...signal.data,
            pluginId: signal.pluginId,
            sourceTag: signal.pluginId,
        });
    },
};
exports.shadowBindings = {
    governance,
    marketplace,
    intelligence,
    observability,
};
