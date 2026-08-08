import type { DomainEvent } from '@/lib/die/business-as-plugin/conversion/types'

export type MenuEventType = 'MENU_ITEM_ADDED' | 'MENU_ITEM_UPDATED' | 'MENU_PUBLISHED'

export interface MenuEvent extends DomainEvent {
  domain: 'menu-management'
  type: MenuEventType
  data?: {
    menuItemId?: string
    category?: string
  }
}
