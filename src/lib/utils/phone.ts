/**
 * Global Phone Number Normalization
 *
 * EGR-016: Geography must be configuration, never code.
 *
 * This is the SINGLE CANONICAL phone normalization function for the entire
 * platform. All services and APIs must import from here instead of defining
 * their own `normalizePhone` functions.
 *
 * Normalization strategy:
 * 1. If the number already starts with `+`, it is assumed to be in E.164
 *    format and returned as-is (after stripping whitespace).
 * 2. If the number starts with `0` (local prefix), the default country code
 *    is prepended.
 * 3. If the number starts with a country code without `+`, `+` is prepended.
 * 4. The default country code is derived from `businessCountry` (or
 *    `userCountry`). If neither is provided, it defaults to `RW` (Rwanda)
 *    to preserve backward compatibility for Customer #1.
 */

/** ISO 3166-1 alpha-2 country code → dial code mapping */
const COUNTRY_DIAL_CODES: Record<string, string> = {
  RW: '250',
  KE: '254',
  UG: '256',
  TZ: '255',
  ZA: '27',
  NG: '234',
  GH: '233',
  EG: '20',
  MA: '212',
  GB: '44',
  FR: '33',
  DE: '49',
  IT: '39',
  ES: '34',
  BE: '32',
  NL: '31',
  US: '1',
  CA: '1',
  AE: '971',
  SA: '966',
  QA: '974',
  IN: '91',
  CN: '86',
  JP: '81',
  AU: '61',
  BR: '55',
  MX: '52',
};

/**
 * Get the dial code for a country.
 * @param countryCode - ISO 3166-1 alpha-2 code (e.g. "RW", "KE", "US")
 * @returns dial code without the leading `+` (e.g. "250", "254")
 */
export function getDialCode(countryCode?: string): string {
  if (!countryCode) return '250'; // Default: Rwanda (backward compatibility)
  return COUNTRY_DIAL_CODES[countryCode.toUpperCase()] || '250';
}

/**
 * Normalize a phone number to E.164 format using the business/user country
 * as the default country code.
 *
 * @param phone - Raw phone number (e.g. "0788123456", "+250788123456", "250788123456")
 * @param countryCode - ISO 3166-1 alpha-2 code (e.g. "RW", "KE"). Defaults to "RW".
 * @returns E.164 formatted number (e.g. "+250788123456")
 */
export function normalizePhone(phone: string, countryCode?: string): string {
  if (!phone) return phone;
  const p = phone.trim().replace(/\s+/g, '');
  if (p === '') return p;

  // Already in E.164 format
  if (p.startsWith('+')) return p;

  // Strip non-numeric characters for length-based checks
  const digits = p.replace(/\D/g, '');

  // If it starts with the dial code already (without +), prepend +
  const dialCode = getDialCode(countryCode);
  if (digits.startsWith(dialCode) && digits.length > dialCode.length) {
    return `+${digits}`;
  }

  // Local format: starts with 0 → replace with country dial code
  if (p.startsWith('0')) {
    return `+${dialCode}${p.slice(1).replace(/\D/g, '')}`;
  }

  // If it's all digits and reasonably long, treat as international without +
  if (/^\d{7,}$/.test(digits)) {
    return `+${digits}`;
  }

  // Fallback: prepend + (assume country code is included)
  return `+${p}`;
}

/**
 * Normalize a phone number for Twilio WhatsApp API (no leading +).
 * Twilio WhatsApp expects numbers without the `+` prefix.
 *
 * @param phone - Raw phone number
 * @param countryCode - ISO 3166-1 alpha-2 code
 * @returns E.164 without `+` (e.g. "250788123456")
 */
export function normalizePhoneForWhatsApp(phone: string, countryCode?: string): string {
  const normalized = normalizePhone(phone, countryCode);
  return normalized.startsWith('+') ? normalized.slice(1) : normalized;
}

/**
 * Normalize a phone number for InTouch API (no leading +, no spaces).
 * InTouch expects the raw digits with country code.
 *
 * @param phone - Raw phone number
 * @param countryCode - ISO 3166-1 alpha-2 code
 * @returns digits with country code (e.g. "250788123456")
 */
export function normalizePhoneForProvider(phone: string, countryCode?: string): string {
  const normalized = normalizePhone(phone, countryCode);
  return normalized.replace(/\D/g, '');
}
