"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureDocIntelligenceProvider = void 0;
const gateway_1 = require("./gateway");
class AzureDocIntelligenceProvider {
    constructor() {
        this.name = 'azure_document_intelligence';
        this.endpoint = process.env.AZURE_DI_ENDPOINT;
        this.key = process.env.AZURE_DI_KEY;
    }
    supportsMime(mime) {
        return (0, gateway_1.isImage)(mime) || (0, gateway_1.isPdf)(mime);
    }
    async extract(input) {
        if (!this.endpoint || !this.key) {
            throw new Error('Azure Document Intelligence not configured');
        }
        // Placeholder implementation; actual REST call to Azure DI will be added later.
        // Return empty structure to satisfy interface in environments without full setup.
        return {
            rawPayload: { note: 'Azure DI placeholder' },
            fields: [],
            lines: [],
        };
    }
}
exports.AzureDocIntelligenceProvider = AzureDocIntelligenceProvider;
