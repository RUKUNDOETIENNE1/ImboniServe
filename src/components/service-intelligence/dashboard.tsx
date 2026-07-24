'use client'

/**
 * Service Intelligence™ - Main Dashboard Component
 */

import { useState } from 'react'
import { ExecutiveSummary } from './executive-summary'
import { OverallScore } from './overall-score'
import { KeyMetrics } from './key-metrics'
import { HighlightsSection } from './highlights-section'
import { IssuesSection } from './issues-section'
import { RecommendationsSection } from './recommendations-section'
import { EvidencePanel } from './evidence-panel'
import { 
  HistoricalContext,
  Timeline,
  StaffInsights,
  KitchenInsights,
  CustomerJourney,
  PatternsSection,
  ComparisonsSection,
  DiagnosticsPanel,
  SearchBar,
  ExportButton
} from './simple-components'
import type { ServiceIntelligenceDashboard as DashboardData, EvidencePanel as EvidencePanelData } from '@/lib/service-intelligence/v2'

interface Props {
  dashboard: DashboardData
}

export function ServiceIntelligenceDashboard({ dashboard }: Props) {
  const [evidencePanel, setEvidencePanel] = useState<EvidencePanelData | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleShowEvidence = (evidence: EvidencePanelData) => {
    setEvidencePanel(evidence)
  }

  const handleCloseEvidence = () => {
    setEvidencePanel(null)
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <ExportButton reportId={dashboard.metadata.reportId} />
      </div>

      {/* Executive Summary */}
      <ExecutiveSummary summary={dashboard.executiveSummary} />

      {/* Overall Score */}
      <OverallScore score={dashboard.overallScore} />

      {/* Key Metrics */}
      <KeyMetrics metrics={dashboard.keyMetrics} />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Highlights */}
        <HighlightsSection
          highlights={dashboard.highlights}
          onShowEvidence={handleShowEvidence}
        />

        {/* Issues */}
        <IssuesSection
          issues={dashboard.issues}
          onShowEvidence={handleShowEvidence}
        />
      </div>

      {/* Recommendations */}
      <RecommendationsSection
        recommendations={dashboard.recommendations}
        onShowEvidence={handleShowEvidence}
      />

      {/* Historical Context */}
      {dashboard.historicalContext && (
        <HistoricalContext context={dashboard.historicalContext} />
      )}

      {/* Timeline */}
      <Timeline events={dashboard.timeline} />

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff Insights */}
        {dashboard.staffInsights && (
          <StaffInsights insights={dashboard.staffInsights} />
        )}

        {/* Kitchen Insights */}
        {dashboard.kitchenInsights && (
          <KitchenInsights insights={dashboard.kitchenInsights} />
        )}

        {/* Customer Journey */}
        {dashboard.customerJourney && (
          <CustomerJourney journey={dashboard.customerJourney} />
        )}
      </div>

      {/* Patterns */}
      <PatternsSection
        patterns={dashboard.patterns}
        onShowEvidence={handleShowEvidence}
      />

      {/* Comparisons */}
      {dashboard.comparisons && (
        <ComparisonsSection comparison={dashboard.comparisons} />
      )}

      {/* Diagnostics */}
      <DiagnosticsPanel diagnostics={dashboard.diagnostics} />

      {/* Evidence Panel Modal */}
      {evidencePanel && (
        <EvidencePanel
          evidence={evidencePanel}
          onClose={handleCloseEvidence}
        />
      )}
    </div>
  )
}
