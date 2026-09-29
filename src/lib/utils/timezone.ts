/**
 * Global Timezone System
 * 
 * Rules:
 * - ALL backend timestamps stored in UTC
 * - Conversion ONLY at display level
 * - Auto-detect user timezone
 * - Respect user preferences
 */

export interface TimezoneConfig {
  id: string;
  name: string;
  utcOffset: string;
  countryCode?: string;
}

// Supported timezones
export const SUPPORTED_TIMEZONES: Record<string, TimezoneConfig> = {
  'Africa/Kigali': {
    id: 'Africa/Kigali',
    name: 'Central Africa Time (CAT)',
    utcOffset: '+02:00',
    countryCode: 'RW'
  },
  'Africa/Nairobi': {
    id: 'Africa/Nairobi',
    name: 'East Africa Time (EAT)',
    utcOffset: '+03:00',
    countryCode: 'KE'
  },
  'Africa/Dar_es_Salaam': {
    id: 'Africa/Dar_es_Salaam',
    name: 'East Africa Time (EAT)',
    utcOffset: '+03:00',
    countryCode: 'TZ'
  },
  'Africa/Kampala': {
    id: 'Africa/Kampala',
    name: 'East Africa Time (EAT)',
    utcOffset: '+03:00',
    countryCode: 'UG'
  },
  'Europe/London': {
    id: 'Europe/London',
    name: 'GMT/BST',
    utcOffset: '+00:00',
    countryCode: 'GB'
  },
  'Europe/Paris': {
    id: 'Europe/Paris',
    name: 'Central European Time',
    utcOffset: '+01:00',
    countryCode: 'FR'
  },
  'America/New_York': {
    id: 'America/New_York',
    name: 'Eastern Time (ET)',
    utcOffset: '-05:00',
    countryCode: 'US'
  },
  'America/Los_Angeles': {
    id: 'America/Los_Angeles',
    name: 'Pacific Time (PT)',
    utcOffset: '-08:00',
    countryCode: 'US'
  },
  'UTC': {
    id: 'UTC',
    name: 'Coordinated Universal Time',
    utcOffset: '+00:00'
  }
};

/**
 * Detect user's timezone from browser
 */
