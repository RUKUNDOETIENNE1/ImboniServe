import { sanitizeSvg, escapeSvgValue } from '@/lib/security/svg-sanitizer'

describe('SVG Sanitizer', () => {
  describe('escapeSvgValue', () => {
    it('escapes XML special characters', () => {
      expect(escapeSvgValue('<script>')).toBe('&lt;script&gt;')
      expect(escapeSvgValue('"quote"')).toBe('&quot;quote&quot;')
      expect(escapeSvgValue("'apostrophe'")).toBe('&#39;apostrophe&#39;')
      expect(escapeSvgValue('&amp')).toBe('&amp;amp')
    })

    it('handles empty strings', () => {
      expect(escapeSvgValue('')).toBe('')
    })

    it('passes through safe content unchanged', () => {
      expect(escapeSvgValue('Hello World')).toBe('Hello World')
      expect(escapeSvgValue('Business Name')).toBe('Business Name')
    })
  })

  describe('sanitizeSvg', () => {
    it('removes <script> tags from SVG', () => {
      const malicious = '<svg><script>alert("xss")</script><rect/></svg>'
      const result = sanitizeSvg(malicious)
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert')
      expect(result).toContain('<rect/>')
    })

    it('removes event handler attributes', () => {
      const malicious = '<svg onload="alert(1)"><rect onclick="alert(2)"/></svg>'
      const result = sanitizeSvg(malicious)
      expect(result).not.toContain('onload')
      expect(result).not.toContain('onclick')
      expect(result).toContain('<rect')
    })

    it('removes javascript: URLs from href', () => {
      const malicious = '<svg><a href="javascript:alert(1)">link</a></svg>'
      const result = sanitizeSvg(malicious)
      expect(result).not.toContain('javascript:')
    })

    it('removes javascript: URLs from xlink:href', () => {
      const malicious = '<svg><use xlink:href="javascript:alert(1)"/></svg>'
      const result = sanitizeSvg(malicious)
      expect(result).not.toContain('javascript:')
    })

    it('removes <foreignObject> elements', () => {
      const malicious = '<svg><foreignObject><div>HTML</div></foreignObject><rect/></svg>'
      const result = sanitizeSvg(malicious)
      expect(result).not.toContain('foreignObject')
      expect(result).not.toContain('<div>')
      expect(result).toContain('<rect/>')
    })

    it('removes <iframe> elements', () => {
      const malicious = '<svg><iframe src="evil.com"></iframe><rect/></svg>'
      const result = sanitizeSvg(malicious)
      expect(result).not.toContain('iframe')
      expect(result).toContain('<rect/>')
    })

    it('removes <embed> elements', () => {
      const malicious = '<svg><embed src="evil.com"/><rect/></svg>'
      const result = sanitizeSvg(malicious)
      expect(result).not.toContain('embed')
      expect(result).toContain('<rect/>')
    })

    it('removes <object> elements', () => {
      const malicious = '<svg><object data="evil.com"></object><rect/></svg>'
      const result = sanitizeSvg(malicious)
      expect(result).not.toContain('object')
      expect(result).toContain('<rect/>')
    })

    it('removes data:text/html URLs from href', () => {
      const malicious = '<svg><a href="data:text/html,<script>alert(1)</script>">link</a></svg>'
      const result = sanitizeSvg(malicious)
      expect(result).not.toContain('data:text/html')
    })

    it('preserves safe SVG content', () => {
      const safe = '<svg><rect x="10" y="10" width="100" height="100" fill="red"/></svg>'
      const result = sanitizeSvg(safe)
      expect(result).toBe(safe)
    })

    it('preserves image tags with safe href', () => {
      const safe = '<svg><image href="https://example.com/logo.png" x="0" y="0" width="100" height="100"/></svg>'
      const result = sanitizeSvg(safe)
      expect(result).toContain('image')
      expect(result).toContain('https://example.com/logo.png')
    })

    it('handles empty input', () => {
      expect(sanitizeSvg('')).toBe('')
      expect(sanitizeSvg(null as any)).toBe('')
      expect(sanitizeSvg(undefined as any)).toBe('')
    })

    it('handles multiple script tags', () => {
      const malicious = '<svg><script>alert(1)</script><rect/><script>alert(2)</script></svg>'
      const result = sanitizeSvg(malicious)
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert')
      expect(result).toContain('<rect/>')
    })

    it('handles case-insensitive script tags', () => {
      const malicious = '<svg><SCRIPT>alert(1)</SCRIPT><rect/></svg>'
      const result = sanitizeSvg(malicious)
      expect(result.toLowerCase()).not.toContain('<script>')
      expect(result).toContain('<rect/>')
    })

    it('handles event handlers with single quotes', () => {
      const malicious = "<svg onload='alert(1)'><rect/></svg>"
      const result = sanitizeSvg(malicious)
      expect(result).not.toContain('onload')
      expect(result).toContain('<rect/>')
    })
  })
})
