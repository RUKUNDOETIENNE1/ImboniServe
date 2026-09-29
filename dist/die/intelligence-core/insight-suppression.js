"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suppressAndMerge = suppressAndMerge;
const store = new Map();
const SUPPRESS_MS = 5 * 60 * 1000; // 5 minutes
function makeKey(i) {
    return [i.type, i.severity, i.affectedDomains?.join(',') || ''].join('#');
}
function suppressAndMerge(insights) {
    const out = [];
    const now = Date.now();
    for (const i of insights) {
        const k = makeKey(i);
        const st = store.get(k);
        if (!st) {
            store.set(k, { key: k, firstDetectedAt: now, lastObservedAt: now, occurrences: 1 });
            out.push(i);
            continue;
        }
        // duplicate within window -> merge by bumping occurrences and lastObservedAt
        if (now - st.lastObservedAt < SUPPRESS_MS) {
            st.lastObservedAt = now;
            st.occurrences += 1;
            i.ongoing = true;
            i.occurrences = st.occurrences;
            i.durationMinutes = Math.round((st.lastObservedAt - st.firstDetectedAt) / 60000);
            out.push(i);
        }
        else {
            // window expired, treat as new occurrence cycle
            store.set(k, { key: k, firstDetectedAt: now, lastObservedAt: now, occurrences: 1 });
            out.push(i);
        }
    }
    return { insights: out, state: Array.from(store.values()) };
}
