# KNOWLEDGE RETRIEVAL ENGINE

**Platform:** Hospitality Intelligence Platform v2.3.0
**Module:** Hospitality AI Copilot™ v1.0 — Phase 6
**File:** `src/lib/hospitality-ai/copilot/knowledge-retrieval-engine.ts`
**Version:** 1.0.0

---

## 1. Overview

The Knowledge Retrieval Engine retrieves relevant knowledge from the Hospitality Knowledge™ layer, Hospitality Memory™, and Heart Pulse™ events. It builds a **provenance graph** that links Knowledge → Memory → Events, enabling complete traceability from recommendations back to original events.

---

## 2. Architecture Position

```text
Context Engine
      ↓
Knowledge Retrieval Engine  ← THIS MODULE
      ↓
Evidence Evaluation Engine
```

---

## 3. Retrieval Sources

| Source | Description | Consumer Interface |
|--------|-------------|--------------------|
| Hospitality Knowledge™ | Validated organizational knowledge | `loadKnowledgeForCopilot()` |
| Hospitality Memory™ | Operational memories | `loadMemoriesForCopilot()` |
| Heart Pulse™ Events | Operational events | `loadEventsForCopilot()` |

---

## 4. Provenance Graph

The engine builds a `ProvenanceGraph` with `ProvenanceNode` entries:

```typescript
interface ProvenanceNode {
  id: string
  type: 'knowledge' | 'memory' | 'event'
  title: string
  sourceId: string
  references: string[]      // IDs of related nodes
  verified: boolean
}
```

The graph links:
- **Knowledge** → references supporting **Memories**
- **Memories** → references source **Events**

The `verifyProvenance` method validates the complete chain.

---

## 5. Relevance Ranking

Retrieved knowledge is ranked by:
- **Domain relevance** — Match to detected operational domain
- **Intent relevance** — Match to classified intent
- **Temporal relevance** — Recency of knowledge
- **Confidence** — Knowledge confidence score

---

## 6. Test/Sandbox Mode

The engine supports `retrieveFromSupplied()` for test/sandbox mode, allowing pre-fetched knowledge/memory/events to be injected without a live database.

---

## 7. Output: KnowledgeRetrievalResult

```typescript
interface KnowledgeRetrievalResult {
  requestId: string
  knowledge: KnowledgeEntity[]
  memories: HospitalityMemoryEntity[]
  events: OperationalEvent[]
  provenanceGraph: ProvenanceGraph
  relevanceScores: Map<string, number>
  retrievalTime: number
  retrievalVersion: string     // "1.0.0"
}
```

---

## 8. API

```typescript
const engine = getKnowledgeRetrievalEngine()

// Retrieve from live store
const result = engine.retrieve(request, context): Promise<KnowledgeRetrievalResult>

// Retrieve from supplied evidence (test/sandbox)
const result = engine.retrieveFromSupplied(request, context, supplied): KnowledgeRetrievalResult

// Verify provenance
engine.verifyProvenance(graph: ProvenanceGraph): boolean
```

---

## 9. Validation Results

| Test | Result |
|------|--------|
| Supplied evidence is retrieved | ✅ PASS |
| Provenance graph is built | ✅ PASS |
| Provenance chain is verified | ✅ PASS |
| Relevance ranking is applied | ✅ PASS |

---

## 10. Certification

The Knowledge Retrieval Engine is **certified for production**. It retrieves knowledge with complete provenance chains and supports test/sandbox mode.
