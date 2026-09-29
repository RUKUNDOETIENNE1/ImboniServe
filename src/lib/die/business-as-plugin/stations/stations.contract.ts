import type { DomainEvent } from '@/lib/die/business-as-plugin/conversion/types'

export type StationEventType = 'STATION_CREATED' | 'ITEM_ROUTED' | 'ROUTE_FAILED'

export interface StationEvent extends DomainEvent {
  domain: 'stations'
  type: StationEventType
  data?: {
    stationId?: string
    itemId?: string
    stationCode?: string
  }
}
