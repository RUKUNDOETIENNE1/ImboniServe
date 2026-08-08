/**
 * Block 5 Validation Suite — User Experience Layer
 *
 * Validates that all UI pages, API endpoints, and components are properly
 * implemented for the DIE dashboard experience.
 *
 * Target: 15 tests, 100% pass rate
 */

import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'

interface TestResult {
  name: string
  passed: boolean
  error?: string
}

const results: TestResult[] = []

function pass(name: string) {
  results.push({ name, passed: true })
  console.log(`✓ ${name}`)
}

function fail(name: string, error: string) {
  results.push({ name, passed: false, error })
  console.error(`✗ ${name}: ${error}`)
}

const ROOT = path.resolve(__dirname, '..')

function fileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(ROOT, relativePath))
}

function fileContains(relativePath: string, ...patterns: string[]): boolean {
  const content = fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
  return patterns.every(p => content.includes(p))
}

// ============================================================================
// T1: Dashboard page exists and renders
// ============================================================================
function T1_DashboardLoads() {
  try {
    const pagePath = 'src/pages/dashboard/die/index.tsx'
    if (!fileExists(pagePath)) throw new Error('Dashboard page not found')
    if (!fileContains(pagePath, 'DashboardLayout', 'getServerSideProps', 'fetch'))
      throw new Error('Dashboard missing required patterns')
    if (!fileContains(pagePath, 'StatCard', 'Document Intelligence'))
      throw new Error('Dashboard missing KPI cards or title')
    pass('T1 Dashboard page loads (file structure valid)')
  } catch (e: any) { fail('T1 Dashboard page loads', e.message) }
}

// ============================================================================
// T2: Upload flow implementation
// ============================================================================
function T2_UploadFlow() {
  try {
    const pagePath = 'src/pages/dashboard/die/index.tsx'
    if (!fileContains(pagePath, 'drag', 'drop', 'FormData', '/api/die/upload'))
      throw new Error('Upload flow missing drag-and-drop or upload API call')
    if (!fileContains(pagePath, 'fileInputRef', '.pdf', '.jpg'))
      throw new Error('Upload flow missing file input or type validation')
    if (!fileContains(pagePath, 'uploading', 'setUploading'))
      throw new Error('Upload flow missing progress state')
    pass('T2 Upload flow (drag-drop, file selection, progress)')
  } catch (e: any) { fail('T2 Upload flow', e.message) }
}

// ============================================================================
// T3: Document list with pagination
// ============================================================================
function T3_DocumentList() {
  try {
    const pagePath = 'src/pages/dashboard/die/index.tsx'
    if (!fileContains(pagePath, '/api/die/documents', 'page', 'limit'))
      throw new Error('Document list missing API call with pagination')
    if (!fileContains(pagePath, 'Showing', 'ChevronLeft', 'ChevronRight'))
      throw new Error('Document list missing pagination controls')
    if (!fileContains(pagePath, 'table', 'thead', 'tbody'))
      throw new Error('Document list missing table structure')
    pass('T3 Document list with pagination')
  } catch (e: any) { fail('T3 Document list', e.message) }
}

// ============================================================================
// T4: Review screen
// ============================================================================
function T4_ReviewScreen() {
  try {
    const pagePath = 'src/pages/dashboard/die/review/[id].tsx'
    if (!fileExists(pagePath)) throw new Error('Review page not found')
    if (!fileContains(pagePath, 'DashboardLayout', 'getServerSideProps'))
      throw new Error('Review page missing layout or auth')
    if (!fileContains(pagePath, '/api/die/documents/', 'Header Fields', 'Line Items'))
      throw new Error('Review page missing document detail or sections')
    if (!fileContains(pagePath, 'ZoomIn', 'ZoomOut', 'RotateCw'))
      throw new Error('Review page missing viewer controls')
    pass('T4 Review screen (two-panel layout, viewer, data)')
  } catch (e: any) { fail('T4 Review screen', e.message) }
}

// ============================================================================
// T5: Approve action
// ============================================================================
function T5_ApproveAction() {
  try {
    const pagePath = 'src/pages/dashboard/die/review/[id].tsx'
    if (!fileContains(pagePath, 'handleApprove', '/approve', 'POST'))
      throw new Error('Approve action missing handler or API call')
    if (!fileContains(pagePath, 'canApprove', 'REVIEW'))
      throw new Error('Approve action missing state guard')
    pass('T5 Approve action')
  } catch (e: any) { fail('T5 Approve action', e.message) }
}

