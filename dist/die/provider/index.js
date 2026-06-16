"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildProviderChain = buildProviderChain;
const azure_1 = require("./azure");
const openai_1 = require("./openai");
function buildProviderChain() {
    const providers = [];
    if (process.env.AZURE_DI_ENDPOINT && process.env.AZURE_DI_KEY) {
        providers.push(new azure_1.AzureDocIntelligenceProvider());
    }
    if (process.env.OPENAI_API_KEY) {
        providers.push(new openai_1.OpenAIVisionProvider());
    }
    // Fallback to OpenAI even if not configured will throw helpful error
    if (providers.length === 0) {
        providers.push(new openai_1.OpenAIVisionProvider());
    }
    return providers;
}
