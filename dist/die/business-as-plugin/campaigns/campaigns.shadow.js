"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestCampaignShadowEvent = ingestCampaignShadowEvent;
const campaigns_adapter_1 = require("./campaigns.adapter");
const event_router_1 = require("../../../die/business-as-plugin/conversion/event-router");
const shadow_bindings_1 = require("../../../die/business-as-plugin/shadow/shadow-bindings");
async function ingestCampaignShadowEvent(input) {
    try {
        if (process.env.DIE_SHADOW_CAMPAIGNS_ENABLED !== 'true')
            return;
        const adapter = new campaigns_adapter_1.CampaignsPluginAdapter();
        const mapped = input.type;
        const severity = input.type === 'CAMPAIGN_FAILED' ? 'WARN' : 'INFO';
        const ev = {
            domain: 'campaigns',
            type: mapped,
            timestamp: new Date().toISOString(),
            businessId: input.businessId,
            severity,
            data: {
                campaignId: input.campaignId,
                channel: input.channel,
                metrics: input.metrics,
            },
        };
        await (0, event_router_1.routeDomainEvent)(adapter, shadow_bindings_1.shadowBindings, ev);
    }
    catch (e) {
        console.debug('[Shadow][Campaigns] ingest error (ignored):', e?.message);
    }
}
