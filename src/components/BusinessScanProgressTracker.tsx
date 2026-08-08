import React from 'react';
import { TrendingUp, TrendingDown, Zap, Calendar } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface ScanHistory {
  id: string;
  created_at: Date;
  score: number;
}

interface ProgressTrackerProps {
  currentScore: number;
  previousScans: ScanHistory[];
}

export default function BusinessScanProgressTracker({ 
  currentScore, 
  previousScans 
}: ProgressTrackerProps) {
  const { t } = useTranslation();
  if (previousScans.length === 0) {
    return null;
  }

  const latestPreviousScan = previousScans[0];
  const improvement = currentScore - latestPreviousScan.score;
  const improvementPercent = latestPreviousScan.score > 0 
    ? Math.round((improvement / latestPreviousScan.score) * 100) 
    : 0;

  const allScores = [...previousScans.map(s => s.score), currentScore];
  const bestScore = Math.max(...allScores);
  const averageScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);

  // Calculate streak (consecutive improvements)
  let streak = 0;
  for (let i = 0; i < previousScans.length - 1; i++) {
    if (previousScans[i].score > previousScans[i + 1].score) {
      streak++;
    } else {
      break;
    }
  }
  if (currentScore > latestPreviousScan.score) {
    streak++;
  }

  const daysSinceLastScan = latestPreviousScan.created_at 
    ? Math.floor((new Date().getTime() - new Date(latestPreviousScan.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h3 className="font-bold text-blue-900">{t('progressTracker.title')}</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Score Change */}
        <div className="bg-white rounded-lg p-3 border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            {improvement >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className="text-xs text-gray-600 font-medium">{t('progressTracker.since_last_scan')}</span>
          </div>
          <div className={`text-2xl font-bold ${improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {improvement >= 0 ? '+' : ''}{improvement}
          </div>
          <div className="text-xs text-gray-500">
            {improvementPercent >= 0 ? '+' : ''}{improvementPercent}% {t('progressTracker.change')}
          </div>
        </div>

        {/* Best Score */}
        <div className="bg-white rounded-lg p-3 border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-yellow-600" />
            <span className="text-xs text-gray-600 font-medium">{t('progressTracker.best_score')}</span>
          </div>
          <div className="text-2xl font-bold text-yellow-600">
            {bestScore}
          </div>
          <div className="text-xs text-gray-500">
            {currentScore === bestScore ? t('progressTracker.current_label') : t('progressTracker.previous_label')}
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-white rounded-lg p-3 border border-blue-100">
          <div className="text-xs text-gray-600 font-medium mb-1">{t('progressTracker.average')}</div>
          <div className="text-2xl font-bold text-blue-600">
            {averageScore}
          </div>
          <div className="text-xs text-gray-500">
            {t('progressTracker.over_scans', 'Over scans')}: {allScores.length}
          </div>
        </div>

        {/* Streak */}
        <div className="bg-white rounded-lg p-3 border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-gray-600 font-medium">{t('progressTracker.streak')}</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {streak > 0 ? `🔥 ${streak}` : '0'}
          </div>
          <div className="text-xs text-gray-500">
            {streak > 0 ? t('progressTracker.improvements_label') : t('progressTracker.no_streak_yet')}
          </div>
        </div>
      </div>

      {/* Progress Message */}
      <div className="mt-4 p-3 bg-white rounded-lg border border-blue-100">
        <p className="text-sm text-gray-700">
          {improvement > 0 && (
            <span className="font-semibold text-green-600">
              {t('progressTracker.messages.increased', 'Score increased')}: +{improvement} in {daysSinceLastScan}d
            </span>
          )}
          {improvement === 0 && (
            <span className="text-gray-600">
              {t('progressTracker.messages.stable')}
            </span>
          )}
          {improvement < 0 && (
            <span className="font-semibold text-orange-600">
              {t('progressTracker.messages.decreased', 'Score decreased')}: -{Math.abs(improvement)}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
