"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const module_1 = __importDefault(require("module"));
const path_1 = __importDefault(require("path"));
const globalKey = '__DIE_ALIAS_BOOTSTRAPPED__';
if (!globalThis[globalKey]) {
    const mod = module_1.default;
    const originalResolveFilename = mod._resolveFilename?.bind(mod);
    if (typeof originalResolveFilename === 'function') {
        const distRoot = path_1.default.resolve(__dirname, '..', '..');
        mod._resolveFilename = function patchedResolveFilename(request, parent, isMain, options) {
            if (typeof request === 'string' && request.startsWith('@/lib/')) {
                const relativePath = request.slice('@/lib/'.length);
                const target = path_1.default.resolve(distRoot, relativePath);
                return originalResolveFilename.call(this, target, parent, isMain, options);
            }
            return originalResolveFilename.call(this, request, parent, isMain, options);
        };
    }
    ;
    globalThis[globalKey] = true;
}
