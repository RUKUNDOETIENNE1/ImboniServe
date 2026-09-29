import { buildDomainPlugin } from '@/lib/die/business-as-plugin/conversion/plugin-template'
import { ReservationsPluginAdapter } from './reservations.adapter'

// Reference-only sample plugin object (NOT registered)
export const ReservationsPluginSample = buildDomainPlugin(new ReservationsPluginAdapter())
