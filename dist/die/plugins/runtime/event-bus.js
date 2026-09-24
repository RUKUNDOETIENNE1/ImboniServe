"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginEventBus = void 0;
const events_1 = require("events");
class PluginEventBus {
    constructor() {
        this.emitter = new events_1.EventEmitter();
        this.emitter.setMaxListeners(100);
    }
    subscribe(eventType, handler) {
        const wrapped = async (event) => {
            try {
                await handler(event);
            }
            catch (error) {
                // Handlers must never throw back to the emitter
                console.error('[PluginEventBus] Handler error', { eventType, error });
            }
        };
        this.emitter.on(eventType, wrapped);
        return () => {
            this.emitter.off(eventType, wrapped);
        };
    }
    async publish(event) {
        const listeners = [
            ...this.emitter.listeners(event.type),
            ...this.emitter.listeners('*'),
        ];
        if (listeners.length === 0)
            return;
        await Promise.allSettled(listeners.map((listener) => Promise.resolve(listener(event))));
    }
}
exports.PluginEventBus = PluginEventBus;
