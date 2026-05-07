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
