export const TAGLINES = [
  'Unified. Intelligent. Reliable.',
  'Scan. Order. Enjoy.',
  'The future of hospitality starts here.'
] as const

export type TaglineVariant = 'hero' | 'subtitle' | 'cta'

export function getTagline(variant: TaglineVariant = 'hero'): string {
  switch (variant) {
    case 'hero':
      return TAGLINES[2]
    case 'subtitle':
      return TAGLINES[0]
    case 'cta':
      return TAGLINES[1]
    default:
      return TAGLINES[0]
  }
}
