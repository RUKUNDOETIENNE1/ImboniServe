/**
 * Menu Intelligence™ - Main Dashboard
 */

'use client'

import { useState } from 'react'
import type { MenuDashboard as MenuDashboardType } from '@/lib/menu-intelligence/types'
import { 
  OverviewSection, PerformanceSection, TopPerformingSection, LowestPerformingSection,
  PreparationSection, PopularitySection, CancellationSection, ModificationSection,
  ConsistencySection, CrossSellingSection, TrendsSection, HighlightsSection, IssuesSection,
  EvidencePanel, SearchAndFilters, ExportButton
} from './sections'

interface Props {
  dashboard: MenuDashboardType
}

export function MenuDashboard({ dashboard }: Props) {
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
      <div className="flex items-center justify-between gap-4">
        <SearchAndFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilters}
        />
        <ExportButton reportId={dashboard.metadata.id} />
      </div>

      <OverviewSection overview={dashboard.overviewDisplay} />
      <PerformanceSection performance={dashboard.performanceDisplay} />
      <TopPerformingSection topPerforming={dashboard.topPerformingDisplay} onViewEvidence={handleViewEvidence} />
      <LowestPerformingSection lowestPerforming={dashboard.lowestPerformingDisplay} onViewEvidence={handleViewEvidence} />
      <PreparationSection preparation={dashboard.preparationDisplay} />
      <PopularitySection popularity={dashboard.popularityDisplay} />
      <CancellationSection cancellation={dashboard.cancellationDisplay} />
      <ModificationSection modification={dashboard.modificationDisplay} />
      <ConsistencySection consistency={dashboard.consistencyDisplay} />
      <CrossSellingSection crossSelling={dashboard.crossSellingDisplay} />
      <TrendsSection trends={dashboard.trendsDisplay} />
      <HighlightsSection highlights={dashboard.highlightsDisplay} onViewEvidence={handleViewEvidence} />
      <IssuesSection issues={dashboard.issuesDisplay} onViewEvidence={handleViewEvidence} />

      <EvidencePanel
        open={evidencePanelOpen}
        onClose={() => setEvidencePanelOpen(false)}
        item={selectedItem}
      />
    </div>
  )
}
