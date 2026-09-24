# AI Copilot™ - README

**Version:** 1.0  
**Status:** Production Ready  
**Type:** Sixth and Final Intelligence Consumer

---

## Overview

AI Copilot™ is the **sixth and final production consumer** of the Hospitality Intelligence Platform. It provides a conversational interface for managers to interact naturally with platform intelligence.

**AI Copilot™ is NOT:**
- A replacement for dashboards
- A replacement for HIE
- An independent intelligence engine

**AI Copilot™ IS:**
- A conversational interface
- An intelligence explainer
- A natural language query system
- A pure consumer of platform intelligence

---

## Core Principle

**AI Copilot™ does NOT generate intelligence.**

It explains intelligence already produced by HIE and preserved in IKB.

- No business logic duplication
- No independent analysis engine
- Pure consumer of existing platform capabilities
- Every response originates from platform intelligence

---

## Architecture

```
Question
        ↓
Intent Detection
        ↓
Platform Query
        ↓
HIE (retrieves intelligence)
        ↓
IKB (retrieves historical context)
        ↓
Structured Intelligence Reports
        ↓
Evidence + Replay References
        ↓
AI Response
        ↓
Manager
```

**Zero modifications to platform components** ✅

---

## Features

### Conversational Interface
- Natural language questions
- Context-aware responses
- Evidence-based answers
- Replay integration
- Suggested follow-ups

### Supported Topics
- Service Intelligence™
- Daily Briefings™
- Kitchen Intelligence™
- Menu Intelligence™
- Multi-location Intelligence™
- Historical knowledge
- Comparisons
- Operational trends

### Response Components
- Answer
- Confidence score
- Evidence summary
- Historical context
- Suggested questions
- Replay links
- Evidence links

---

## Usage

### Basic Usage

```typescript
import { createAICopilotService } from '@/lib/ai-copilot'

const service = createAICopilotService()

const response = await service.processMessage({
  message: 'Why was lunch slow today?',
  includeEvidence: true,
  includeHistorical: true,
  includeReplay: true,
})

console.log(response.message.content)
console.log(response.message.confidence)
console.log(response.message.evidence)
```

### Conversation Context

```typescript
// First question
const response1 = await service.processMessage({
  message: 'Show me today\'s lunch performance',
})

// Follow-up question (context maintained)
const response2 = await service.processMessage({
  conversationId: response1.conversationId,
  message: 'Why was it slow?',
})
```

---

## Example Questions

### Service Questions
- "Why was lunch slow today?"
- "Which waiter improved the most this week?"
- "Show me today's service quality"

### Kitchen Questions
- "What caused the kitchen bottleneck yesterday?"
- "Which station is performing best?"
- "Show me preparation times"

### Menu Questions
- "Which menu item creates the most operational delays?"
- "What are the most popular dishes?"
- "Show me cancellation patterns"

### Portfolio Questions
- "Show me restaurants with declining service quality"
- "Compare Restaurant A with Restaurant B"
- "Which location is improving fastest?"

### Historical Questions
- "Has this happened before?"
- "Show me the trend"
- "Compare with last week"

---

## API Routes

### Conversation

**Endpoint:** `POST /api/ai-copilot/conversation`

**Request:**
```json
{
  "conversationId": "conv_123",
  "message": "Why was lunch slow today?",
  "includeEvidence": true,
  "includeHistorical": true,
  "includeReplay": true
}
```

**Response:**
```json
{
  "success": true,
  "conversationId": "conv_123",
  "message": {
    "id": "msg_456",
    "role": "assistant",
    "content": "Based on platform intelligence...",
    "confidence": 0.85,
    "evidence": [...],
    "replayLinks": [...],
    "suggestedQuestions": [...]
  }
}
```

---

## Components

```typescript
import { ConversationInterface } from '@/components/ai-copilot'

<ConversationInterface 
  conversation={conversation} 
  onConversationUpdate={setConversation} 
/>
```

---

## Evidence Traceability

Every response includes:
- Evidence count
- Related reports
- Related events
- Confidence score
- Affected entities
- Replay references

---

## Replay Integration

Every answer supports:
- **▶ Replay** - Opens Service Replay™ at relevant moment
- Timestamp-accurate navigation
- Context preservation
- Related events visible

---

## Conversation Memory

**Within session only:**
- Remembers context
- Understands references ("it", "that", "this")
- Maintains conversation flow

**Does NOT persist:**
- No cross-session memory
- No permanent conversation storage
- Session-based only

---

## Dashboard Integration

Every dashboard provides "Ask AI Copilot™":
- Service Intelligence™ → Ask why score changed
- Kitchen Intelligence™ → Explain bottleneck
- Menu Intelligence™ → Explain dish performance
- Multi-location Intelligence™ → Explain restaurant trends

---

## Export

Support exporting conversations as:
- **JSON** - Full conversation data
- **Markdown** - Human-readable format
- **PDF** - Planned

Includes:
- Questions and answers
- Evidence references
- Replay links
- Timestamps
- Confidence scores

---

## Performance

### Target Performance
- **Intent Detection:** < 50ms
- **HIE Query:** < 100ms
- **IKB Query:** < 100ms
- **Response Generation:** < 50ms
- **Total:** < 300ms

---

## Security

- Session-based authentication required
- Role-based access (all authenticated users)
- Respects existing permissions
- Tenant isolation enforced
- Users only see authorized data

---

## Accessibility

- ✅ Keyboard navigation support
- ✅ Screen reader compatible
- ✅ Focus management
- ✅ Responsive design
- ✅ High contrast mode support

---

## Testing

### Unit Tests
```bash
npm test src/lib/ai-copilot/__tests__/service.test.ts
```

### End-to-End Demonstration
```bash
npm test src/lib/ai-copilot/__tests__/e2e-demo.test.ts
```

---

## File Structure

```
src/lib/ai-copilot/
├── types.ts                    # Type definitions (600 lines)
├── service.ts                  # Main service (200 lines)
├── intent-handler.ts           # Intent detection (100 lines)
├── query-builder.ts            # Query building (50 lines)
├── index.ts                    # Public API
├── README.md                   # This file
└── __tests__/
    ├── service.test.ts         # Service tests
    └── e2e-demo.test.ts        # End-to-end demonstration

src/components/ai-copilot/
├── conversation-interface.tsx  # Main interface (200 lines)
└── index.ts                    # Component exports

src/app/dashboard/ai-copilot/
└── page.tsx                    # Main page

src/app/api/ai-copilot/
└── conversation/route.ts       # Conversation endpoint
```

---

## Comparison with Other Intelligence Consumers

| Aspect | Service Intelligence™ | Daily Briefings™ | Kitchen Intelligence™ | Menu Intelligence™ | Multi-location Intelligence™ | AI Copilot™ |
|--------|----------------------|------------------|----------------------|--------------------|------------------------------|-------------|
| **Purpose** | Service analysis | Daily check-in | Kitchen performance | Menu performance | Portfolio management | Conversational interface |
| **Interface** | Dashboard | Dashboard | Dashboard | Dashboard | Dashboard | Conversation |
| **Interaction** | Visual | Visual | Visual | Visual | Visual | Natural language |
| **Target User** | Manager | Manager | Kitchen Manager | Owner/Manager | Executive/Owner | All users |

---

## Known Limitations

1. **Session-based Memory:** Context not persisted across sessions
2. **Intent Detection:** Basic pattern matching (can be enhanced with ML)
3. **Response Generation:** Template-based (can be enhanced with LLM)
4. **PDF Export:** Not yet implemented

---

**AI Copilot™ - Conversational intelligence for restaurant operations**
