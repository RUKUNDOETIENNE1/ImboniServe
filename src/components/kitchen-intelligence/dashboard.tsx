/**
 * Kitchen Intelligence™ - Main Dashboard
 */

'use client'

import { useState } from 'react'
import type { KitchenDashboard as KitchenDashboardType } from '@/lib/kitchen-intelligence/types'
import { 
  OverviewSection, 
  PerformanceSection, 
  StationsSection,
  QueueSection,
  PreparationSection,
  BottlenecksSection,
  RecoverySection,
  WorkloadSection,
  RecipeSection,
  IngredientSection,
  TrendsSection,
  PeakLoadSection,
  HighlightsSection,
  IssuesSection,
  EvidencePanel,
  SearchAndFilters,
  ExportButton,
} from './sections'

interface Props {
  dashboard: KitchenDashboardType
}

export function KitchenDashboard({ dashboard }: Props) {
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
      {/* Search and Export */}
      <div className="flex items-center justify-between gap-4">
        <SearchAndFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilters}
        />
        <ExportButton reportId={dashboard.metadata.id} />
      </div>

      {/* Overview */}
      <OverviewSection overview={dashboard.overviewDisplay} />

      {/* Performance Score */}
      <PerformanceSection performance={dashboard.performanceDisplay} />

      {/* Station Health */}
      <StationsSection stations={dashboard.stationsDisplay} onViewEvidence={handleViewEvidence} />

      {/* Queue Analysis */}
      <QueueSection queue={dashboard.queueDisplay} />

      {/* Preparation Analysis */}
      <PreparationSection preparation={dashboard.preparationDisplay} />

      {/* Bottlenecks */}
      <BottlenecksSection bottlenecks={dashboard.bottlenecksDisplay} onViewEvidence={handleViewEvidence} />

      {/* Recovery Analysis */}
      <RecoverySection recovery={dashboard.recoveryDisplay} />

      {/* Kitchen Workload */}
      <WorkloadSection workload={dashboard.workloadDisplay} />

      {/* Recipe Performance */}
      <RecipeSection recipe={dashboard.recipeDisplay} />

      {/* Ingredient Consumption */}
      {dashboard.ingredientDisplay.highest.length > 0 && (
        <IngredientSection ingredient={dashboard.ingredientDisplay} />
      )}

      {/* Historical Trends */}
      <TrendsSection trends={dashboard.trendsDisplay} />

      {/* Peak Load Analysis */}
      <PeakLoadSection peakLoad={dashboard.peakLoadDisplay} />

      {/* Kitchen Highlights */}
      <HighlightsSection highlights={dashboard.highlightsDisplay} onViewEvidence={handleViewEvidence} />

      {/* Kitchen Issues */}
      <IssuesSection issues={dashboard.issuesDisplay} onViewEvidence={handleViewEvidence} />

      {/* Evidence Panel */}
      <EvidencePanel
        open={evidencePanelOpen}
        onClose={() => setEvidencePanelOpen(false)}
        item={selectedItem}
      />
    </div>
  )
}
