import * as fs from 'fs'
import * as path from 'path'

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relPath), 'utf-8')
}

describe('Responsive Design Regression', () => {
  describe('AdminLayout', () => {
    const src = readFile('src/components/AdminLayout.tsx')

    it('header uses responsive padding (px-4 sm:px-6)', () => {
      expect(src).toContain('px-4 sm:px-6 py-4')
    })

    it('main content uses responsive padding (p-4 sm:p-6)', () => {
      expect(src).toContain('main className="p-4 sm:p-6"')
    })

    it('desktop sidebar is hidden on mobile (hidden lg:block)', () => {
      expect(src).toContain('hidden lg:block')
    })

    it('mobile menu toggle is hidden on desktop (lg:hidden)', () => {
      expect(src).toContain('lg:hidden')
    })

    it('content margin is responsive (lg:ml-64 / lg:ml-20)', () => {
      expect(src).toContain('lg:ml-64')
      expect(src).toContain('lg:ml-20')
    })
  })

  describe('Editorial Dashboard (index.tsx)', () => {
    const src = readFile('src/pages/admin/content/index.tsx')

    it('filter buttons use flex-wrap to prevent overflow', () => {
      expect(src).toContain('flex flex-wrap gap-2')
    })

    it('stats grid uses 2-column on mobile, 4-column on lg', () => {
      expect(src).toContain('grid-cols-2 lg:grid-cols-4')
    })

    it('articles table wrapper uses overflow-x-auto for mobile scroll', () => {
      expect(src).toContain('overflow-x-auto')
    })

    it('articles table wrapper does NOT use overflow-hidden', () => {
      const match = src.match(/bg-white rounded-lg shadow-sm (\S+)/)
      expect(match?.[1]).not.toBe('overflow-hidden')
    })
  })

  describe('Tags Page (tags.tsx)', () => {
    const src = readFile('src/pages/admin/content/tags.tsx')

    it('tag creation form uses flex-col on mobile, flex-row on sm+', () => {
      expect(src).toContain('flex-col sm:flex-row')
    })
  })

  describe('Topics Page (topics.tsx)', () => {
    const src = readFile('src/pages/admin/content/topics.tsx')

    it('topic list items use gap-4 to prevent text/button collision', () => {
      expect(src).toContain('gap-4')
    })

    it('topic text container uses min-w-0 for flexbox shrinking', () => {
      expect(src).toContain('min-w-0')
    })

    it('topic list items use responsive padding (px-4 sm:px-6)', () => {
      expect(src).toContain('px-4 sm:px-6')
    })
  })

  describe('ArticleDetail (public)', () => {
    const src = readFile('src/components/content/ArticleDetail.tsx')

    it('breadcrumb uses flex with overflow-hidden for truncation', () => {
      expect(src).toContain('flex items-center gap-2 overflow-hidden')
    })

    it('breadcrumb title span uses truncate and min-w-0', () => {
      expect(src).toContain('truncate min-w-0')
    })

    it('breadcrumb links use shrink-0 to prevent compression', () => {
      expect(src).toContain('shrink-0')
    })

    it('article title uses responsive font size (text-3xl sm:text-4xl)', () => {
      expect(src).toContain('text-3xl sm:text-4xl')
    })

    it('metadata row uses flex-wrap', () => {
      expect(src).toContain('flex flex-wrap items-center gap-4')
    })

    it('related articles grid is responsive (md:grid-cols-3)', () => {
      expect(src).toContain('md:grid-cols-3')
    })

    it('container uses responsive horizontal padding (px-4 sm:px-6 lg:px-8)', () => {
      expect(src).toContain('px-4 sm:px-6 lg:px-8')
    })
  })

  describe('ArticleListing (public)', () => {
    const src = readFile('src/components/content/ArticleListing.tsx')

    it('article cards grid is responsive (1→2→3 columns)', () => {
      expect(src).toContain('md:grid-cols-2 lg:grid-cols-3')
    })

    it('container uses responsive horizontal padding', () => {
      expect(src).toContain('px-4 sm:px-6 lg:px-8')
    })
  })

  describe('PublicLayout', () => {
    const src = readFile('src/components/PublicLayout.tsx')

    it('desktop nav is hidden on mobile (hidden md:flex)', () => {
      expect(src).toContain('hidden md:flex')
    })

    it('mobile menu button is hidden on desktop (md:hidden)', () => {
      expect(src).toContain('md:hidden')
    })

    it('footer uses responsive grid (grid-cols-1 md:grid-cols-2)', () => {
      expect(src).toContain('grid-cols-1 md:grid-cols-2')
    })

    it('signup button uses responsive text sizes', () => {
      expect(src).toMatch(/text-xs.*md:text-xs.*lg:text-sm/)
    })
  })
})
