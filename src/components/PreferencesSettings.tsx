/**
 * User Preferences Settings Component
 * Allows users to set dietary preferences and allergies
 */

import { useState, useEffect } from 'react';
import { X, AlertTriangle, Check } from 'lucide-react';
import {
  getUserPreferences,
  saveUserPreferences,
  COMMON_ALLERGENS,
  DIETARY_PREFERENCES,
  type UserPreferences,
} from '@/lib/userPreferences';

interface PreferencesSettingsProps {
  onClose: () => void;
  onSave?: () => void;
}

export default function PreferencesSettings({ onClose, onSave }: PreferencesSettingsProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(getUserPreferences());
  const [hasChanges, setHasChanges] = useState(false);

  const toggleAllergy = (allergen: string) => {
    setPreferences(prev => {
      const allergies = prev.allergies.includes(allergen)
        ? prev.allergies.filter(a => a !== allergen)
        : [...prev.allergies, allergen];
      return { ...prev, allergies };
    });
    setHasChanges(true);
  };

  const toggleDietaryPref = (pref: string) => {
    setPreferences(prev => {
      const dietaryPreferences = prev.dietaryPreferences.includes(pref)
        ? prev.dietaryPreferences.filter(p => p !== pref)
        : [...prev.dietaryPreferences, pref];
      return { ...prev, dietaryPreferences };
    });
    setHasChanges(true);
  };

  const toggleHideUnsafe = () => {
    setPreferences(prev => ({ ...prev, hideUnsafeItems: !prev.hideUnsafeItems }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveUserPreferences(preferences);
    setHasChanges(false);
    if (onSave) onSave();
    onClose();
  };

  const handleClearAll = () => {
    setPreferences({
      allergies: [],
      dietaryPreferences: [],
      hideUnsafeItems: false,
      language: preferences.language,
    });
    setHasChanges(true);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          maxWidth: 500,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            background: 'white',
            borderBottom: '1px solid #e5e7eb',
            padding: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Dietary Preferences</h2>
          <button
            onClick={onClose}
            style={{ padding: 8, border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 20 }}>
          {/* Info Banner */}
          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 8,
              padding: 12,
              marginBottom: 20,
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            Set your dietary preferences and allergies to get personalized warnings and recommendations.
          </div>

          {/* Allergies Section */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} color="#dc2626" />
              Allergies
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {COMMON_ALLERGENS.map((allergen) => {
                const isSelected = preferences.allergies.includes(allergen);
                return (
                  <button
                    key={allergen}
                    onClick={() => toggleAllergy(allergen)}
                    style={{
                      padding: '8px 14px',
                      border: isSelected ? '2px solid #dc2626' : '1px solid #d1d5db',
                      background: isSelected ? '#fee2e2' : 'white',
                      color: isSelected ? '#991b1b' : '#374151',
                      borderRadius: 999,
                      fontSize: 14,
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {isSelected && <Check size={14} />}
                    {allergen}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dietary Preferences Section */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Dietary Preferences</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DIETARY_PREFERENCES.map((pref) => {
                const isSelected = preferences.dietaryPreferences.includes(pref);
                return (
                  <button
                    key={pref}
                    onClick={() => toggleDietaryPref(pref)}
                    style={{
                      padding: '8px 14px',
                      border: isSelected ? '2px solid #16a34a' : '1px solid #d1d5db',
                      background: isSelected ? '#dcfce7' : 'white',
                      color: isSelected ? '#166534' : '#374151',
                      borderRadius: 999,
                      fontSize: 14,
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {isSelected && <Check size={14} />}
                    {pref}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hide Unsafe Items Toggle */}
          {(preferences.allergies.length > 0 || preferences.dietaryPreferences.length > 0) && (
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  padding: 12,
                  background: '#f9fafb',
                  borderRadius: 8,
                }}
              >
                <input
                  type="checkbox"
                  checked={preferences.hideUnsafeItems}
                  onChange={toggleHideUnsafe}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  Hide items that don't match my preferences
                </span>
              </label>
            </div>
          )}

          {/* Summary */}
          {(preferences.allergies.length > 0 || preferences.dietaryPreferences.length > 0) && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: 8,
                padding: 12,
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Your Preferences:</div>
              {preferences.allergies.length > 0 && (
                <div style={{ fontSize: 13, marginBottom: 4 }}>
                  <strong>Allergies:</strong> {preferences.allergies.join(', ')}
                </div>
              )}
              {preferences.dietaryPreferences.length > 0 && (
                <div style={{ fontSize: 13 }}>
                  <strong>Dietary:</strong> {preferences.dietaryPreferences.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleClearAll}
              disabled={preferences.allergies.length === 0 && preferences.dietaryPreferences.length === 0}
              style={{
                flex: 1,
                padding: 12,
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
                opacity: preferences.allergies.length === 0 && preferences.dietaryPreferences.length === 0 ? 0.5 : 1,
              }}
            >
              Clear All
            </button>
            <button
              onClick={handleSave}
              style={{
                flex: 2,
                padding: 12,
                background: '#111827',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {hasChanges ? 'Save Changes' : 'Done'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
