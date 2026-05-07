/**
 * Menu Item Detail Modal
 * Shows comprehensive information about a menu item
 */

import { X, Clock, Users, Flame, AlertTriangle } from 'lucide-react';
import { getUserPreferences, isMenuItemSafe } from '@/lib/userPreferences';
import { useState, useEffect } from 'react';

export interface MenuItemDetail {
  id: string;
  name: string;
  description?: string | null;
  priceCents: number;
  category?: string | null;
  ingredients?: string[];
  allergens?: string[];
  dietaryTags?: string[];
  spiceLevel?: string | null;
  portionSize?: string | null;
  prepTimeMinutes?: number | null;
  imageReal?: string | null;
}

interface MenuItemDetailModalProps {
  item: MenuItemDetail;
  onClose: () => void;
  onAddToCart: (item: MenuItemDetail) => void;
  recommendations?: MenuItemDetail[];
}

export default function MenuItemDetailModal({
  item,
  onClose,
  onAddToCart,
  recommendations = [],
}: MenuItemDetailModalProps) {
  const [showAskAI, setShowAskAI] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [preferences, setPreferences] = useState(getUserPreferences());

  useEffect(() => {
    setPreferences(getUserPreferences());
  }, []);

  const safetyCheck = isMenuItemSafe(item, preferences);

  const spiceLevelIcons = {
    none: '○',
    mild: '🌶️',
    medium: '🌶️🌶️',
    hot: '🌶️🌶️🌶️',
  };

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;

    setAiLoading(true);
    try {
      const response = await fetch('/api/menu/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: aiQuestion,
          menuItem: {
            name: item.name,
            description: item.description,
            ingredients: item.ingredients,
            allergens: item.allergens,
            spiceLevel: item.spiceLevel,
          },
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setAiResponse(data.answer);
      } else {
        setAiResponse('Sorry, I could not answer that question.');
      }
    } catch (error) {
      setAiResponse('Failed to get answer. Please try again.');
    } finally {
      setAiLoading(false);
    }
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
          maxWidth: 600,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ position: 'sticky', top: 0, background: 'white', borderBottom: '1px solid #e5e7eb', padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{item.name}</h2>
          <button onClick={onClose} style={{ padding: 8, border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 20 }}>
          {/* Image */}
          {item.imageReal && (
            <img
              src={item.imageReal}
              alt={item.name}
              style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 12, marginBottom: 16 }}
            />
          )}

          {/* Safety Warning */}
          {!safetyCheck.safe && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b91c1c', fontWeight: 600, marginBottom: 4 }}>
                <AlertTriangle size={20} />
                Not suitable for your preferences
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#991b1b' }}>
                {safetyCheck.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Description */}
          {item.description && (
            <p style={{ color: '#4b5563', marginBottom: 16, lineHeight: 1.6 }}>{item.description}</p>
          )}

          {/* Quick Info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 16 }}>
            {item.prepTimeMinutes && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 8, background: '#f3f4f6', borderRadius: 8 }}>
                <Clock size={16} />
                <span style={{ fontSize: 14 }}>{item.prepTimeMinutes} min</span>
              </div>
            )}
            {item.portionSize && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 8, background: '#f3f4f6', borderRadius: 8 }}>
                <Users size={16} />
                <span style={{ fontSize: 14, textTransform: 'capitalize' }}>{item.portionSize}</span>
              </div>
            )}
            {item.spiceLevel && item.spiceLevel !== 'none' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 8, background: '#f3f4f6', borderRadius: 8 }}>
                <Flame size={16} />
                <span style={{ fontSize: 14 }}>{spiceLevelIcons[item.spiceLevel as keyof typeof spiceLevelIcons]}</span>
              </div>
            )}
          </div>

          {/* Ingredients */}
          {item.ingredients && item.ingredients.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Ingredients</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {item.ingredients.map((ingredient, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '4px 10px',
                      background: '#e0f2fe',
                      color: '#0369a1',
                      borderRadius: 999,
                      fontSize: 13,
                    }}
                  >
                    {ingredient}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Allergens */}
          {item.allergens && item.allergens.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#b91c1c' }}>⚠️ Contains Allergens</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {item.allergens.map((allergen, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '4px 10px',
                      background: '#fee2e2',
                      color: '#991b1b',
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {allergen}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dietary Tags */}
          {item.dietaryTags && item.dietaryTags.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Dietary Info</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {item.dietaryTags.map((tag, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '4px 10px',
                      background: '#dcfce7',
                      color: '#166534',
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ask AI Section */}
          <div style={{ marginBottom: 16, padding: 12, background: '#f9fafb', borderRadius: 8 }}>
            <button
              onClick={() => setShowAskAI(!showAskAI)}
              style={{
                width: '100%',
                padding: 10,
                background: '#111827',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {showAskAI ? 'Hide AI Assistant' : '🤖 Ask about this dish'}
            </button>

            {showAskAI && (
              <div style={{ marginTop: 12 }}>
                <input
                  type="text"
                  placeholder="e.g., Is this spicy? How big is the portion?"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAskAI()}
                  style={{
                    width: '100%',
                    padding: 10,
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    marginBottom: 8,
                  }}
                />
                <button
                  onClick={handleAskAI}
                  disabled={aiLoading || !aiQuestion.trim()}
                  style={{
                    width: '100%',
                    padding: 8,
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  {aiLoading ? 'Thinking...' : 'Ask'}
                </button>
                {aiResponse && (
                  <div style={{ marginTop: 12, padding: 12, background: 'white', borderRadius: 6, border: '1px solid #e5e7eb' }}>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{aiResponse}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && !safetyCheck.safe && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>You may prefer these</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {recommendations.slice(0, 3).map((rec) => (
                  <div
                    key={rec.id}
                    style={{
                      padding: 12,
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{rec.name}</div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>RWF {Math.round(rec.priceCents).toLocaleString()}</div>
                    </div>
                    <button
                      onClick={() => {
                        onAddToCart(rec);
                        onClose();
                      }}
                      style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price & Add to Cart */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '2px solid #e5e7eb' }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>RWF {Math.round(item.priceCents).toLocaleString()}</div>
            <button
              onClick={() => {
                onAddToCart(item);
                onClose();
              }}
              style={{
                padding: '12px 24px',
                background: '#111827',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
