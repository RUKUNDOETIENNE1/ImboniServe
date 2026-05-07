export function formatDateTimeRW(
  dateInput: Date | string | number,
  language: 'en' | 'rw' = 'en',
  withSeconds: boolean = false
): string {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
  const locale = language === 'rw' ? 'rw-RW' : 'en-RW'
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Africa/Kigali',
    ...(withSeconds ? { second: '2-digit' } : {})
  }
  return new Intl.DateTimeFormat(locale, options).format(date)
}
