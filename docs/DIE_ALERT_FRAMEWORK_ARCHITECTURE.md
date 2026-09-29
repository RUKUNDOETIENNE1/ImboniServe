# DIE Alert Framework Architecture

**Date:** 2026-06-19  
**Phase:** v1.5 Enterprise Operations Layer — Phase 4  
**Status:** ✅ **FOUNDATION COMPLETE**

---

## Executive Summary

The DIE Alert Framework provides a pluggable alerting system for Control Plane events. v1.5 establishes the architectural foundation with console-only delivery. Future versions will enable email, Slack, and webhook integrations.

### v1.5 Status

✅ **Alert types defined**  
✅ **Adapter pattern implemented**  
✅ **Console adapter active**  
✅ **Placeholder adapters created**  
⏳ **External integrations disabled** (v2.0)

---

## Alert Types

### SYSTEM_HEALTH_LOW
**Trigger:** Overall health score drops below threshold  
**Severity:** HIGH  
**Example:** "System health score dropped to 45/100"

### GOVERNANCE_ANOMALY
**Trigger:** Governance layer detects lifecycle inconsistency  
**Severity:** MEDIUM  
**Example:** "Plugin enabled without prior installation"

### LIFECYCLE_DRIFT
**Trigger:** Excessive install/enable/disable cycles detected  
**Severity:** MEDIUM  
**Example:** "Plugin has 12 enables and 11 disables (possible instability)"

### PLUGIN_FAILURE
**Trigger:** Plugin execution fails or throws error  
**Severity:** HIGH  
**Example:** "QR Menu plugin failed to render dashboard route"

### MARKETPLACE_INCONSISTENCY
**Trigger:** Marketplace metadata incomplete or invalid  
**Severity:** LOW  
**Example:** "3 plugins missing marketplace metadata"

---

## Architecture

### Adapter Pattern

```typescript
interface AlertAdapter {
  readonly channel: AlertChannel
  readonly enabled: boolean
  deliver(alert: Alert): Promise<AlertDeliveryResult>
}
```

**Benefits:**
- Pluggable delivery channels
- Independent enable/disable per channel
- Consistent interface across adapters
- Easy to add new channels

### Alert Structure

```typescript
interface Alert {
  id: string                    // Unique identifier
  type: AlertType               // Alert category
  severity: AlertSeverity       // low | medium | high | critical
  title: string                 // Short summary
  message: string               // Detailed description
  metadata?: Record<string, unknown> // Additional context
  timestamp: string             // ISO 8601
}
```

### Delivery Service

```typescript
class AlertDeliveryService {
  async sendAlert(
    type: AlertType,
    severity: AlertSeverity,
    title: string,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<AlertDeliveryResult[]>
}
```

**Features:**
- Single entry point for all alerts
- Parallel delivery to multiple channels
- Result tracking per channel
- Error handling and fallback

---

## Adapters

### Console Adapter (Active)

**Status:** ✅ ENABLED in v1.5  
**Purpose:** Development and debugging  
**Output:** Formatted console logs

**Example Output:**
```
================================================================================
[DIE ALERT] GOVERNANCE_ANOMALY - MEDIUM
================================================================================
Title:     Plugin Lifecycle Anomaly Detected
Message:   Plugin qr-menu enabled without prior installation
Timestamp: 2026-06-19T10:30:45.123Z
ID:        abc123def456
Metadata:
{
  "pluginId": "qr-menu",
  "anomalyType": "ENABLE_WITHOUT_INSTALL"
}
================================================================================
```

**Configuration:** None required (always enabled)

---

### Webhook Adapter (Placeholder)

**Status:** ⏳ DISABLED in v1.5  
**Purpose:** Custom integrations  
**Activation:** v2.0

**Future Configuration:**
```typescript
const webhookAdapter = new WebhookAlertAdapter(
  process.env.DIE_ALERT_WEBHOOK_URL
)
```

