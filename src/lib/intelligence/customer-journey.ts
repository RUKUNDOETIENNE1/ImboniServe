/**
 * Hospitality Intelligence Engine (HIE) - Customer Journey Analysis Module
 * 
 * Analyzes the customer experience journey from arrival to completion.
 */

import type {
  CustomerJourneyAnalysis,
  JourneyStage,
  JourneyBottleneck,
  OperationalEvent,
  EvidenceRef,
} from './types'
import { EvidenceBuilder } from './evidence'

// ─────────────────────────────────────────────────────────────────────────────
// Customer Journey Analyzer
// ─────────────────────────────────────────────────────────────────────────────

export class CustomerJourneyAnalyzer {
  private stageDefinitions: StageDefinition[] = [
    { id: 'arrival', name: 'Arrival', startTypes: ['order_created', 'reservation_seated'], endTypes: ['order_created'] },
    { id: 'ordering', name: 'Ordering', startTypes: ['order_created'], endTypes: ['order_confirmed', 'kitchen_started'] },
    { id: 'preparation', name: 'Preparation', startTypes: ['kitchen_started', 'preparing'], endTypes: ['ready', 'completed'] },
    { id: 'serving', name: 'Serving', startTypes: ['ready'], endTypes: ['delivered', 'served'] },
    { id: 'payment', name: 'Payment', startTypes: ['payment_started'], endTypes: ['payment_completed'] },
    { id: 'completion', name: 'Completion', startTypes: ['payment_completed'], endTypes: ['session_closed'] },
  ]

  async analyze(events: OperationalEvent[]): Promise<CustomerJourneyAnalysis> {
    const journeyData = this.aggregateJourneyData(events)
    const stages = this.calculateStages(journeyData)
    const bottlenecks = this.identifyBottlenecks(journeyData, stages)
    const avgDuration = this.calculateAverageDuration(journeyData)
    const summary = this.generateSummary(stages, bottlenecks, avgDuration)

    return {
      summary,
      averageJourneyDurationMinutes: avgDuration,
      stages,
      bottlenecks,
    }
  }

  private aggregateJourneyData(events: OperationalEvent[]): Map<string, OrderJourney> {
    const journeys = new Map<string, OrderJourney>()

    for (const event of events) {
      if (!event.orderId) continue

      const journey = journeys.get(event.orderId) || {
        orderId: event.orderId,
        orderNumber: event.orderNumber,
        events: [],
        stageTimestamps: new Map(),
      }

      journey.events.push(event)

      for (const stageDef of this.stageDefinitions) {
        if (stageDef.startTypes.some(type => event.type.includes(type))) {
          if (!journey.stageTimestamps.has(`${stageDef.id}_start`)) {
            journey.stageTimestamps.set(`${stageDef.id}_start`, event.timestamp)
          }
        }
        if (stageDef.endTypes.some(type => event.type.includes(type))) {
          journey.stageTimestamps.set(`${stageDef.id}_end`, event.timestamp)
        }
      }

      journeys.set(event.orderId, journey)
    }

    return journeys
  }

  private calculateStages(journeyData: Map<string, OrderJourney>): JourneyStage[] {
    const stageDurations = new Map<string, number[]>()

    for (const journey of journeyData.values()) {
      for (const stageDef of this.stageDefinitions) {
        const start = journey.stageTimestamps.get(`${stageDef.id}_start`)
        const end = journey.stageTimestamps.get(`${stageDef.id}_end`)

        if (start && end) {
          const duration = (new Date(end).getTime() - new Date(start).getTime()) / 1000
          if (duration > 0 && duration < 7200) {
            const durations = stageDurations.get(stageDef.id) || []
            durations.push(duration)
            stageDurations.set(stageDef.id, durations)
          }
        }
      }
    }

    const stages: JourneyStage[] = []
    let totalDuration = 0

    for (const stageDef of this.stageDefinitions) {
      const durations = stageDurations.get(stageDef.id) || []
      if (durations.length === 0) continue

      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
      totalDuration += avgDuration

      const variance = durations.reduce((sum, val) => {
        const mean = avgDuration
        return sum + Math.pow(val - mean, 2)
      }, 0) / durations.length

      stages.push({
        id: stageDef.id,
        name: stageDef.name,
        averageDurationSeconds: avgDuration,
        percentOfTotal: 0,
        variance,
      })
    }

    for (const stage of stages) {
      stage.percentOfTotal = totalDuration > 0 ? (stage.averageDurationSeconds / totalDuration) * 100 : 0
    }

    return stages
  }

