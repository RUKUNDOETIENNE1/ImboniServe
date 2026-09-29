/**
 * CONTENT-003 — Responsive Regression Tests
 *
 * Static analysis tests verifying that P0/P1 responsive defects
 * identified in the forensic audit have been fixed and do not regress.
 *
 * Each test corresponds to a specific defect in the Defect Register.
 */

import * as fs from 'fs'
import * as path from 'path'

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relPath), 'utf-8')
}

describe('CONTENT-003: Responsive Regression Tests', () => {

  // ─── P0-001: DashboardLayout header collision ────────────────────────────
  describe('P0-001: DashboardLayout header collision', () => {
    const src = readFile('src/components/DashboardLayout.tsx')

    it('header uses responsive horizontal padding (px-4 sm:px-6)', () => {
      expect(src).toContain('px-4 sm:px-6')
    })

    it('header uses responsive vertical padding (py-3 sm:py-4)', () => {
      expect(src).toContain('py-3 sm:py-4')
    })

    it('header right side uses responsive gap (gap-1 sm:gap-2)', () => {
      expect(src).toContain('gap-1 sm:gap-2')
    })

    it('LiveClock is hidden on mobile (hidden sm:block)', () => {
      expect(src).toContain('hidden sm:block')
    })

    it('header left side has min-w-0 to prevent overflow', () => {
      expect(src).toContain('min-w-0')
    })

    it('header right side has flex-shrink-0 to prevent compression collision', () => {
      expect(src).toContain('flex-shrink-0')
    })

    it('mobile menu button has flex-shrink-0', () => {
      expect(src).toContain('flex-shrink-0')
    })

    it('main content uses responsive padding (p-4 sm:p-6)', () => {
      expect(src).toContain('p-4 sm:p-6')
    })

    it('does NOT use bare px-6 without responsive variant in header', () => {
      // The old code had "px-6 py-4" — now should be "px-4 sm:px-6 py-3 sm:py-4"
      const headerMatch = src.match(/<header[^>]*>[\s\S]*?<\/header>/)
      expect(headerMatch).toBeTruthy()
      expect(headerMatch![0]).not.toMatch(/className="px-6 py-4"/)
    })
  })

  // ─── P0-002: Dashboard page header actions collision ─────────────────────
  describe('P0-002: Dashboard page header actions collision', () => {
    const src = readFile('src/pages/dashboard/index.tsx')

    it('header uses flex-wrap to prevent collision', () => {
      expect(src).toContain('flex-wrap')
    })

    it('header uses responsive gap (gap-2 sm:gap-3)', () => {
      expect(src).toContain('gap-2 sm:gap-3')
    })

    it('title section has min-w-0', () => {
      expect(src).toContain('min-w-0')
    })

    it('actions section has flex-shrink-0', () => {
      expect(src).toContain('flex-shrink-0')
    })

    it('title uses responsive text size (text-xl sm:text-2xl)', () => {
      expect(src).toContain('text-xl sm:text-2xl')
    })
  })

  // ─── P1-001: Dashboard card paddings not responsive ──────────────────────
  describe('P1-001: Dashboard card paddings not responsive', () => {
    const src = readFile('src/pages/dashboard/index.tsx')

    it('daily sales card uses responsive padding (p-4 sm:p-6)', () => {
      expect(src).toContain('p-4 sm:p-6')
    })

    it('grid gap is responsive (gap-4 sm:gap-6)', () => {
      expect(src).toContain('gap-4 sm:gap-6')
    })

    it('daily sales heading uses responsive text size (text-2xl sm:text-4xl)', () => {
      expect(src).toContain('text-2xl sm:text-4xl')
    })

    it('does NOT use bare p-6 without responsive variant on cards', () => {
      // Should not find "p-6" that isn't preceded by "sm:" on card divs
      // Match p-6 not preceded by sm: or other breakpoint prefix
      const cardPattern = /rounded-2xl[^"]*(?<![a-z]+:)p-6(?:\s|")/
      expect(cardPattern.test(src)).toBe(false)
    })
  })

  // ─── P1-002: Dashboard table grid too tight on mobile ────────────────────
  describe('P1-002: Dashboard table grid too tight on mobile', () => {
    const src = readFile('src/pages/dashboard/index.tsx')

    it('table grid uses grid-cols-3 on mobile', () => {
      expect(src).toContain('grid-cols-3')
    })

    it('table grid uses sm:grid-cols-4 for larger screens', () => {
      expect(src).toContain('sm:grid-cols-4')
    })

    it('table legend uses flex-wrap', () => {
      expect(src).toContain('flex-wrap')
    })

    it('table legend uses responsive gap (gap-2 sm:gap-4)', () => {
      expect(src).toContain('gap-2 sm:gap-4')
    })

    it('empty state uses col-span-3 sm:col-span-4', () => {
      expect(src).toContain('col-span-3 sm:col-span-4')
    })
  })

  // ─── P1-003: LanguageSwitcher fixed min-width ────────────────────────────
  describe('P1-003: LanguageSwitcher fixed min-width', () => {
    const src = readFile('src/components/LanguageSwitcher.tsx')

    it('does NOT use min-w-[100px]', () => {
      expect(src).not.toContain('min-w-[100px]')
    })

    it('uses responsive padding (px-2 sm:px-4)', () => {
      expect(src).toContain('px-2 sm:px-4')
    })

    it('uses responsive gap (gap-1.5 sm:gap-2)', () => {
      expect(src).toContain('gap-1.5 sm:gap-2')
    })
  })

  // ─── P1-004: Tables with overflow-hidden instead of overflow-x-auto ──────
  describe('P1-004: Tables with overflow-hidden instead of overflow-x-auto', () => {
    it('store/payments.tsx uses overflow-x-auto for table wrapper', () => {
      const src = readFile('src/pages/store/payments.tsx')
      expect(src).toContain('overflow-x-auto')
      expect(src).not.toContain('overflow-hidden')
    })

    it('smart-dining-slips.tsx uses overflow-x-auto for table wrapper', () => {
      const src = readFile('src/pages/dashboard/smart-dining-slips.tsx')
      expect(src).toContain('overflow-x-auto')
      // overflow-hidden may still appear elsewhere in the file, but the table wrapper should use overflow-x-auto
      const tableWrapperMatch = src.match(/bg-white[^"]*overflow[^"]*"[^>]*>\s*<table/)
      expect(tableWrapperMatch).toBeTruthy()
      expect(tableWrapperMatch![0]).toContain('overflow-x-auto')
    })
  })

  // ─── P1-005: Missing no-scrollbar utility ────────────────────────────────
  describe('P1-005: Missing no-scrollbar utility', () => {
    const src = readFile('src/styles/globals.css')

    it('defines no-scrollbar class', () => {
      expect(src).toContain('.no-scrollbar')
    })

    it('hides scrollbar in webkit browsers', () => {
      expect(src).toContain('::-webkit-scrollbar')
    })

    it('hides scrollbar in Firefox (scrollbar-width: none)', () => {
      expect(src).toContain('scrollbar-width: none')
    })

    it('hides scrollbar in IE/Edge (-ms-overflow-style: none)', () => {
      expect(src).toContain('-ms-overflow-style: none')
    })
  })

  // ─── Guardian UI responsive verification ─────────────────────────────────
  describe('Guardian UI responsive (re-verify)', () => {
    const src = readFile('src/pages/dashboard/operations/guardian.tsx')

    it('uses responsive container padding (px-4 sm:px-6 lg:px-8)', () => {
      expect(src).toContain('px-4 sm:px-6 lg:px-8')
    })

    it('uses responsive header (flex-col sm:flex-row)', () => {
      expect(src).toContain('flex-col sm:flex-row')
    })

    it('modal uses responsive positioning (items-end sm:items-center)', () => {
      expect(src).toContain('items-end sm:items-center')
    })

    it('does NOT use fixed widths that overflow on mobile', () => {
      expect(src).not.toContain('w-[800px]')
      expect(src).not.toContain('w-[600px]')
      expect(src).not.toContain('min-w-[500px]')
    })
  })

  // ─── Public layout responsive verification ───────────────────────────────
  describe('Public layout responsive', () => {
    const src = readFile('src/components/PublicLayout.tsx')

    it('nav links are hidden on mobile (hidden md:flex)', () => {
      expect(src).toContain('hidden md:flex')
    })

    it('signup button uses responsive text size', () => {
      expect(src).toContain('text-xs')
    })

    it('signup button uses shrink-0', () => {
      expect(src).toContain('shrink-0')
    })
  })
})