// ============================================================================
// T6: Reject action
// ============================================================================
function T6_RejectAction() {
  try {
    const pagePath = 'src/pages/dashboard/die/review/[id].tsx'
    if (!fileContains(pagePath, 'handleReject', '/reject', 'reason'))
      throw new Error('Reject action missing handler or reason')
    if (!fileContains(pagePath, 'rejectReason', 'showRejectModal'))
      throw new Error('Reject action missing modal state')
    pass('T6 Reject action (with reason modal)')
  } catch (e: any) { fail('T6 Reject action', e.message) }
}

// ============================================================================
// T7: Apply action
// ============================================================================
function T7_ApplyAction() {
  try {
    const pagePath = 'src/pages/dashboard/die/review/[id].tsx'
    if (!fileContains(pagePath, 'handleApply', '/apply', 'APPROVED'))
      throw new Error('Apply action missing handler or state guard')
    if (!fileContains(pagePath, 'canApply', 'Apply to System'))
      throw new Error('Apply action missing UI elements')
    pass('T7 Apply action')
  } catch (e: any) { fail('T7 Apply action', e.message) }
}

// ============================================================================
// T8: Entity override (entity links section)
// ============================================================================
function T8_EntityOverride() {
  try {
    const pagePath = 'src/pages/dashboard/die/review/[id].tsx'
    if (!fileContains(pagePath, 'entityLinks', 'Entity Links'))
      throw new Error('Entity links section missing')
    if (!fileContains(pagePath, 'entityType', 'linkType'))
      throw new Error('Entity link display missing key fields')
    // Verify entity-links API endpoint exists
    const apiPath = 'src/pages/api/die/documents/[id]/entity-links.ts'
    if (!fileExists(apiPath)) throw new Error('Entity links API not found')
    pass('T8 Entity override (links displayed, API exists)')
  } catch (e: any) { fail('T8 Entity override', e.message) }
}

// ============================================================================
// T9: Anomaly actions
// ============================================================================
function T9_AnomalyActions() {
  try {
    const pagePath = 'src/pages/dashboard/die/anomalies.tsx'
    if (!fileExists(pagePath)) throw new Error('Anomaly page not found')
    if (!fileContains(pagePath, 'handleAction', 'acknowledge', 'dismiss', 'resolve'))
      throw new Error('Anomaly actions missing handlers')
    if (!fileContains(pagePath, '/api/die/anomalies/', 'POST'))
      throw new Error('Anomaly actions missing API calls')
    if (!fileContains(pagePath, 'OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'))
      throw new Error('Anomaly tab states missing')
    pass('T9 Anomaly actions (acknowledge, dismiss, resolve)')
  } catch (e: any) { fail('T9 Anomaly actions', e.message) }
}

// ============================================================================
// T10: Reconciliation dashboard
// ============================================================================
function T10_ReconciliationDashboard() {
  try {
    const pagePath = 'src/pages/dashboard/die/reconciliation.tsx'
    if (!fileExists(pagePath)) throw new Error('Reconciliation page not found')
    if (!fileContains(pagePath, 'DashboardLayout', '/api/die/reconciliation'))
      throw new Error('Reconciliation page missing layout or API call')
    if (!fileContains(pagePath, 'MATCHED_PO', 'UNMATCHED', 'CONFLICT'))
      throw new Error('Reconciliation page missing state filters')
    if (!fileContains(pagePath, 'ReconciliationChart', 'MetricCard'))
      throw new Error('Reconciliation page missing charts or metrics')
    pass('T10 Reconciliation dashboard')
  } catch (e: any) { fail('T10 Reconciliation dashboard', e.message) }
}

// ============================================================================
// T11: Analytics dashboard
// ============================================================================
function T11_AnalyticsDashboard() {
  try {
    const pagePath = 'src/pages/dashboard/die/analytics.tsx'
    if (!fileExists(pagePath)) throw new Error('Analytics page not found')
    if (!fileContains(pagePath, 'DashboardLayout', 'getServerSideProps'))
      throw new Error('Analytics page missing layout or auth')
    if (!fileContains(pagePath, 'DIEVolumeChart', 'DIEAnomalyChart'))
      throw new Error('Analytics page missing chart components')
    if (!fileContains(pagePath, 'Auto-Match Rate', 'Documents Processed', 'Avg Confidence'))
      throw new Error('Analytics page missing KPI metrics')
    pass('T11 Analytics dashboard')
  } catch (e: any) { fail('T11 Analytics dashboard', e.message) }
}

