/**
 * DateTimeDisplay Component
 * 
 * Centralized component for displaying dates and times
 * Automatically converts UTC timestamps to user's timezone
 */

import React from 'react';
import { useTimezone } from '@/contexts/LocaleContext';
import {
  formatDateToUserTimezone,
  formatRelativeTime,
  formatAnalyticsDate,
  formatLogTimestamp
} from '@/lib/utils/timezone';

interface DateTimeDisplayProps {
  /** UTC timestamp (ISO string or Date object) */
  date: string | Date;
  /** Display format */
  format?: 'full' | 'date' | 'time' | 'datetime' | 'relative' | 'analytics' | 'log';
  /** Timezone override (optional) */
  timezoneOverride?: string;
  /** Additional CSS classes */
  className?: string;
  /** Show timezone abbreviation */
  showTimezone?: boolean;
}

export default function DateTimeDisplay({
  date,
  format = 'datetime',
  timezoneOverride,
  className = '',
  showTimezone = false
}: DateTimeDisplayProps) {
  const { timezone } = useTimezone();
  const targetTimezone = timezoneOverride || timezone;

  let formattedDate: string;

  switch (format) {
    case 'relative':
      formattedDate = formatRelativeTime(date);
      break;
    case 'analytics':
      formattedDate = formatAnalyticsDate(date, targetTimezone);
      break;
    case 'log':
      formattedDate = formatLogTimestamp(date, targetTimezone);
      break;
    default:
      formattedDate = formatDateToUserTimezone(date, targetTimezone, format);
      break;
  }

  if (showTimezone && format !== 'relative') {
    const tzConfig = require('@/lib/utils/timezone').getTimezoneConfig(targetTimezone);
    formattedDate += ` ${tzConfig.utcOffset}`;
  }

  return <span className={className}>{formattedDate}</span>;
}

// Convenience components
export function DateDisplay(props: Omit<DateTimeDisplayProps, 'format'>) {
  return <DateTimeDisplay {...props} format="date" />;
}

export function TimeDisplay(props: Omit<DateTimeDisplayProps, 'format'>) {
  return <DateTimeDisplay {...props} format="time" />;
}

export function RelativeTimeDisplay(props: Omit<DateTimeDisplayProps, 'format'>) {
  return <DateTimeDisplay {...props} format="relative" />;
}

export function FullDateTimeDisplay(props: Omit<DateTimeDisplayProps, 'format'>) {
  return <DateTimeDisplay {...props} format="full" />;
}
