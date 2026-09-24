/**
 * Daily Briefings™ - Main Dashboard Component
 */

'use client'

import { useState } from 'react'
import type { DailyBriefingDashboard } from '@/lib/daily-briefings/types'
import { BriefingHeader } from './header'
import { TodaySnapshotSection, YesterdayComparisonSection, HighlightsSection, AttentionSection } from './core-sections'
import { HistoricalChangesSection, PerformanceTrendsSection, StaffSummarySection, KitchenSummarySection, MenuSummarySection, ReplayMomentsSection } from './additional-sections'
import { EvidencePanel, SearchAndFilters, ExportButton } from './utility-components'

interface Props {
  dashboard: DailyBriefingDashboard
}

export function DailyBriefingsDashboard({ dashboard }: Props) {
  const [evidencePanelOpen, setEvidencePanelOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<any>({})

  const handleViewEvidence = (item: any) => {
    setSelectedItem(item)
    setEvidencePanelOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <BriefingHeader header={dashboard.headerDisplay} />

      {/* Search and Export */}
      <div className="flex items-center justify-between gap-4">
        <SearchAndFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilters}
        />
        <ExportButton briefingId={dashboard.metadata.id} />
      </div>

      {/* Today's Snapshot */}
      <TodaySnapshotSection snapshot={dashboard.snapshotDisplay} />

      {/* Yesterday Compared */}
      {dashboard.comparisonDisplay && (
        <YesterdayComparisonSection comparison={dashboard.comparisonDisplay} />
      )}

      {/* Operational Highlights */}
      <HighlightsSection
        highlights={dashboard.highlightsDisplay}
        onViewEvidence={handleViewEvidence}
      />

      {/* Things That Need Attention */}
      <AttentionSection
        attention={dashboard.attentionDisplay}
        onViewEvidence={handleViewEvidence}
      />

      {/* Historical Changes */}
      {dashboard.historicalDisplay.length > 0 && (
        <HistoricalChangesSection historical={dashboard.historicalDisplay} />
      )}

      {/* Performance Trends */}
      <PerformanceTrendsSection trends={dashboard.trendsDisplay} />

      {/* Staff Summary */}
      <StaffSummarySection
        staff={dashboard.staffDisplay}
        onViewEvidence={handleViewEvidence}
      />

      {/* Kitchen Summary */}
      <KitchenSummarySection
        kitchen={dashboard.kitchenDisplay}
        onViewEvidence={handleViewEvidence}
      />

      {/* Menu Summary */}
      <MenuSummarySection
        menu={dashboard.menuDisplay}
        onViewEvidence={handleViewEvidence}
      />

      {/* Replay Moments */}
      <ReplayMomentsSection moments={dashboard.momentsDisplay} />

      {/* Evidence Panel */}
      <EvidencePanel
        open={evidencePanelOpen}
        onClose={() => setEvidencePanelOpen(false)}
        item={selectedItem}
      />
    </div>
  )
}
