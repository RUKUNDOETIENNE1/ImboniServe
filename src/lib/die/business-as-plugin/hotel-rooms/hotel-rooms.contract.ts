import type { DomainEvent } from '@/lib/die/business-as-plugin/conversion/types'

export type HotelRoomEventType = 'ROOM_CREATED' | 'ROOM_ASSIGNED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'MAINTENANCE_SCHEDULED'

export interface HotelRoomEvent extends DomainEvent {
  domain: 'hotel-rooms'
  type: HotelRoomEventType
  data?: {
    roomId?: string
    guestName?: string
  }
}
