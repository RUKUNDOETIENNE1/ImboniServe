import React, { useState } from 'react';
import { Globe, Clock, DollarSign, Check } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { getSupportedCurrencies, getCurrencyConfig } from '@/lib/utils/currency';
import { getSupportedTimezones, getTimezoneConfig } from '@/lib/utils/timezone';

export default function LocaleSettings() {
  const { currency, setCurrency, timezone, setTimezone, locale, setLocale } = useLocale();
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const supportedCurrencies = getSupportedCurrencies();
  const supportedTimezones = getSupportedTimezones();
  const supportedLocales = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'rw', name: 'Kinyarwanda' }
  ];

  const handleCurrencyChange = async (newCurrency: string) => {
    setIsUpdating(true);
    try {
      await setCurrency(newCurrency);
      setSuccessMessage('Currency updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update currency:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTimezoneChange = async (newTimezone: string) => {
    setIsUpdating(true);
    try {
      await setTimezone(newTimezone);
      setSuccessMessage('Timezone updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update timezone:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLocaleChange = async (newLocale: string) => {
    setIsUpdating(true);
    try {
      await setLocale(newLocale);
      setSuccessMessage('Language updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update language:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Currency Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Currency</h3>
            <p className="text-sm text-gray-600">Choose your preferred currency for pricing display</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {supportedCurrencies.map((curr) => (
            <button
              key={curr.code}
              onClick={() => handleCurrencyChange(curr.code)}
              disabled={isUpdating}
              className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                currency === curr.code
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {currency === curr.code && (
                <div className="absolute top-2 right-2">
                  <Check className="w-5 h-5 text-blue-600" />
                </div>
              )}
              <div className="text-2xl font-bold text-gray-900 mb-1">{curr.symbol}</div>
              <div className="text-sm font-medium text-gray-700">{curr.code}</div>
              <div className="text-xs text-gray-500">{curr.name}</div>
            </button>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Prices are converted for display only. All transactions are processed in RWF.
          </p>
        </div>
      </div>

      {/* Timezone Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Timezone</h3>
            <p className="text-sm text-gray-600">Set your local timezone for accurate timestamps</p>
          </div>
        </div>

        <select
          value={timezone}
          onChange={(e) => handleTimezoneChange(e.target.value)}
          disabled={isUpdating}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {supportedTimezones.map((tz) => (
            <option key={tz.id} value={tz.id}>
              {tz.name} ({tz.utcOffset}) {tz.countryCode ? `- ${tz.countryCode}` : ''}
            </option>
          ))}
        </select>

        <div className="mt-4 p-3 bg-purple-50 rounded-lg">
          <p className="text-sm text-purple-800">
            <strong>Current time in your timezone:</strong>{' '}
            {new Date().toLocaleString('en-US', { timeZone: timezone, dateStyle: 'full', timeStyle: 'long' })}
          </p>
        </div>
      </div>

      {/* Language Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Language</h3>
            <p className="text-sm text-gray-600">Choose your preferred language</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {supportedLocales.map((loc) => (
            <button
              key={loc.code}
              onClick={() => handleLocaleChange(loc.code)}
              disabled={isUpdating}
              className={`relative p-4 rounded-lg border-2 transition-all text-center ${
                locale === loc.code
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {locale === loc.code && (
                <div className="absolute top-2 right-2">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
              )}
              <div className="text-lg font-semibold text-gray-900">{loc.name}</div>
              <div className="text-xs text-gray-500 uppercase">{loc.code}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
