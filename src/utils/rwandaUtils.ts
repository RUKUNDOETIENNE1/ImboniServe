// Rwanda-specific utilities

export const RWANDA_CITIES = [
  'Kigali',
  'Musanze',
  'Rubavu',
  'Nyagatare',
  'Huye',
  'Muhanga',
  'Rusizi',
  'Karongi',
  'Kayonza',
  'Ngoma'
]

export const RWANDA_DISTRICTS = [
  'Gasabo', 'Kicukiro', 'Nyarugenge',
  'Bugesera', 'Gatsibo', 'Kayonza',
  'Kirehe', 'Ngoma', 'Nyagatare',
  'Rwamagana', 'Burera', 'Gakenke',
  'Gicumbi', 'Musanze', 'Rulindo',
  'Gisagara', 'Huye', 'Kamonyi',
  'Muhanga', 'Nyamagabe', 'Nyanza',
  'Nyaruguru', 'Ruhango', 'Karongi',
  'Ngororero', 'Nyabihu', 'Nyamasheke',
  'Rubavu', 'Rusizi', 'Rutsiro'
]

export const RWANDA_PHONE_PREFIXES = {
  MTN: ['078', '079'],
  AIRTEL: ['073', '072'],
  TIGO: ['075'],
  OTHER: ['076', '077']
}

export function formatRWF(amount: number): string {
  return `RWF ${amount.toLocaleString('en-RW')}`
}

export function formatPhoneNumber(phone: string): string {
  // Clean phone number
  let cleaned = phone.replace(/\D/g, '')
  
  // Add country code if missing
  if (cleaned.startsWith('0')) {
    cleaned = '250' + cleaned.substring(1)
  } else if (!cleaned.startsWith('250')) {
    cleaned = '250' + cleaned
  }
  
  // Format: +250 78X XXX XXX
  if (cleaned.length === 12) { // 250XXXXXXXXX
    return `+${cleaned.substring(0, 3)} ${cleaned.substring(3, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`
  }
  
  return `+${cleaned}`
}

export function detectMobileNetwork(phone: string): 'MTN' | 'AIRTEL' | 'TIGO' | 'OTHER' {
  const cleaned = phone.replace(/\D/g, '')
  const prefix = cleaned.substring(cleaned.length - 9, cleaned.length - 6)
  
  if (prefix.startsWith('78') || prefix.startsWith('79')) return 'MTN'
  if (prefix.startsWith('72') || prefix.startsWith('73')) return 'AIRTEL'
  if (prefix.startsWith('75')) return 'TIGO'
  return 'OTHER'
}

export function generateUSSDCode(network: string, amount: number): string {
  const codes = {
    MTN: `*182*7*1*${amount}#`,
    AIRTEL: `*182*7*2*${amount}#`,
    TIGO: `*150*${amount}#`
  }
  
  return codes[network as keyof typeof codes] || `*182*${amount}#`
}

export function getVATRate(): number {
  // Rwanda VAT rate (can be fetched from API in future)
  return 18 // 18%
}

export function calculateVAT(amount: number): number {
  const vatRate = getVATRate()
  return amount * (vatRate / 100)
}

export function getBusinessHours(): { open: string; close: string } {
  // Default Rwanda restaurant hours
  return {
    open: '08:00',
    close: '22:00'
  }
}

export function isBusinessHour(): boolean {
  const hours = getBusinessHours()
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  
  const [openHour, openMinute] = hours.open.split(':').map(Number)
  const [closeHour, closeMinute] = hours.close.split(':').map(Number)
  
  const currentTime = currentHour * 60 + currentMinute
  const openTime = openHour * 60 + openMinute
  const closeTime = closeHour * 60 + closeMinute
  
  return currentTime >= openTime && currentTime <= closeTime
}

export function getNextMarketDay(): string {
  // In Rwanda, markets have specific days
  const days = ['Monday', 'Wednesday', 'Friday', 'Saturday']
  const today = new Date().getDay()
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  
  for (let i = 1; i <= 7; i++) {
    const nextDay = (today + i) % 7
    if (days.includes(dayNames[nextDay])) {
      return dayNames[nextDay]
    }
  }
  
  return 'Monday'
}