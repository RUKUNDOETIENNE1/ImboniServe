export interface ProductKeyDefinition {
  key: string
  label: string
  description?: string
  url?: string
}

export const PRODUCT_KEYS: Record<string, ProductKeyDefinition> = {
  'qr-ordering': {
    key: 'qr-ordering',
    label: 'QR Ordering',
    description: 'Scan-to-order digital menus with real-time kitchen sync',
    url: '/#qr-ordering',
  },
  'tap-and-leave': {
    key: 'tap-and-leave',
    label: 'Tap & Leave',
    description: 'Contactless payment and table turnover',
    url: '/#tap-and-leave',
  },
  'inventory': {
    key: 'inventory',
    label: 'Inventory Management',
    description: 'Real-time stock tracking and supplier integration',
    url: '/#inventory',
  },
  'promise-engine': {
    key: 'promise-engine',
    label: 'Promise Engine',
    description: 'Service-level commitments and delivery time guarantees',
    url: '/#promise-engine',
  },
  'service-replay': {
    key: 'service-replay',
    label: 'Service Replay',
    description: 'Post-service analytics and operational intelligence',
    url: '/#service-replay',
  },
  'reservations': {
    key: 'reservations',
    label: 'Reservations',
    description: 'Table booking and reservation management',
    url: '/#reservations',
  },
  'kitchen-display': {
    key: 'kitchen-display',
    label: 'Kitchen Display System',
    description: 'Real-time order routing and kitchen coordination',
    url: '/#kitchen-display',
  },
  'whatsapp-cloud': {
    key: 'whatsapp-cloud',
    label: 'WhatsApp Cloud API',
    description: 'Customer communication via WhatsApp Business',
    url: '/#whatsapp-cloud',
  },
  'loyalty': {
    key: 'loyalty',
    label: 'Customer Loyalty',
    description: 'Points, rewards, and customer retention',
    url: '/#loyalty',
  },
  'analytics': {
    key: 'analytics',
    label: 'Business Analytics',
    description: 'Sales trends, performance metrics, and insights',
    url: '/#analytics',
  },
  'multi-branch': {
    key: 'multi-branch',
    label: 'Multi-Branch Management',
    description: 'Manage multiple locations from one dashboard',
    url: '/#multi-branch',
  },
  'promotions': {
    key: 'promotions',
    label: 'Promotions & Happy Hours',
    description: 'Time-based discounts and promotional pricing',
    url: '/#promotions',
  },
}

export const PRODUCT_KEY_LIST = Object.values(PRODUCT_KEYS)

export function getProductKey(key: string): ProductKeyDefinition | undefined {
  return PRODUCT_KEYS[key]
}

export function isValidProductKey(key: string): boolean {
  return key in PRODUCT_KEYS
}