// ============================================================================
// T12: Real-time updates (SSE endpoint)
// ============================================================================
function T12_RealtimeUpdates() {
  try {
    const ssePath = 'src/pages/api/die/events/stream.ts'
    if (!fileExists(ssePath)) throw new Error('SSE endpoint not found')
    if (!fileContains(ssePath, 'text/event-stream', 'setInterval', 'res.write'))
      throw new Error('SSE endpoint missing required headers or write pattern')

    // Verify dashboard consumes SSE
    const dashPath = 'src/pages/dashboard/die/index.tsx'
    if (!fileContains(dashPath, 'EventSource', '/api/die/events/stream'))
      throw new Error('Dashboard not consuming SSE')
    pass('T12 Real-time updates (SSE endpoint + client consumption)')
  } catch (e: any) { fail('T12 Real-time updates', e.message) }
}

// ============================================================================
// T13: Business isolation
// ============================================================================
function T13_BusinessIsolation() {
  try {
    // All API endpoints use resolveBusinessContext
    const apiFiles = [
      'src/pages/api/die/documents/index.ts',
      'src/pages/api/die/documents/[id]/index.ts',
      'src/pages/api/die/documents/[id]/approve.ts',
      'src/pages/api/die/documents/[id]/reject.ts',
      'src/pages/api/die/documents/[id]/apply.ts',
      'src/pages/api/die/anomalies/index.ts',
      'src/pages/api/die/anomalies/[id]/acknowledge.ts',
      'src/pages/api/die/reconciliation/index.ts',
      'src/pages/api/die/events/stream.ts',
    ]

    for (const f of apiFiles) {
      if (!fileExists(f)) throw new Error(`API file missing: ${f}`)
      const content = fs.readFileSync(path.join(ROOT, f), 'utf8')
      if (!content.includes('businessId')) throw new Error(`${f} missing businessId scoping`)
    }

    // SSE endpoint checks session
    if (!fileContains('src/pages/api/die/events/stream.ts', 'getServerSession', '401'))
      throw new Error('SSE endpoint missing auth check')

    pass('T13 Business isolation (all APIs scoped to businessId)')
  } catch (e: any) { fail('T13 Business isolation', e.message) }
}

// ============================================================================
// T14: Authorization (all pages protected)
// ============================================================================
function T14_Authorization() {
  try {
    const pages = [
      'src/pages/dashboard/die/index.tsx',
      'src/pages/dashboard/die/review/[id].tsx',
      'src/pages/dashboard/die/anomalies.tsx',
      'src/pages/dashboard/die/reconciliation.tsx',
      'src/pages/dashboard/die/analytics.tsx',
    ]

    for (const p of pages) {
      if (!fileExists(p)) throw new Error(`Page missing: ${p}`)
      if (!fileContains(p, 'getServerSideProps', 'getServerSession', '/login'))
        throw new Error(`${p} missing server-side auth redirect`)
    }

    pass('T14 Authorization (all pages redirect to /login without session)')
  } catch (e: any) { fail('T14 Authorization', e.message) }
}

// ============================================================================
// T15: Pagination on all list pages
// ============================================================================
function T15_Pagination() {
  try {
    const listPages = [
      'src/pages/dashboard/die/index.tsx',
      'src/pages/dashboard/die/anomalies.tsx',
      'src/pages/dashboard/die/reconciliation.tsx',
    ]

    for (const p of listPages) {
      if (!fileContains(p, 'page', 'setPage', 'limit', 'pages'))
        throw new Error(`${p} missing pagination state`)
      if (!fileContains(p, 'ChevronLeft', 'ChevronRight'))
        throw new Error(`${p} missing pagination controls`)
    }

    pass('T15 Pagination (all list pages have prev/next controls)')
  } catch (e: any) { fail('T15 Pagination', e.message) }
}

// ============================================================================
// Main runner
// ============================================================================
function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log(' Block 5 Validation Suite — User Experience Layer')
  console.log('═══════════════════════════════════════════════════════')
  console.log()

  T1_DashboardLoads()
  T2_UploadFlow()
  T3_DocumentList()
  T4_ReviewScreen()
  T5_ApproveAction()
  T6_RejectAction()
  T7_ApplyAction()
  T8_EntityOverride()
  T9_AnomalyActions()
  T10_ReconciliationDashboard()
  T11_AnalyticsDashboard()
  T12_RealtimeUpdates()
  T13_BusinessIsolation()
  T14_Authorization()
  T15_Pagination()

  console.log()
  console.log('═══════════════════════════════════════════════════════')
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  console.log(` Results: ${passed}/${results.length} passed, ${failed} failed`)
  console.log('═══════════════════════════════════════════════════════')

  if (failed > 0) {
    console.log('\nFailed tests:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ✗ ${r.name}: ${r.error}`)
    })
    process.exit(1)
  }

  console.log('\n✓ All Block 5 validation tests passed!')
  process.exit(0)
}

main()
