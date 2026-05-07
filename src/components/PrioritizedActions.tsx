import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Target, Zap, TrendingUp } from 'lucide-react';
import { PrioritizedAction, getEffortColor, getImpactColor, getPriorityLabel } from '@/lib/action-priority';

interface PrioritizedActionsProps {
  actions: PrioritizedAction[];
}

export default function PrioritizedActions({ actions }: PrioritizedActionsProps) {
  const { t } = useTranslation();
  if (actions.length === 0) {
    return null;
  }

  const topActions = actions.slice(0, 5);

  return (
    <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-indigo-900">🎯 {t('priorityActions.title')}</h3>
      </div>

      <p className="text-sm text-indigo-700 mb-4">
        {t('priorityActions.subtitle')}
      </p>

      <div className="space-y-3">
        {topActions.map((action, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-4 border-2 border-indigo-100 hover:border-indigo-300 transition-all"
          >
            <div className="flex items-start gap-3">
              {/* Priority Badge */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  #{index + 1}
                </div>
              </div>

              {/* Action Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 font-medium mb-2">
                  {action.action}
                </p>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {/* Priority Score */}
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-300">
                    <Zap className="w-3 h-3 text-purple-700" />
                    <span className="text-xs font-semibold text-purple-700">
                      {t('priorityActions.priority_levels.' + getPriorityLabel(action.priority).toLowerCase())} {t('priorityActions.labels.priority')}
                    </span>
                  </div>

                  {/* Effort */}
                  <div className={`px-2 py-1 rounded-md text-xs font-semibold border ${getEffortColor(action.effort)}`}>
                    {action.effort === 'low' ? '⚡' : action.effort === 'medium' ? '⚙️' : '🔧'} {t('priorityActions.effort.' + action.effort)} {t('priorityActions.labels.effort')}
                  </div>

                  {/* Impact */}
                  <div className={`px-2 py-1 rounded-md text-xs font-semibold border ${getImpactColor(action.impact)}`}>
                    {action.impact === 'high' ? '🚀' : action.impact === 'medium' ? '📈' : '📊'} {t('priorityActions.impact.' + action.impact)} {t('priorityActions.labels.impact')}
                  </div>

                  {/* ROI Score */}
                  <div className="px-2 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-700 border border-green-300">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    {t('priorityActions.roi_label')}: {action.estimatedROI}/10
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-white rounded-lg border border-indigo-100">
        <p className="text-xs text-gray-600">
          <strong>💡 {t('priorityActions.tip.prefix')}</strong> {t('priorityActions.tip.body')}
        </p>
      </div>
    </div>
  );
}
