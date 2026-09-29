"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBusinessInsights = generateBusinessInsights;
const reasoning_engine_1 = require("../../die/business-intelligence/reasoning-engine");
// Thin facade to avoid circular imports between correlation-engine and reasoning-engine
async function generateBusinessInsights() {
    return reasoning_engine_1.businessReasoning.generateInsights();
}
