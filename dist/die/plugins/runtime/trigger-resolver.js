"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriggerResolver = void 0;
class TriggerResolver {
    constructor(plugins) {
        this.plugins = plugins;
    }
    resolve(eventType) {
        return this.plugins().filter((plugin) => plugin.triggers.includes(eventType));
    }
}
exports.TriggerResolver = TriggerResolver;
