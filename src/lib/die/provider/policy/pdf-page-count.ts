// ---------------------------------------------------------------------------
// countPdfPages — lightweight PDF page counter without external dependencies.
//
// Scans the PDF buffer for `/Type /Page` markers (excluding `/Type /Pages`).
// This is a well-known heuristic used by many lightweight PDF tools.  It is
// not 100% reliable for every edge case (linearized PDFs, compressed object
// streams) but is sufficient for routing decisions where the threshold has
// slack (e.g., "more than 3 pages → Azure").
//
// Returns undefined if the count cannot be determined, so callers can fall
// back to a conservative default rather than acting on bad data.
// ---------------------------------------------------------------------------
export function countPdfPages(buffer: Buffer): number | undefined {
  try {
    // Match /Type /Page not followed by 's' (to exclude /Type /Pages)
    // Allow optional whitespace and newlines between /Type and /Page.
    const text = buffer.toString('latin1')
    const matches = text.match(/\/Type\s*\/Page(?![s])/g)
    if (!matches || matches.length === 0) return undefined
    return matches.length
  } catch {
    return undefined
  }
}
