import { slugify, ensureUniqueSlug, isUrlSafeSlug, readingTime } from '../../src/lib/content/slug'
import { renderMarkdown } from '../../src/lib/content/markdown'
import { getRouteTypes, getTypePath, ARTICLE_TYPES, ARTICLE_STATUSES } from '../../src/lib/content/constants'
import { isValidProductKey, PRODUCT_KEYS } from '../../src/config/product-keys'

describe('Content Utilities', () => {
  describe('slugify', () => {
    it('converts title to URL-safe slug', () => {
      expect(slugify('Hello World')).toBe('hello-world')
      expect(slugify('How to Grow Your Restaurant')).toBe('how-to-grow-your-restaurant')
    })

    it('handles special characters', () => {
      expect(slugify('Café & Restaurant')).toBe('caf-restaurant')
      expect(slugify('10% Off!')).toBe('10-off')
    })

    it('handles empty string', () => {
      expect(slugify('')).toBe('')
      expect(slugify('   ')).toBe('')
    })

    it('handles unicode', () => {
      expect(slugify('Kigali Rwanda')).toBe('kigali-rwanda')
    })
  })

  describe('ensureUniqueSlug', () => {
    it('returns base slug when no conflicts', () => {
      expect(ensureUniqueSlug('hello-world', [])).toBe('hello-world')
    })

    it('appends number when conflict exists', () => {
      expect(ensureUniqueSlug('hello-world', ['hello-world'])).toBe('hello-world-1')
      expect(ensureUniqueSlug('hello-world', ['hello-world', 'hello-world-1'])).toBe('hello-world-2')
    })
  })

  describe('isUrlSafeSlug', () => {
    it('validates URL-safe slugs', () => {
      expect(isUrlSafeSlug('hello-world')).toBe(true)
      expect(isUrlSafeSlug('hello_world')).toBe(false)
      expect(isUrlSafeSlug('hello-world-123')).toBe(true)
    })

    it('rejects unsafe slugs', () => {
      expect(isUrlSafeSlug('Hello World')).toBe(false)
      expect(isUrlSafeSlug('hello world')).toBe(false)
      expect(isUrlSafeSlug('hello.world')).toBe(false)
      expect(isUrlSafeSlug('')).toBe(false)
    })
  })

  describe('readingTime', () => {
    it('calculates reading time from text', () => {
      const text = 'word '.repeat(200)
      expect(readingTime(text)).toBe(1)
    })

    it('returns at least 1 for short text', () => {
      expect(readingTime('short text')).toBe(1)
    })

    it('handles empty text', () => {
      expect(readingTime('')).toBe(1)
    })
  })

  describe('renderMarkdown', () => {
    it('renders headings', () => {
      expect(renderMarkdown('# Title')).toContain('<h1>Title</h1>')
      expect(renderMarkdown('## Subtitle')).toContain('<h2>Subtitle</h2>')
    })

    it('renders bold and italic', () => {
      expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>')
      expect(renderMarkdown('*italic*')).toContain('<em>italic</em>')
    })

    it('renders links', () => {
      const html = renderMarkdown('[text](https://example.com)')
      expect(html).toContain('<a href="https://example.com"')
      expect(html).toContain('>text</a>')
    })

    it('renders code blocks', () => {
      expect(renderMarkdown('`code`')).toContain('<code>code</code>')
    })

    it('renders unordered lists', () => {
      const md = '- item 1\n- item 2'
      const html = renderMarkdown(md)
      expect(html).toContain('<ul>')
      expect(html).toContain('<li>item 1</li>')
      expect(html).toContain('<li>item 2</li>')
    })

    it('sanitizes script tags', () => {
      expect(renderMarkdown('<script>alert(1)</script>')).not.toContain('<script>')
    })
  })

  describe('getRouteTypes', () => {
    it('maps blog route to Article and Announcement', () => {
      const types = getRouteTypes('blog')
      expect(types).toContain('Article')
      expect(types).toContain('Announcement')
    })

    it('maps stories route to FounderStory, ProductStory, CaseStudy', () => {
      const types = getRouteTypes('stories')
      expect(types).toContain('FounderStory')
      expect(types).toContain('ProductStory')
      expect(types).toContain('CaseStudy')
    })

    it('maps insights route to IndustryInsight', () => {
      expect(getRouteTypes('insights')).toContain('IndustryInsight')
    })

    it('maps guides route to Guide', () => {
      expect(getRouteTypes('guides')).toContain('Guide')
    })
  })

  describe('getTypePath', () => {
    it('maps Article to blog', () => {
      expect(getTypePath('Article')).toBe('blog')
      expect(getTypePath('Announcement')).toBe('blog')
    })

    it('maps FounderStory to stories', () => {
      expect(getTypePath('FounderStory')).toBe('stories')
      expect(getTypePath('CaseStudy')).toBe('stories')
    })

    it('maps IndustryInsight to insights', () => {
      expect(getTypePath('IndustryInsight')).toBe('insights')
    })

    it('maps Guide to guides', () => {
      expect(getTypePath('Guide')).toBe('guides')
    })

    it('defaults to blog for unknown types', () => {
      expect(getTypePath('Unknown')).toBe('blog')
    })
  })

  describe('ARTICLE_TYPES and ARTICLE_STATUSES', () => {
    it('has expected types', () => {
      expect(ARTICLE_TYPES).toContain('Article')
      expect(ARTICLE_TYPES).toContain('Guide')
      expect(ARTICLE_TYPES.length).toBeGreaterThan(5)
    })

    it('has expected statuses', () => {
      expect(ARTICLE_STATUSES).toContain('DRAFT')
      expect(ARTICLE_STATUSES).toContain('PUBLISHED')
      expect(ARTICLE_STATUSES).toContain('ARCHIVED')
    })
  })

  describe('isValidProductKey', () => {
    it('validates known product keys', () => {
      const keys = Object.keys(PRODUCT_KEYS)
      if (keys.length > 0) {
        expect(isValidProductKey(keys[0])).toBe(true)
      }
    })

    it('rejects unknown product keys', () => {
      expect(isValidProductKey('NONEXISTENT_KEY')).toBe(false)
    })
  })
})
