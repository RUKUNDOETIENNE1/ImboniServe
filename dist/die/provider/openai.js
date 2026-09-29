"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIVisionProvider = void 0;
const openai_1 = __importDefault(require("openai"));
const gateway_1 = require("./gateway");
class OpenAIVisionProvider {
    constructor() {
        this.name = 'openai';
        this.client = process.env.OPENAI_API_KEY ? new openai_1.default({ apiKey: process.env.OPENAI_API_KEY }) : null;
    }
    supportsMime(mime) {
        return (0, gateway_1.isImage)(mime) || (0, gateway_1.isPdf)(mime);
    }
    async extract(input) {
        if (!this.client)
            throw new Error('OpenAI API key not configured');
        if ((0, gateway_1.isImage)(input.mime)) {
            const resp = await this.client.chat.completions.create({
                model: process.env.OPENAI_MODEL_PRIMARY || 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a document extraction engine. Return JSON with fields and optional line items. No markdown.',
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image_url',
                                image_url: { url: `data:${input.mime};base64,${input.buffer.toString('base64')}` },
                            },
                        ],
                    },
                ],
                temperature: 0.1,
                max_tokens: 2000,
            });
            const content = resp.choices?.[0]?.message?.content || '{}';
            let parsed;
            try {
                parsed = JSON.parse(content);
            }
            catch {
                parsed = { fields: [], lines: [] };
            }
            return {
                rawPayload: resp,
                pages: 1,
                fields: parsed.fields || [],
                lines: parsed.lines || [],
            };
        }
        // Minimal PDF path placeholder: treat as single page for now
        return {
            rawPayload: { note: 'pdf path to be enhanced' },
            pages: undefined,
            fields: [],
            lines: [],
        };
    }
}
exports.OpenAIVisionProvider = OpenAIVisionProvider;
