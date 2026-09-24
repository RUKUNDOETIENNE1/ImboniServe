export function renderMarkdown(markdown: string): string {
  if (!markdown) return ''

  let html = markdown

  // Escape HTML entities first to prevent XSS
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

  // Headings (h1-h3)
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Code blocks
  html = html.replace(/```([\s\S]+?)```/g, '<pre><code>$1</code></pre>')

  // Links — only allow http, https, and relative URLs
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (match, text: string, url: string) => {
      const trimmedUrl = url.trim()
      if (
        trimmedUrl.startsWith('http://') ||
        trimmedUrl.startsWith('https://') ||
        trimmedUrl.startsWith('/')
      ) {
        const safeUrl = trimmedUrl.replace(/"/g, '&quot;')
        return `<a href="${safeUrl}" rel="noopener noreferrer">${text}</a>`
      }
      return text
    }
  )

  // Images — only allow http, https, and relative URLs
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (match, alt: string, url: string) => {
      const trimmedUrl = url.trim()
      if (
        trimmedUrl.startsWith('http://') ||
        trimmedUrl.startsWith('https://') ||
        trimmedUrl.startsWith('/')
      ) {
        const safeUrl = trimmedUrl.replace(/"/g, '&quot;')
        const safeAlt = alt.replace(/"/g, '&quot;')
        return `<img src="${safeUrl}" alt="${safeAlt}" loading="lazy" />`
      }
      return ''
    }
  )

  // Blockquotes
  html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>')

  // Unordered lists
  html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g, '<ul>$1</ul>')

  // Ordered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr />')

  // Paragraphs — split by double newlines, wrap non-HTML blocks
  const blocks = html.split(/\n\n+/)
  html = blocks
    .map((block) => {
      const trimmed = block.trim()
      if (!trimmed) return ''
      if (trimmed.startsWith('<')) return trimmed
      return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`
    })
    .join('\n')

  return html
}