**Payload Format:**
```json
{
  "id": "abc123",
  "type": "SYSTEM_HEALTH_LOW",
  "severity": "high",
  "title": "System Health Degraded",
  "message": "Overall health score: 45/100",
  "timestamp": "2026-06-19T10:30:45.123Z",
  "metadata": {
    "score": 45,
    "threshold": 50
  }
}
```

---

### Email Adapter (Placeholder)

**Status:** ⏳ DISABLED in v1.5  
**Purpose:** Email notifications  
**Activation:** v2.0

**Future Configuration:**
```typescript
const emailAdapter = new EmailAlertAdapter(
  process.env.DIE_ALERT_EMAIL_RECIPIENT
)
```

**Email Template:**
- Subject: `[DIE Alert] {type} - {severity}`
- HTML formatted with severity colors
- Includes all alert metadata
- Links to Control Plane dashboard

**Integration:**
- Uses existing `nodemailer` setup
- Leverages email templates
- Supports multiple recipients

---

### Slack Adapter (Placeholder)

**Status:** ⏳ DISABLED in v1.5  
**Purpose:** Slack notifications  
**Activation:** v2.0

**Future Configuration:**
```typescript
const slackAdapter = new SlackAlertAdapter(
  process.env.DIE_ALERT_SLACK_WEBHOOK
)
```

**Message Format:**
- Slack Block Kit formatting
- Severity-based emojis
- Clickable links
- Metadata as fields

**Example:**
```
🚨 System Health Degraded

Type: SYSTEM_HEALTH_LOW
Severity: high

Overall health score dropped to 45/100. Immediate investigation required.
```

---

## Usage Examples

### Basic Alert

```typescript
import { alertDeliveryService } from '@/lib/die/control-plane/alerts/alert-delivery.service'

await alertDeliveryService.sendAlert(
  'SYSTEM_HEALTH_LOW',
  'high',
  'System Health Degraded',
  'Overall health score dropped to 45/100',
  { score: 45, threshold: 50 }
)
```

### Governance Anomaly

```typescript
await alertDeliveryService.sendAlert(
  'GOVERNANCE_ANOMALY',
  'medium',
  'Plugin Lifecycle Anomaly',
  'Plugin qr-menu enabled without prior installation',
  {
    pluginId: 'qr-menu',
    anomalyType: 'ENABLE_WITHOUT_INSTALL'
  }
)
```

### Plugin Failure

```typescript
await alertDeliveryService.sendAlert(
  'PLUGIN_FAILURE',
  'high',
  'QR Menu Plugin Failure',
  'Failed to render dashboard route: /dashboard/die/plugins/qr-menu',
  {
    pluginId: 'qr-menu',
    route: '/dashboard/die/plugins/qr-menu',
    error: 'TypeError: Cannot read property...'
  }
)
```

---

## Integration Points

### Control Plane Health Monitoring

```typescript
// In control-plane.service.ts
const health = await this.getSystemHealthReport()

if (health.score < 50) {
  await alertDeliveryService.sendAlert(
    'SYSTEM_HEALTH_LOW',
    'high',
    'System Health Critical',
    `System health score: ${health.score}/100`,
    { score: health.score, issues: health.issues }
  )
}
```

### Governance Anomaly Detection

```typescript
// In governance-guard.service.ts
const anomalies = await this.detectEnableAnomalies(pluginId, businessId)

for (const anomaly of anomalies) {
  await alertDeliveryService.sendAlert(
    'GOVERNANCE_ANOMALY',
    anomaly.severity === 'HIGH' ? 'high' : 'medium',
    'Governance Anomaly Detected',
    anomaly.details,
    { pluginId, anomalyType: anomaly.anomalyType }
  )
}
```

### Plugin Ecosystem Health

```typescript
// In plugin-ecosystem-health.service.ts
const drifts = await this.detectLifecycleDrift()

for (const drift of drifts) {
  await alertDeliveryService.sendAlert(
    'LIFECYCLE_DRIFT',
    drift.severity === 'HIGH' ? 'high' : 'medium',
    'Plugin Lifecycle Drift',
    drift.details,
    { pluginId: drift.pluginId, driftType: drift.driftType }
  )
}
```

