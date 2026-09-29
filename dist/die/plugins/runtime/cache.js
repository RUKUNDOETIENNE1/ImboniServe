"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachedValue = getCachedValue;
exports.setCachedValue = setCachedValue;
exports.deleteCachedValue = deleteCachedValue;
exports.clearNamespace = clearNamespace;
const globalScope = globalThis;
if (!globalScope.__diePluginCache) {
    globalScope.__diePluginCache = new Map();
}
const cacheStore = globalScope.__diePluginCache;
function buildKey(namespace, key) {
    return `${namespace}:${key}`;
}
function getCachedValue(namespace, key) {
    const cacheKey = buildKey(namespace, key);
    const entry = cacheStore.get(cacheKey);
    if (!entry) {
        return undefined;
    }
    if (entry.expiresAt <= Date.now()) {
        cacheStore.delete(cacheKey);
        return undefined;
    }
    return entry.value;
}
function setCachedValue(namespace, key, value, ttlMs) {
    if (ttlMs <= 0)
        return;
    const cacheKey = buildKey(namespace, key);
    cacheStore.set(cacheKey, {
        value,
        expiresAt: Date.now() + ttlMs,
    });
}
function deleteCachedValue(namespace, key) {
    cacheStore.delete(buildKey(namespace, key));
}
function clearNamespace(namespace) {
    const prefix = `${namespace}:`;
    for (const cacheKey of cacheStore.keys()) {
        if (cacheKey.startsWith(prefix)) {
            cacheStore.delete(cacheKey);
        }
    }
}