  private identifyBottlenecks(journeyData: Map<string, OrderJourney>, stages: JourneyStage[]): JourneyBottleneck[] {
    const bottlenecks: JourneyBottleneck[] = []

    for (const stage of stages) {
      if (stage.percentOfTotal > 40 || stage.variance > 300) {
        const affectedOrders = Array.from(journeyData.values()).filter(journey => {
          const start = journey.stageTimestamps.get(`${stage.id}_start`)
          const end = journey.stageTimestamps.get(`${stage.id}_end`)
          if (!start || !end) return false
          const duration = (new Date(end).getTime() - new Date(start).getTime()) / 1000
          return duration > stage.averageDurationSeconds * 1.5
        })

        if (affectedOrders.length > 0) {
          const builder = new EvidenceBuilder()
          for (const order of affectedOrders) {
            builder.addEvents(order.events.filter(e => 
              this.stageDefinitions.find(sd => sd.id === stage.id)?.startTypes.some(type => e.type.includes(type)) ||
              this.stageDefinitions.find(sd => sd.id === stage.id)?.endTypes.some(type => e.type.includes(type))
            ))
          }

          bottlenecks.push({
            stageId: stage.id,
            stageName: stage.name,
            description: stage.variance > 300
              ? `High variability in ${stage.name.toLowerCase()} times`
              : `${stage.name} takes ${stage.percentOfTotal.toFixed(0)}% of total journey`,
            averageDelaySeconds: stage.averageDurationSeconds,
            affectedOrders: affectedOrders.length,
            evidence: builder.buildRefs(),
          })
        }
      }
    }

    return bottlenecks
  }

  private calculateAverageDuration(journeyData: Map<string, OrderJourney>): number {
    const totalDurations: number[] = []

    for (const journey of journeyData.values()) {
      const firstStage = this.stageDefinitions[0]
      const lastStage = this.stageDefinitions[this.stageDefinitions.length - 1]

      const start = journey.stageTimestamps.get(`${firstStage.id}_start`)
      const end = journey.stageTimestamps.get(`${lastStage.id}_end`)

      if (start && end) {
        const duration = (new Date(end).getTime() - new Date(start).getTime()) / 60000
        if (duration > 0 && duration < 300) totalDurations.push(duration)
      }
    }

    return totalDurations.length > 0
      ? totalDurations.reduce((a, b) => a + b, 0) / totalDurations.length
      : 0
  }

  private generateSummary(stages: JourneyStage[], bottlenecks: JourneyBottleneck[], avgDuration: number): string {
    const parts: string[] = []

    parts.push(`Average journey: ${avgDuration.toFixed(1)} minutes`)

    const slowestStage = stages.reduce((max, curr) => 
      curr.percentOfTotal > max.percentOfTotal ? curr : max
    , stages[0])

    if (slowestStage) {
      parts.push(`${slowestStage.name} is ${slowestStage.percentOfTotal.toFixed(0)}% of journey`)
    }

    if (bottlenecks.length > 0) {
      parts.push(`${bottlenecks.length} bottleneck(s) detected`)
    } else {
      parts.push('No significant bottlenecks')
    }

    return parts.join('. ')
  }
}

interface OrderJourney {
  orderId: string
  orderNumber?: string
  events: OperationalEvent[]
  stageTimestamps: Map<string, string>
}

interface StageDefinition {
  id: string
  name: string
  startTypes: string[]
  endTypes: string[]
}
