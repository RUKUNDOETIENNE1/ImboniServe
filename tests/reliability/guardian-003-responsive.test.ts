/**
 * GUARDIAN-003 — Responsive Design Verification
 *
 * Static analysis of the Guardian dashboard page to verify responsive
 * classes are present across the 320px–1440px breakpoint matrix.
 *
 * Breakpoints verified:
 *   - Mobile  (320px–639px):  base classes (no prefix)
 *   - Tablet  (640px–1023px): sm: classes
 *   - Desktop (1024px+):      lg: classes
 */

import * as fs from 'fs'
import * as path from 'path'

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relPath), 'utf-8')
}

describe('GUARDIAN-003: Responsive Design Verification', () => {
  const src = readFile('src/pages/dashboard/operations/guardian.tsx')

  describe('Container & Layout', () => {
    it('uses responsive horizontal padding (px-4 sm:px-6 lg:px-8)', () => {
      expect(src).toContain('px-4 sm:px-6 lg:px-8')
    })

    it('uses max-width container (max-w-7xl)', () => {
      expect(src).toContain('max-w-7xl')
    })

    it('header uses flex-col on mobile, flex-row on sm+', () => {
      expect(src).toContain('flex-col sm:flex-row')
    })
  })

  describe('Metrics Cards Grid', () => {
    it('uses 2 columns on mobile', () => {
      expect(src).toContain('grid-cols-2')
    })

    it('uses 4 columns on md+', () => {
      expect(src).toContain('md:grid-cols-4')
    })

    it('uses 6 columns on lg+', () => {
      expect(src).toContain('lg:grid-cols-6')
    })

    it('uses gap-3 for tight mobile spacing', () => {
      expect(src).toContain('gap-3')
    })

    it('metric card uses responsive padding (p-3 sm:p-4)', () => {
      expect(src).toContain('p-3 sm:p-4')
    })

    it('metric value uses responsive text size (text-xl sm:text-2xl)', () => {
      expect(src).toContain('text-xl sm:text-2xl')
    })
  })

  describe('Case List', () => {
    it('uses divide-y for case separation', () => {
      expect(src).toContain('divide-y')
    })

    it('case items use hover state', () => {
      expect(src).toContain('hover:bg-slate-50')
    })

    it('case content uses flex-wrap for badge wrapping', () => {
      expect(src).toContain('flex-wrap')
    })

    it('uses line-clamp-1 for long text truncation', () => {
      expect(src).toContain('line-clamp-1')
    })
  })

  describe('Case Detail Modal', () => {
    it('modal uses responsive positioning (items-end sm:items-center)', () => {
      expect(src).toContain('items-end sm:items-center')
    })

    it('modal uses responsive border radius (rounded-t-2xl sm:rounded-2xl)', () => {
      expect(src).toContain('rounded-t-2xl sm:rounded-2xl')
    })

    it('modal has max-height with scroll (max-h-[90vh] overflow-y-auto)', () => {
      expect(src).toContain('max-h-[90vh]')
      expect(src).toContain('overflow-y-auto')
    })

    it('modal header is sticky', () => {
      expect(src).toContain('sticky top-0')
    })

    it('detail grid uses 2 columns', () => {
      expect(src).toContain('grid-cols-2')
    })
  })

  describe('Mode Badge', () => {
    it('mode badge uses inline icon', () => {
      expect(src).toContain('inline mr-1')
    })

    it('has ASSIST mode styling (green)', () => {
      expect(src).toContain('bg-green-100 text-green-700')
    })

    it('has SHADOW mode styling (amber)', () => {
      expect(src).toContain('bg-amber-100 text-amber-700')
    })

    it('has OFF mode styling (gray)', () => {
      expect(src).toContain('bg-gray-100 text-gray-500')
    })
  })

  describe('Loading & Empty States', () => {
    it('has loading spinner state', () => {
      expect(src).toContain('animate-spin')
    })

    it('has empty state with icon and message', () => {
      expect(src).toContain('All clear')
      expect(src).toContain('No active Guardian cases')
    })
  })

  describe('Refresh Button', () => {
    it('refresh button has disabled state during refresh', () => {
      expect(src).toContain('disabled={refreshing}')
    })

    it('refresh icon animates during refresh', () => {
      expect(src).toContain('animate-spin')
    })
  })

  describe('No Horizontal Overflow', () => {
    it('does NOT use fixed widths that could overflow on mobile', () => {
      expect(src).not.toContain('w-[800px]')
      expect(src).not.toContain('w-[600px]')
      expect(src).not.toContain('min-w-[500px]')
    })

    it('uses min-w-0 for flex truncation', () => {
      expect(src).toContain('min-w-0')
    })
  })
})
