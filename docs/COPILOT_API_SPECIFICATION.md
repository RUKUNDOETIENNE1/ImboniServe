# COPILOT API SPECIFICATION

**Platform:** Hospitality Intelligence Platform v2.3.0
**Module:** Hospitality AI Copilot™ v1.0 — Phase 12
**File:** `src/lib/hospitality-ai/copilot/api.ts`
**Version:** 1.0.0

---

## 1. Overview

The Copilot API exposes the Hospitality AI Copilot™ through well-defined consumer interfaces. The API is the single entry point for all Copilot functionality.

---

## 2. Architecture Position

```text
Consumer (UI, CLI, Integration)
      ↓
Copilot API  ← THIS MODULE
      ↓
Copilot Orchestrator
      ↓
11-Stage Pipeline
```

---

## 3. API Endpoints

### 3.1 Operational Recommendation Request

Submit a question and receive evidence-backed recommendations.

```typescript
query(request: CopilotQueryRequest): Promise<CopilotQueryResponse>
```

**Request:**
```typescript
interface CopilotQueryRequest {
  businessId: string               // Required
  question: string                 // Required
  userId?: string
  userRole?: UserRole
  shift?: ShiftType
  outletId?: string
  timeRange?: { start: string; end: string }
  includeAlternatives?: boolean
  maxRecommendations?: number
  explainabilityLevel?: 'brief' | 'standard' | 'full'
  conversationId?: string
}
```

**Response:**
```typescript
interface CopilotQueryResponse {
  success: boolean
  response?: CopilotResponse
  error?: string
}
```

---

### 3.2 Context-Aware Assistance

Query with explicit context hints (active alerts, workflows, business objectives).

```typescript
assist(request: CopilotAssistRequest): Promise<CopilotQueryResponse>
```

**Additional fields:**
```typescript
interface CopilotAssistRequest extends CopilotQueryRequest {
  activeAlerts?: AlertReference[]
  activeWorkflows?: WorkflowReference[]
  businessObjectives?: string[]
}
```

---

### 3.3 Multi-Step Operational Analysis

Run multiple queries in sequence with a combined summary.

```typescript
multiStep(request: CopilotMultiStepRequest): Promise<CopilotMultiStepResponse>
```

**Request:**
```typescript
interface CopilotMultiStepRequest {
  businessId: string
  steps: CopilotQueryRequest[]
  combineSummary?: boolean
}
```

**Response:**
```typescript
interface CopilotMultiStepResponse {
  success: boolean
  results: CopilotQueryResponse[]
  combinedSummary?: string
  error?: string
}
```

---

### 3.4 Explainability Retrieval

Retrieve reasoning traces by requestId and optionally recommendationId.

```typescript
getExplainability(request: CopilotExplainabilityRequest): Promise<CopilotExplainabilityResponse>
```

---

### 3.5 Recommendation History

Retrieve past responses filtered by businessId, since, domain, intent, limit.

```typescript
getHistory(request: CopilotHistoryRequest): Promise<CopilotHistoryResponse>
```

**Request:**
```typescript
interface CopilotHistoryRequest {
  businessId: string
  since?: string
  domain?: OperationalDomain
  intent?: IntentType
  limit?: number               // Default: 50, Max: 100
}
```

---

### 3.6 Reasoning Trace Inspection

Inspect the reasoning trace for a specific request.

```typescript
getReasoningTrace(requestId: string): Promise<{
  success: boolean
  trace?: ExplainabilityTrace
  error?: string
}>
```

---

### 3.7 Confidence Inspection

Inspect confidence scores overall or per-recommendation.

```typescript
getConfidence(request: CopilotConfidenceRequest): Promise<CopilotConfidenceResponse>
```

---

## 4. Convenience Functions

```typescript
queryCopilot(request: CopilotQueryRequest): Promise<CopilotQueryResponse>
assistCopilot(request: CopilotAssistRequest): Promise<CopilotQueryResponse>
multiStepCopilot(request: CopilotMultiStepRequest): Promise<CopilotMultiStepResponse>
getExplainability(request: CopilotExplainabilityRequest): Promise<CopilotExplainabilityResponse>
getHistory(request: CopilotHistoryRequest): Promise<CopilotHistoryResponse>
getReasoningTrace(requestId: string): Promise<{ success, trace?, error? }>
getConfidence(request: CopilotConfidenceRequest): Promise<CopilotConfidenceResponse>
```

---

## 5. Test/Sandbox Mode

The API supports test/sandbox mode via `withInjectedEvidence()`:

```typescript
const api = getCopilotAPI()
api.withInjectedEvidence({
  knowledge: [...],
  memories: [...],
  events: [...]
})
```

This allows the validation suite and developers to run the Copilot without a live database.

---

## 6. History Management

The API maintains in-memory history (max 100 entries per business). History is filtered by:
- `businessId` (required)
- `since` (timestamp)
- `domain` (operational domain)
- `intent` (intent type)
- `limit` (max results)

---

## 7. Error Handling

All API methods return a consistent structure:
```typescript
{ success: boolean, error?: string, ... }
```

Errors include:
- Missing `businessId` or `question`
- Empty question
- No evidence found
- Pipeline execution errors

---

## 8. Usage Examples

### Basic Query
```typescript
import { queryCopilot } from '@/lib/hospitality-ai/copilot'

const result = await queryCopilot({
  businessId: 'resto-001',
  question: 'Why are ticket times so slow on Friday?',
  userRole: 'kitchen_manager',
  shift: 'evening',
  explainabilityLevel: 'standard'
})

if (result.success && result.response) {
  for (const rec of result.response.recommendations) {
    console.log(`[${rec.priority}] ${rec.title} (confidence: ${rec.confidence})`)
  }
}
```

### Multi-Step Analysis
```typescript
const result = await multiStepCopilot({
  businessId: 'resto-001',
  steps: [
    { businessId: 'resto-001', question: 'What is the status of the kitchen?' },
    { businessId: 'resto-001', question: 'What are the bottlenecks?' },
    { businessId: 'resto-001', question: 'What do you recommend?' }
  ],
  combineSummary: true
})
```

### Explainability Retrieval
```typescript
const trace = await getReasoningTrace('req-abc-123')
if (trace.success && trace.trace) {
  console.log(trace.trace.explanation)
}
```

---

## 9. Validation Results

| Test | Result |
|------|--------|
| Query API returns recommendations | ✅ PASS |
| Explainability API returns traces | ✅ PASS |
| History API returns past responses | ✅ PASS |
| Confidence API returns confidence scores | ✅ PASS |
| Multi-step API returns combined results | ✅ PASS |
| Reasoning trace API returns trace | ✅ PASS |
| Context-aware assist API returns recommendations | ✅ PASS |

---

## 10. Certification

The Copilot API is **certified for production**. It exposes 7+ well-defined endpoints with consistent request/response types, history management, and test/sandbox mode.
