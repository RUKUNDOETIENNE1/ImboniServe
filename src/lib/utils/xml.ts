/**
 * Minimal XML/TwiML escaping for user-derived text interpolated into XML
 * responses (e.g. Twilio TwiML <Message> replies).
 *
 * Escapes the five XML metacharacters so item names, order notes, or other
 * customer-controlled text cannot produce malformed or injected TwiML.
 */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
