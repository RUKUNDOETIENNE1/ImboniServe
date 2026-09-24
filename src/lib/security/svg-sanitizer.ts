/**
 * SVG Sanitization Utility
 *
 * Removes potentially dangerous content from SVG strings before rendering
 * with dangerouslySetInnerHTML. This prevents XSS attacks via:
 * - <script> tags inside SVG
 * - Event handler attributes (onload, onclick, onerror, etc.)
 * - javascript: URLs in href/xlink:href attributes
 * - ForeignObject elements that can embed arbitrary HTML
 *
 * This is a lightweight, dependency-free sanitizer focused on SVG security.
 */

/**
 * Escape XML special characters in a value that will be inserted into
 * SVG XML content or attribute values.
 */
export function escapeSvgValue(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Sanitize an SVG string by removing dangerous elements and attributes.
 *
 * This function:
 * 1. Removes <script> tags and their content
 * 2. Removes event handler attributes (on*)
 * 3. Removes javascript: URLs from href and xlink:href
 * 4. Removes <foreignObject> elements (can embed arbitrary HTML)
 * 5. Removes <iframe> elements
 * 6. Removes <embed> and <object> elements
 *
 * @param svg The raw SVG string to sanitize
 * @returns A sanitized SVG string safe for dangerouslySetInnerHTML
 */
export function sanitizeSvg(svg: string): string {
  if (!svg || typeof svg !== 'string') return ''

  let result = svg

  // Remove <script> tags and their content (case-insensitive, multiline)
  result = result.replace(/<script[\s\S]*?<\/script>/gi, '')

  // Remove <foreignObject> tags and their content (can embed arbitrary HTML)
  result = result.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')

  // Remove <iframe> tags and their content
  result = result.replace(/<iframe[\s\S]*?<\/iframe>/gi, '')

  // Remove <embed> tags (self-closing or with content)
  result = result.replace(/<embed[\s\S]*?\/?>/gi, '')

  // Remove <object> tags and their content
  result = result.replace(/<object[\s\S]*?<\/object>/gi, '')

  // Remove event handler attributes (onload, onclick, onerror, onmouseover, etc.)
  // Matches: onload="...", onclick='...', onerror=..., etc.
  result = result.replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
  result = result.replace(/\son\w+\s*=\s*'[^']*'/gi, '')
  result = result.replace(/\son\w+\s*=\s*[^\s>]+/gi, '')

  // Remove javascript: URLs from href and xlink:href attributes
  result = result.replace(/(href|xlink:href)\s*=\s*["']javascript:[^"']*["']/gi, '')
  result = result.replace(/(href|xlink:href)\s*=\s*javascript:[^\s>]*/gi, '')

  // Remove data: URLs with text/html or text/javascript from href
  result = result.replace(/(href|xlink:href)\s*=\s*["']data:text\/(html|javascript)[^"']*["']/gi, '')

  return result
}
