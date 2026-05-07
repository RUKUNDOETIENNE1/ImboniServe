/**
 * CurrencyDisplay Component
 * 
 * Centralized component for displaying currency values
 * Automatically uses user's preferred currency from context
 */

import React from 'react';
import { useCurrency } from '@/contexts/LocaleContext';
import { formatCurrency, formatCurrencyFromCents } from '@/lib/utils/currency';

interface CurrencyDisplayProps {
  /** Amount in RWF (base currency) */
  amount: number;
  /** Whether amount is in cents (default: false) */
  inCents?: boolean;
  /** Show currency symbol (default: true) */
  showSymbol?: boolean;
  /** Show currency code (default: false) */
  showCode?: boolean;
  /** Use compact format for large numbers (default: false) */
  compact?: boolean;
  /** Custom currency override (optional) */
  currencyOverride?: string;
  /** Additional CSS classes */
  className?: string;
}

export default function CurrencyDisplay({
  amount,
  inCents = false,
  showSymbol = true,
  showCode = false,
  compact = false,
  currencyOverride,
  className = ''
}: CurrencyDisplayProps) {
  const { currency } = useCurrency();
  const targetCurrency = currencyOverride || currency;

  const formattedAmount = inCents
    ? formatCurrencyFromCents(amount, targetCurrency, { showSymbol, showCode, compact })
    : formatCurrency(amount, targetCurrency, { showSymbol, showCode, compact });

  return <span className={className}>{formattedAmount}</span>;
}

// Convenience component for cents display
export function CurrencyDisplayCents(props: Omit<CurrencyDisplayProps, 'inCents'>) {
  return <CurrencyDisplay {...props} inCents={true} />;
}

// Convenience component for compact display
export function CurrencyDisplayCompact(props: Omit<CurrencyDisplayProps, 'compact'>) {
  return <CurrencyDisplay {...props} compact={true} />;
}