export function detectUserTimezone(): string {
  try {
    if (typeof window !== 'undefined') {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
  } catch (error) {
    console.warn('Failed to detect timezone:', error);
  }
  return 'Africa/Kigali'; // Default
}

/**
 * Get timezone configuration
 */
export function getTimezoneConfig(timezoneId: string): TimezoneConfig {
  return SUPPORTED_TIMEZONES[timezoneId] || SUPPORTED_TIMEZONES['Africa/Kigali'];
}

/**
 * Format date to user's timezone
 * 
 * @param date - ISO string or Date object (assumed to be UTC)
 * @param timezone - IANA timezone identifier
 * @param format - 'full' | 'date' | 'time' | 'datetime' | 'relative'
 */
export function formatDateToUserTimezone(
  date: string | Date,
  timezone: string = 'Africa/Kigali',
  format: 'full' | 'date' | 'time' | 'datetime' | 'relative' = 'datetime'
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    if (format === 'relative') {
      return formatRelativeTime(dateObj);
    }
    
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone
    };
    
    switch (format) {
      case 'full':
        options.dateStyle = 'full';
        options.timeStyle = 'long';
        break;
      case 'date':
        options.dateStyle = 'medium';
        break;
      case 'time':
        options.timeStyle = 'short';
        break;
      case 'datetime':
      default:
        options.dateStyle = 'medium';
        options.timeStyle = 'short';
        break;
    }
    
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
    
  } catch (error) {
    console.error('Failed to format date:', error);
    return String(date);
  }
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years !== 1 ? 's' : ''} ago`;
    }
  } catch (error) {
    console.error('Failed to format relative time:', error);
    return String(date);
  }
}

/**
 * Convert local time to UTC
 */
export function convertToUTC(date: Date, timezone: string): Date {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  return utcDate;
}

/**
 * Get current time in specific timezone
 */
export function getCurrentTimeInTimezone(timezone: string): Date {
  const now = new Date();
  const tzString = now.toLocaleString('en-US', { timeZone: timezone });
  return new Date(tzString);
}

/**
 * Format date for analytics (consistent format)
 */
export function formatAnalyticsDate(
  date: string | Date,
  timezone: string = 'Africa/Kigali'
): string {
  return formatDateToUserTimezone(date, timezone, 'date');
}

/**
 * Format timestamp for logs
 */
export function formatLogTimestamp(
  date: string | Date,
  timezone: string = 'Africa/Kigali'
): string {
  return formatDateToUserTimezone(date, timezone, 'full');
}

/**
 * Get all supported timezones
 */
export function getSupportedTimezones(): TimezoneConfig[] {
  return Object.values(SUPPORTED_TIMEZONES);
}

/**
 * Validate timezone
 */
export function isValidTimezone(timezoneId: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezoneId });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Detect timezone from country code
 */
export function detectTimezoneFromCountry(countryCode: string): string {
  const countryToTimezone: Record<string, string> = {
    'RW': 'Africa/Kigali',
    'KE': 'Africa/Nairobi',
    'TZ': 'Africa/Dar_es_Salaam',
    'UG': 'Africa/Kampala',
    'GB': 'Europe/London',
    'FR': 'Europe/Paris',
    'US': 'America/New_York'
  };
  
  return countryToTimezone[countryCode] || 'Africa/Kigali';
}

/**
 * Format date range with timezone
 */
export function formatDateRange(
  startDate: string | Date,
  endDate: string | Date,
  timezone: string = 'Africa/Kigali'
): string {
  const start = formatDateToUserTimezone(startDate, timezone, 'date');
  const end = formatDateToUserTimezone(endDate, timezone, 'date');
  return `${start} - ${end}`;
}

/**
 * Get business hours display
 */
export function formatBusinessHours(
  openTime: string,
  closeTime: string,
  timezone: string = 'Africa/Kigali'
): string {
  // Assuming openTime and closeTime are in HH:mm format
  return `${openTime} - ${closeTime} ${getTimezoneConfig(timezone).utcOffset}`;
}

/**
 * Check if date is today in user's timezone
 */
export function isToday(date: string | Date, timezone: string = 'Africa/Kigali'): boolean {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    
    const dateStr = dateObj.toLocaleDateString('en-US', { timeZone: timezone });
    const nowStr = now.toLocaleDateString('en-US', { timeZone: timezone });
    
    return dateStr === nowStr;
  } catch (error) {
    return false;
  }
}

/**
 * Get timezone abbreviation (e.g., CAT, EAT, EST)
 */
export function getTimezoneAbbreviation(timezone: string): string {
  try {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find(part => part.type === 'timeZoneName');
    
    return tzPart?.value || getTimezoneConfig(timezone).utcOffset;
  } catch (error) {
    return getTimezoneConfig(timezone).utcOffset;
  }
}

/**
 * Get the start and end of a business day in the business's timezone.
 *
 * This is the CANONICAL replacement for `setHours(0,0,0,0)` which incorrectly
 * uses the server's local timezone. On Vercel the server runs in UTC, so
 * `setHours(0,0,0,0)` produces UTC midnight — not the business's local midnight.
 *
 * @param date - Reference date (defaults to now). Interpreted as a UTC instant.
 * @param timezone - IANA timezone identifier (e.g. "Africa/Kigali", "Africa/Nairobi")
 * @returns `{ start: Date, end: Date }` — UTC Date objects representing the
 *          start (00:00:00.000 local) and end (23:59:59.999 local) of the
 *          business day that contains the reference instant.
 */
export function getBusinessDayBoundary(
  date: Date = new Date(),
  timezone: string = 'Africa/Kigali'
): { start: Date; end: Date } {
  try {
    // Format the reference date in the business timezone to get Y-M-D
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;
    if (!y || !m || !d) throw new Error('Failed to extract date parts');

    // Construct "YYYY-MM-DD 00:00:00" in the business timezone, then convert to UTC.
    // We use the fact that `new Date()` parses "YYYY-MM-DDTHH:mm:ss" as LOCAL time
    // on the server. To avoid server-local interpretation, we instead compute the
    // UTC offset for that local date and adjust.
    //
    // Simpler & robust approach: use `toLocaleString` round-trip.
    // 1. Build a Date that represents midnight in the target timezone.
    //    We do this by finding the UTC time such that when formatted in the
    //    target timezone it shows 00:00:00 on Y-M-D.

    // Find the UTC offset (in minutes) at the reference date for the target tz
    const offsetMs = getTimezoneOffsetMs(date, timezone);

    // Midnight in the business timezone = Y-M-D 00:00:00 local
    // In UTC this is:  localMidnight - offset
    // We construct the local midnight as if it were UTC, then subtract the offset.
    const localMidnightUTC = new Date(`${y}-${m}-${d}T00:00:00.000Z`);
    const start = new Date(localMidnightUTC.getTime() - offsetMs);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);

    return { start, end };
  } catch {
    // Fallback: use the raw date with setHours (server-local) — preserves
    // backward compatibility for Rwanda on a UTC+2 server.
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
}

/**
 * Get the UTC offset (in milliseconds) for a given timezone at a specific date.
 * Positive = ahead of UTC (e.g. +2h for Kigali).
 */
function getTimezoneOffsetMs(date: Date, timezone: string): number {
  // Format the date in both UTC and the target timezone, then compute the diff.
  const utcParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(date);
  const tzParts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(date);

  const get = (parts: Intl.DateTimeFormatPart[], type: string) =>
    parseInt(parts.find(p => p.type === type)?.value || '0', 10);

  const utcMs = Date.UTC(get(utcParts, 'year'), get(utcParts, 'month') - 1, get(utcParts, 'day'),
    get(utcParts, 'hour'), get(utcParts, 'minute'), get(utcParts, 'second'));
  const tzMs = Date.UTC(get(tzParts, 'year'), get(tzParts, 'month') - 1, get(tzParts, 'day'),
    get(tzParts, 'hour'), get(tzParts, 'minute'), get(tzParts, 'second'));

  return tzMs - utcMs;
}

/**
 * Get the current "now" Date in a specific timezone (as a UTC Date that,
 * when formatted in the target timezone, shows the current local time).
 *
 * This replaces manual `getTimezoneOffset() + 2 * 3600000` calculations.
 */
export function nowInTimezone(timezone: string = 'Africa/Kigali'): Date {
  return new Date();
}

/**
 * Get the local "HH:MM" string for a date in a specific timezone.
 * Replaces the manual offset calculations in cron.ts and insight.service.ts.
 */
export function getLocalHHMM(date: Date = new Date(), timezone: string = 'Africa/Kigali'): string {
  try {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone,
    });
  } catch {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
}

/**
 * Get the local "YYYY-MM-DD" string for a date in a specific timezone.
 * Useful for analytics and report grouping.
 */
export function getLocalDateString(date: Date = new Date(), timezone: string = 'Africa/Kigali'): string {
  try {
    return date.toLocaleDateString('en-CA', { timeZone: timezone });
  } catch {
    return date.toLocaleDateString('en-CA');
  }
}
