import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { detectCurrencyFromLocale } from '@/lib/utils/currency';
import { detectUserTimezone } from '@/lib/utils/timezone';

interface LocaleContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  timezone: string;
  setTimezone: (timezone: string) => void;
  locale: string;
  setLocale: (locale: string) => void;
  isLoading: boolean;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const { data: session, status } = useSession();
  const [currency, setCurrencyState] = useState<string>('RWF');
  const [timezone, setTimezoneState] = useState<string>('Africa/Kigali');
  const [locale, setLocaleState] = useState<string>('en');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from Business settings or browser
  useEffect(() => {
    const initializeLocaleSettings = async () => {
      setIsLoading(true);

      try {
        // If user is logged in, fetch Business settings
        if (status === 'authenticated' && session?.user) {
          try {
            // Fetch current business
            const businessRes = await fetch('/api/business/current');
            if (businessRes.ok) {
              const businessData = await businessRes.json();
              // Fetch business settings including currency
              const settingsRes = await fetch(`/api/business/${businessData.id}/settings`);
              if (settingsRes.ok) {
                const settings = await settingsRes.json();
                // Use Business currency with RWF as fallback
                setCurrencyState(settings.currency || 'RWF');
                // Use Business timezone if available
                if (settings.timezone) {
                  setTimezoneState(settings.timezone);
                }
              }
            }
          } catch (err) {
            console.error('Failed to fetch business settings, using defaults:', err);
            setCurrencyState('RWF');
          }

          // Set timezone and locale from user prefs or detect
          const userPrefs = (session.user as any);
          if (userPrefs.timezone) {
            setTimezoneState(userPrefs.timezone);
          } else {
            setTimezoneState(detectUserTimezone());
          }
          if (userPrefs.locale) {
            setLocaleState(userPrefs.locale);
          }
        } else {
          // For anonymous users, detect from browser
          const detectedCurrency = detectCurrencyFromLocale(navigator.language);
          const detectedTimezone = detectUserTimezone();
          const detectedLocale = navigator.language.split('-')[0] || 'en';

          setCurrencyState(detectedCurrency);
          setTimezoneState(detectedTimezone);
          setLocaleState(detectedLocale);

          // Store in localStorage for persistence
          localStorage.setItem('imboni_currency', detectedCurrency);
          localStorage.setItem('imboni_timezone', detectedTimezone);
          localStorage.setItem('imboni_locale', detectedLocale);
        }
      } catch (error) {
        console.error('Failed to initialize locale settings:', error);
        // Fallback to RWF on error
        setCurrencyState('RWF');
      } finally {
        setIsLoading(false);
      }
    };

    initializeLocaleSettings();
  }, [session, status]);

  // Persist changes to Business settings
  const setCurrency = async (newCurrency: string) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('imboni_currency', newCurrency);

    // If user is logged in, update Business currency
    if (session?.user) {
      try {
        const businessRes = await fetch('/api/business/current');
        if (businessRes.ok) {
          const businessData = await businessRes.json();
          await fetch(`/api/business/${businessData.id}/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currency: newCurrency })
          });
        }
      } catch (error) {
        console.error('Failed to update currency in business settings:', error);
      }
    }
  };

  const setTimezone = async (newTimezone: string) => {
    setTimezoneState(newTimezone);
    localStorage.setItem('imboni_timezone', newTimezone);

    if (session?.user) {
      try {
        await fetch('/api/user/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timezone: newTimezone })
        });
      } catch (error) {
        console.error('Failed to update timezone preference:', error);
      }
    }
  };

  const setLocale = async (newLocale: string) => {
    setLocaleState(newLocale);
    localStorage.setItem('imboni_locale', newLocale);

    if (session?.user) {
      try {
        await fetch('/api/user/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale: newLocale })
        });
      } catch (error) {
        console.error('Failed to update locale preference:', error);
      }
    }
  };

  const value: LocaleContextType = {
    currency,
    setCurrency,
    timezone,
    setTimezone,
    locale,
    setLocale,
    isLoading
  };

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

// Custom hook to use locale context
export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

// Convenience hooks
export function useCurrency() {
  const { currency, setCurrency } = useLocale();
  return { currency, setCurrency };
}

export function useTimezone() {
  const { timezone, setTimezone } = useLocale();
  return { timezone, setTimezone };
}
