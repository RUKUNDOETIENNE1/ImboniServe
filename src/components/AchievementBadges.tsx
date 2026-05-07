import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Trophy, Lock, CheckCircle } from 'lucide-react';
import { Achievement, getAchievementProgress } from '@/lib/achievements';

interface AchievementBadgesProps {
  achievements: Achievement[];
  newlyUnlocked?: Achievement[];
}

export default function AchievementBadges({ achievements, newlyUnlocked = [] }: AchievementBadgesProps) {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'excellence': return 'border-yellow-300 bg-yellow-50';
      case 'improvement': return 'border-blue-300 bg-blue-50';
      case 'consistency': return 'border-purple-300 bg-purple-50';
      case 'milestone': return 'border-green-300 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const displayAchievements = showAll ? achievements : unlockedAchievements.slice(0, 6);

  if (achievements.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <h3 className="font-bold text-gray-900">{t('achievements.title')}</h3>
          <span className="text-sm text-gray-600">
            {unlockedAchievements.length}/{achievements.length}
          </span>
        </div>
        {achievements.length > 6 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-imboni-blue hover:underline font-medium"
          >
            {showAll ? t('achievements.show_less') : t('achievements.view_all')}
          </button>
        )}
      </div>

      {/* Newly Unlocked Badge Alert */}
      {newlyUnlocked.length > 0 && (
        <div className="mb-4 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-400 rounded-xl animate-pulse">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🎉</div>
            <div className="flex-1">
              <p className="font-bold text-yellow-900 mb-1">{t('achievements.new_unlocked')}</p>
              <div className="space-y-1">
                {newlyUnlocked.map(achievement => {
                  const name = achievement.nameKey ? t(achievement.nameKey) : achievement.name;
                  const description = achievement.descriptionKey ? t(achievement.descriptionKey) : achievement.description;
                  return (
                    <p key={achievement.id} className="text-sm text-yellow-800">
                      <span className="text-lg mr-2">{achievement.icon}</span>
                      <span className="font-semibold">{name}</span> - {description}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {displayAchievements.map((achievement) => {
          const progress = getAchievementProgress(achievement);
          const isNew = newlyUnlocked.some(a => a.id === achievement.id);
          const name = achievement.nameKey ? t(achievement.nameKey) : achievement.name;
          const description = achievement.descriptionKey ? t(achievement.descriptionKey) : achievement.description;

          return (
            <div
              key={achievement.id}
              className={`relative p-3 rounded-lg border-2 transition-all ${
                achievement.unlocked
                  ? `${getCategoryColor(achievement.category)} ${isNew ? 'ring-2 ring-yellow-500' : ''}`
                  : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              {/* Badge Icon */}
              <div className="text-center mb-2">
                <div className="text-3xl mb-1 relative inline-block">
                  {achievement.unlocked ? (
                    <>
                      {achievement.icon}
                      {isNew && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-ping"></span>
                      )}
                    </>
                  ) : (
                    <div className="relative inline-block opacity-30">
                      {achievement.icon}
                      <Lock className="w-4 h-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-600" />
                    </div>
                  )}
                </div>
              </div>

              {/* Badge Info */}
              <div className="text-center">
                <p className="text-xs font-bold text-gray-900 mb-1 line-clamp-1">
                  {name}
                </p>
                <p className="text-[10px] text-gray-600 line-clamp-2">
                  {description}
                </p>
              </div>

              {/* Progress Bar */}
              {!achievement.unlocked && achievement.progress !== undefined && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-imboni-blue h-1.5 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-[9px] text-gray-500 text-center mt-1">
                    {progress}%
                  </p>
                </div>
              )}

              {/* Unlocked Check */}
              {achievement.unlocked && (
                <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show locked achievements hint */}
      {!showAll && lockedAchievements.length > 0 && (
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">
            {t('achievements.more_to_unlock', { count: lockedAchievements.length })}
          </p>
        </div>
      )}
    </div>
  );
}
