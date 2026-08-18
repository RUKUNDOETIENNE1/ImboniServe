import type { DomainEvent } from '@/lib/die/business-as-plugin/conversion/types'

export type RoomServiceEventType = 'ORDER_PLACED' | 'IN_PROGRESS' | 'DELIVERED' | 'DELAY_ALERT'

export interface RoomServiceEvent extends DomainEvent {
  domain: 'room-service'
  type: RoomServiceEventType
  data?: {
    roomNumber?: string
    orderId?: string
    delayMin?: number
  }
}
