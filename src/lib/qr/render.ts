import QRCode from 'qrcode'

export type RenderTokens = {
  business: {
    name: string
    phone?: string | null
    address?: string | null
    logoUrl?: string | null
  }
  custom: {
    primaryColor?: string
    message?: string
    tableNumber?: string | number
  }
  qr: {
    dataUrl: string
  }
}

export async function generateQrDataUrl(text: string, options?: { color?: string; margin?: number; scale?: number; errorCorrectionLevel?: 'L'|'M'|'Q'|'H' }) {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: options?.errorCorrectionLevel ?? 'M',
    margin: options?.margin ?? 1,
    color: { dark: options?.color ?? '#000000', light: '#00000000' },
    scale: options?.scale ?? 6,
  })
}

function flatten(obj: any, prefix = '', out: Record<string, string> = {}) {
  for (const [k, v] of Object.entries(obj || {})) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object') flatten(v as any, path, out)
    else if (v !== undefined) out[path] = String(v)
  }
  return out
}

export function renderSvg(templateSvg: string, tokens: RenderTokens): string {
  const map = flatten(tokens)
  let svg = templateSvg
  for (const [key, value] of Object.entries(map)) {
    const pattern = new RegExp(`\\{\\{${key.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\}\\}`, 'g')
    svg = svg.replace(pattern, value)
  }
  // Remove any unreplaced tokens gracefully
  svg = svg.replace(/\{\{[^}]+\}\}/g, '')
  return svg
}
