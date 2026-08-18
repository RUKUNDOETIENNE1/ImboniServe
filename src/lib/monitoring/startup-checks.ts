/**
 * Startup Checks
 * Runs at application boot to verify critical configurations
 */

import { AlertDeliveryService } from '@/lib/services/alert-delivery.service'

// Run startup channel guard
if (typeof window === 'undefined') {
  // Server-side only
  AlertDeliveryService.checkChannelsAtStartup()
}