---

## File Structure

```
src/lib/die/control-plane/alerts/
├── types.ts                           # Alert types and interfaces
├── alert-delivery.service.ts          # Main delivery service
└── adapters/
    ├── console-adapter.ts             # ✅ Active in v1.5
    ├── webhook-adapter.ts             # ⏳ Placeholder
    ├── email-adapter.ts               # ⏳ Placeholder
    └── slack-adapter.ts               # ⏳ Placeholder
```

---

## Configuration

### v1.5 (Current)

No configuration required. Console adapter is always enabled.

### v2.0 (Future)

Environment variables:
```env
# Webhook
DIE_ALERT_WEBHOOK_URL=https://your-webhook.com/alerts
DIE_ALERT_WEBHOOK_ENABLED=true

# Email
DIE_ALERT_EMAIL_RECIPIENT=ops@yourcompany.com
DIE_ALERT_EMAIL_ENABLED=true

# Slack
DIE_ALERT_SLACK_WEBHOOK=https://hooks.slack.com/services/...
DIE_ALERT_SLACK_ENABLED=true
```

---

## Testing

### Manual Testing

```typescript
import { alertDeliveryService } from '@/lib/die/control-plane/alerts/alert-delivery.service'

// Test console adapter
const results = await alertDeliveryService.sendAlert(
  'SYSTEM_HEALTH_LOW',
  'high',
  'Test Alert',
  'This is a test alert',
  { test: true }
)

console.log('Delivery results:', results)
```

### Expected Output

```
================================================================================
[DIE ALERT] SYSTEM_HEALTH_LOW - HIGH
================================================================================
Title:     Test Alert
Message:   This is a test alert
Timestamp: 2026-06-19T10:30:45.123Z
ID:        abc123def456
Metadata:
{
  "test": true
}
================================================================================

Delivery results: [
  {
    channel: 'console',
    success: true,
    deliveredAt: '2026-06-19T10:30:45.456Z'
  }
]
```

---

## Future Enhancements

### v2.0 (Q3 2026)
- Enable webhook adapter
- Enable email adapter
- Enable Slack adapter
- Add alert history persistence
- Add alert muting/snoozing
- Add alert routing rules

### v3.0 (Q4 2026)
- Add PagerDuty integration
- Add Microsoft Teams integration
- Add SMS notifications (Twilio)
- Add alert aggregation
- Add alert escalation policies
- Add on-call rotation support

---

## Security Considerations

### Sensitive Data

**DO NOT include in alerts:**
- API keys or secrets
- User passwords
- Payment information
- Personal identifiable information (PII)

**Safe to include:**
- Plugin IDs
- Health scores
- Anomaly types
- Error messages (sanitized)
- Timestamps
- Counts and metrics

### Webhook Security

**v2.0 Requirements:**
- HTTPS only
- Signature verification
- Rate limiting
- Retry with exponential backoff

### Email Security

**v2.0 Requirements:**
- SPF/DKIM/DMARC configured
- TLS encryption
- Recipient validation
- No sensitive data in subject

---

## Monitoring

### Alert Delivery Metrics

Track:
- Total alerts sent
- Delivery success rate per channel
- Average delivery time
- Failed deliveries
- Retry attempts

### Alert Volume

Monitor:
- Alerts per hour
- Alerts by type
- Alerts by severity
- Alert trends over time

### Alert Fatigue Prevention

Implement:
- Alert deduplication
- Alert throttling
- Alert muting
- Alert aggregation

---

## Conclusion

The DIE Alert Framework v1.5 establishes a solid foundation for enterprise alerting. Console-only delivery is sufficient for development and initial production deployments. Future versions will enable external integrations for production-grade alerting.

---

**Architecture Completed:** 2026-06-19  
**Architect:** Cascade AI  
**Status:** ✅ FOUNDATION COMPLETE  
**Version:** v1.5 Phase 4
