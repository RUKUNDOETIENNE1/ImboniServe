import React, { useState, useEffect } from 'react';
import { X, TrendingDown, AlertCircle, Lightbulb, CheckCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import BusinessScanProgressTracker from './BusinessScanProgressTracker';
import AchievementBadges from './AchievementBadges';
import PrioritizedActions from './PrioritizedActions';
import { getAllAchievements, Achievement } from '@/lib/achievements';

interface ScanResult {
  score: number;
  primary_issue: string;
  critical_issues: string[];
  medium_issues: string[];
  opportunities: string[];
  quick_wins: string[];
  newAchievements?: Achievement[];
  topPriorityActions?: any[];
}

interface BusinessRevenueScannerProps {
  onClose: () => void;
}

export default function BusinessRevenueScanner({ onClose }: BusinessRevenueScannerProps) {
  const { t, locale } = useTranslation();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showFullReport, setShowFullReport] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [scanHistory, setScanHistory] = useState<Array<{ id: string; created_at: Date; score: number }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);

  const loadingMessages = [
    t('scanner.loading.analyzing'),
    t('scanner.loading.detecting'),
    t('scanner.loading.evaluating'),
    t('scanner.loading.generating'),
  ];

  useEffect(() => {
    fetchScanHistory();
    // Initialize achievements
    setAllAchievements(getAllAchievements());
  }, []);

  const fetchScanHistory = async () => {
    try {
      const response = await fetch('/api/business/scan-history');
      if (response.ok) {
        const data = await response.json();
        setScanHistory(data.scans || []);
      }
    } catch (error) {
      console.error('Failed to fetch scan history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const runScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    setShowFullReport(false);

    let messageIndex = 0;
    setLoadingMessage(loadingMessages[0]);
    
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[messageIndex]);
    }, 1500);

    try {
      const response = await fetch('/api/business/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });

      const data = await response.json();
      
      // Phase 2A: Handle insufficient AI credits
      if (response.status === 402) {
        alert(`${t('scanner.errors.insufficient_credits')}\n\n${data.message || ''}\n\n${t('scanner.errors.upgrade_prompt')}`);
        setIsScanning(false);
        clearInterval(messageInterval);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Scan failed');
      }

      setScanResult(data);
      
      // Update achievements if new ones unlocked
      if (data.newAchievements && data.newAchievements.length > 0) {
        const updatedAchievements = allAchievements.map(achievement => {
          const unlocked = data.newAchievements.find((a: Achievement) => a.id === achievement.id);
          return unlocked ? { ...unlocked } : achievement;
        });
        setAllAchievements(updatedAchievements);
      }
      
      // Refresh history after new scan
      fetchScanHistory();
    } catch (error) {
      console.error('Scan error:', error);
      alert(t('scanner.errors.run_failed'));
    } finally {
      clearInterval(messageInterval);
      setIsScanning(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-imboni-blue">{t('scanner.title')}</h2>
            <p className="text-sm text-gray-600 mt-1">{t('scanner.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!scanResult && !isScanning && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-imboni-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingDown className="w-10 h-10 text-imboni-blue" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('scanner.ready.title')}</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">{t('scanner.ready.subtitle')}</p>
              <button
                onClick={runScan}
                className="bg-imboni-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-imboni-blue/90 transition"
              >
                {t('scanner.buttons.run_scan')}
              </button>
            </div>
          )}

          {isScanning && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-imboni-blue animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900">{loadingMessage}</p>
              <p className="text-sm text-gray-500 mt-2">{t('scanner.loading.note')}</p>
            </div>
          )}

          {scanResult && !showFullReport && (
            <div className="space-y-6">
              {/* Progress Tracker */}
              {/* Achievements */}
              {scanResult.newAchievements && scanResult.newAchievements.length > 0 && (
                <AchievementBadges 
                  achievements={allAchievements}
                  newlyUnlocked={scanResult.newAchievements}
                />
              )}

              {/* Progress Tracker */}
              {!loadingHistory && scanHistory.length > 0 && (
                <BusinessScanProgressTracker 
                  currentScore={scanResult.score}
                  previousScans={scanHistory}
                />
              )}

              {/* Top Priority Actions */}
              {scanResult.topPriorityActions && scanResult.topPriorityActions.length > 0 && (
                <PrioritizedActions actions={scanResult.topPriorityActions} />
              )}

              {/* Score */}
              <div className={`rounded-xl border-2 p-6 text-center ${getScoreBgColor(scanResult.score)}`}>
                <div className="text-sm font-medium text-gray-600 mb-2">{t('scanner.sections.score.title')}</div>
                <div className={`text-6xl font-bold ${getScoreColor(scanResult.score)}`}>
                  {scanResult.score}/100
                </div>
                <div className="text-sm text-gray-700 mt-2">{t('scanner.sections.score.subtitle')}</div>
              </div>

              {/* Primary Issue */
              }
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900 mb-1">{t('scanner.sections.primary_issue')}</h4>
                    <p className="text-red-800">{scanResult.primary_issue}</p>
                  </div>
                </div>
              </div>

              {/* Quick Wins */}
              {scanResult.quick_wins.length > 0 && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900 mb-3">💡 {t('scanner.sections.quick_wins')}</h4>
                      <ul className="space-y-2">
                        {scanResult.quick_wins.slice(0, 3).map((win, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-green-800">
                            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{win}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* View Full Report Button */}
              <button
                onClick={() => setShowFullReport(true)}
                className="w-full bg-imboni-blue text-white py-3 rounded-lg font-semibold hover:bg-imboni-blue/90 transition"
              >
                👉 {t('scanner.buttons.view_full_report')}
              </button>
            </div>
          )}

          {scanResult && showFullReport && (
            <div className="space-y-6">
              {/* Back Button */}
              <button
                onClick={() => setShowFullReport(false)}
                className="text-imboni-blue hover:underline text-sm font-medium"
              >
                ← {t('scanner.buttons.back_to_summary')}
              </button>

              {/* Score Summary */}
              <div className={`rounded-xl border-2 p-4 ${getScoreBgColor(scanResult.score)}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">{t('scanner.sections.score.title')}</span>
                  <span className={`text-3xl font-bold ${getScoreColor(scanResult.score)}`}>
                    {scanResult.score}/100
                  </span>
                </div>
              </div>

              {/* Critical Issues */}
              {scanResult.critical_issues.length > 0 && (
                <div className="bg-white border-2 border-red-200 rounded-xl p-5">
                  <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">🔴</span> {t('scanner.sections.critical_issues')}
                  </h3>
                  <ul className="space-y-2">
                    {scanResult.critical_issues.map((issue, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <span className="text-red-600 font-bold flex-shrink-0">•</span>
                        <span className="text-sm">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Medium Issues */}
              {scanResult.medium_issues.length > 0 && (
                <div className="bg-white border-2 border-orange-200 rounded-xl p-5">
                  <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">🟠</span> {t('scanner.sections.medium_issues')}
                  </h3>
                  <ul className="space-y-2">
                    {scanResult.medium_issues.map((issue, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <span className="text-orange-600 font-bold flex-shrink-0">•</span>
                        <span className="text-sm">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Opportunities */}
              {scanResult.opportunities.length > 0 && (
                <div className="bg-white border-2 border-green-200 rounded-xl p-5">
                  <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">🟢</span> {t('scanner.sections.opportunities')}
                  </h3>
                  <ul className="space-y-2">
                    {scanResult.opportunities.map((opp, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <span className="text-green-600 font-bold flex-shrink-0">•</span>
                        <span className="text-sm">{opp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quick Wins */}
              {scanResult.quick_wins.length > 0 && (
                <div className="bg-white border-2 border-blue-200 rounded-xl p-5">
                  <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">💡</span> {t('scanner.sections.quick_wins')}
                  </h3>
                  <ul className="space-y-2">
                    {scanResult.quick_wins.map((win, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{win}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Run Another Scan */}
              <button
                onClick={() => {
                  setScanResult(null);
                  setShowFullReport(false);
                }}
                className="w-full bg-slate-100 text-slate-700 py-3 rounded-lg font-semibold hover:bg-slate-200 transition"
              >
                {t('scanner.buttons.run_another_scan')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
