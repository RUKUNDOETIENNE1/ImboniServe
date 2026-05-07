/**
 * Achievement Badge System
 * 
 * Gamification system to encourage users to improve their business
 * and engage regularly with the platform.
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'improvement' | 'consistency' | 'excellence' | 'milestone';
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
  nameKey?: string;
  descriptionKey?: string;
}

interface ScanData {
  score: number;
  total_items: number;
  items_with_images: number;
  items_with_descriptions: number;
  scanCount: number;
  consecutiveScans?: number;
  bestScore?: number;
}

/**
 * Check which achievements should be unlocked based on scan data
 */
export function checkAchievements(
  scanData: ScanData,
  previouslyUnlocked: string[] = []
): Achievement[] {
  const achievements: Achievement[] = [
    // First Scan
    {
      id: 'first_scan',
      name: 'Scanner Rookie',
      description: 'Complete your first business scan',
      icon: '🎯',
      category: 'milestone',
      unlocked: scanData.scanCount >= 1,
      unlockedAt: scanData.scanCount >= 1 ? new Date() : undefined,
      nameKey: 'achievementDefs.first_scan.name',
      descriptionKey: 'achievementDefs.first_scan.description',
    },
    
    // Score Achievements
    {
      id: 'score_60',
      name: 'Getting Better',
      description: 'Achieve a score of 60 or higher',
      icon: '📈',
      category: 'improvement',
      unlocked: scanData.score >= 60,
      unlockedAt: scanData.score >= 60 ? new Date() : undefined,
      progress: scanData.score,
      maxProgress: 60,
      nameKey: 'achievementDefs.score_60.name',
      descriptionKey: 'achievementDefs.score_60.description',
    },
    {
      id: 'score_80',
      name: 'Revenue Optimizer',
      description: 'Achieve a score of 80 or higher',
      icon: '⭐',
      category: 'excellence',
      unlocked: scanData.score >= 80,
      unlockedAt: scanData.score >= 80 ? new Date() : undefined,
      progress: scanData.score,
      maxProgress: 80,
      nameKey: 'achievementDefs.score_80.name',
      descriptionKey: 'achievementDefs.score_80.description',
    },
    {
      id: 'score_90',
      name: 'Elite Performer',
      description: 'Achieve a score of 90 or higher',
      icon: '🏆',
      category: 'excellence',
      unlocked: scanData.score >= 90,
      unlockedAt: scanData.score >= 90 ? new Date() : undefined,
      progress: scanData.score,
      maxProgress: 90,
      nameKey: 'achievementDefs.score_90.name',
      descriptionKey: 'achievementDefs.score_90.description',
    },
    {
      id: 'perfect_score',
      name: 'Perfection',
      description: 'Achieve a perfect score of 100',
      icon: '💎',
      category: 'excellence',
      unlocked: scanData.score === 100,
      unlockedAt: scanData.score === 100 ? new Date() : undefined,
      progress: scanData.score,
      maxProgress: 100,
      nameKey: 'achievementDefs.perfect_score.name',
      descriptionKey: 'achievementDefs.perfect_score.description',
    },
    
    // Photo Achievements
    {
      id: 'photos_50',
      name: 'Photo Enthusiast',
      description: 'Add photos to 50% of your menu items',
      icon: '📸',
      category: 'improvement',
      unlocked: scanData.total_items > 0 && (scanData.items_with_images / scanData.total_items) >= 0.5,
      unlockedAt: scanData.total_items > 0 && (scanData.items_with_images / scanData.total_items) >= 0.5 ? new Date() : undefined,
      progress: scanData.items_with_images,
      maxProgress: Math.ceil(scanData.total_items * 0.5),
      nameKey: 'achievementDefs.photos_50.name',
      descriptionKey: 'achievementDefs.photos_50.description',
    },
    {
      id: 'all_photos',
      name: 'Photo Perfect',
      description: 'Add photos to 100% of menu items',
      icon: '📷',
      category: 'excellence',
      unlocked: scanData.total_items > 0 && scanData.items_with_images === scanData.total_items,
      unlockedAt: scanData.total_items > 0 && scanData.items_with_images === scanData.total_items ? new Date() : undefined,
      progress: scanData.items_with_images,
      maxProgress: scanData.total_items,
      nameKey: 'achievementDefs.all_photos.name',
      descriptionKey: 'achievementDefs.all_photos.description',
    },
    
    // Description Achievements
    {
      id: 'descriptions_50',
      name: 'Storyteller',
      description: 'Add descriptions to 50% of your menu items',
      icon: '✍️',
      category: 'improvement',
      unlocked: scanData.total_items > 0 && (scanData.items_with_descriptions / scanData.total_items) >= 0.5,
      unlockedAt: scanData.total_items > 0 && (scanData.items_with_descriptions / scanData.total_items) >= 0.5 ? new Date() : undefined,
      progress: scanData.items_with_descriptions,
      maxProgress: Math.ceil(scanData.total_items * 0.5),
      nameKey: 'achievementDefs.descriptions_50.name',
      descriptionKey: 'achievementDefs.descriptions_50.description',
    },
    {
      id: 'all_descriptions',
      name: 'Menu Master',
      description: 'Add descriptions to 100% of menu items',
      icon: '📝',
      category: 'excellence',
      unlocked: scanData.total_items > 0 && scanData.items_with_descriptions === scanData.total_items,
      unlockedAt: scanData.total_items > 0 && scanData.items_with_descriptions === scanData.total_items ? new Date() : undefined,
      progress: scanData.items_with_descriptions,
      maxProgress: scanData.total_items,
      nameKey: 'achievementDefs.all_descriptions.name',
      descriptionKey: 'achievementDefs.all_descriptions.description',
    },
    
    // Consistency Achievements
    {
      id: 'weekly_scanner',
      name: 'Weekly Warrior',
      description: 'Run 4 scans in one month',
      icon: '📅',
      category: 'consistency',
      unlocked: scanData.scanCount >= 4,
      unlockedAt: scanData.scanCount >= 4 ? new Date() : undefined,
      progress: scanData.scanCount,
      maxProgress: 4,
      nameKey: 'achievementDefs.weekly_scanner.name',
      descriptionKey: 'achievementDefs.weekly_scanner.description',
    },
    {
      id: 'monthly_scanner',
      name: 'Consistent Improver',
      description: 'Run scans for 3 consecutive months',
      icon: '🔥',
      category: 'consistency',
      unlocked: (scanData.consecutiveScans || 0) >= 3,
      unlockedAt: (scanData.consecutiveScans || 0) >= 3 ? new Date() : undefined,
      progress: scanData.consecutiveScans || 0,
      maxProgress: 3,
      nameKey: 'achievementDefs.monthly_scanner.name',
      descriptionKey: 'achievementDefs.monthly_scanner.description',
    },
    
    // Improvement Achievement
    {
      id: 'improved_20',
      name: 'Major Improvement',
      description: 'Improve your score by 20+ points',
      icon: '🚀',
      category: 'improvement',
      unlocked: scanData.bestScore ? (scanData.score - scanData.bestScore >= 20) : false,
      unlockedAt: scanData.bestScore && (scanData.score - scanData.bestScore >= 20) ? new Date() : undefined,
      nameKey: 'achievementDefs.improved_20.name',
      descriptionKey: 'achievementDefs.improved_20.description',
    },
  ];

  // Filter out newly unlocked achievements (not previously unlocked)
  const newlyUnlocked = achievements.filter(
    achievement => achievement.unlocked && !previouslyUnlocked.includes(achievement.id)
  );

  return newlyUnlocked;
}

/**
 * Get all achievement definitions (for display purposes)
 */
export function getAllAchievements(): Achievement[] {
  return [
    { id: 'first_scan', name: 'Scanner Rookie', description: 'Complete your first business scan', icon: '🎯', category: 'milestone', unlocked: false, nameKey: 'achievementDefs.first_scan.name', descriptionKey: 'achievementDefs.first_scan.description' },
    { id: 'score_60', name: 'Getting Better', description: 'Achieve a score of 60 or higher', icon: '📈', category: 'improvement', unlocked: false, nameKey: 'achievementDefs.score_60.name', descriptionKey: 'achievementDefs.score_60.description' },
    { id: 'score_80', name: 'Revenue Optimizer', description: 'Achieve a score of 80 or higher', icon: '⭐', category: 'excellence', unlocked: false, nameKey: 'achievementDefs.score_80.name', descriptionKey: 'achievementDefs.score_80.description' },
    { id: 'score_90', name: 'Elite Performer', description: 'Achieve a score of 90 or higher', icon: '🏆', category: 'excellence', unlocked: false, nameKey: 'achievementDefs.score_90.name', descriptionKey: 'achievementDefs.score_90.description' },
    { id: 'perfect_score', name: 'Perfection', description: 'Achieve a perfect score of 100', icon: '💎', category: 'excellence', unlocked: false, nameKey: 'achievementDefs.perfect_score.name', descriptionKey: 'achievementDefs.perfect_score.description' },
    { id: 'photos_50', name: 'Photo Enthusiast', description: 'Add photos to 50% of your menu items', icon: '📸', category: 'improvement', unlocked: false, nameKey: 'achievementDefs.photos_50.name', descriptionKey: 'achievementDefs.photos_50.description' },
    { id: 'all_photos', name: 'Photo Perfect', description: 'Add photos to 100% of menu items', icon: '📷', category: 'excellence', unlocked: false, nameKey: 'achievementDefs.all_photos.name', descriptionKey: 'achievementDefs.all_photos.description' },
    { id: 'descriptions_50', name: 'Storyteller', description: 'Add descriptions to 50% of your menu items', icon: '✍️', category: 'improvement', unlocked: false, nameKey: 'achievementDefs.descriptions_50.name', descriptionKey: 'achievementDefs.descriptions_50.description' },
    { id: 'all_descriptions', name: 'Menu Master', description: 'Add descriptions to 100% of menu items', icon: '📝', category: 'excellence', unlocked: false, nameKey: 'achievementDefs.all_descriptions.name', descriptionKey: 'achievementDefs.all_descriptions.description' },
    { id: 'weekly_scanner', name: 'Weekly Warrior', description: 'Run 4 scans in one month', icon: '📅', category: 'consistency', unlocked: false, nameKey: 'achievementDefs.weekly_scanner.name', descriptionKey: 'achievementDefs.weekly_scanner.description' },
    { id: 'monthly_scanner', name: 'Consistent Improver', description: 'Run scans for 3 consecutive months', icon: '🔥', category: 'consistency', unlocked: false, nameKey: 'achievementDefs.monthly_scanner.name', descriptionKey: 'achievementDefs.monthly_scanner.description' },
    { id: 'improved_20', name: 'Major Improvement', description: 'Improve your score by 20+ points', icon: '🚀', category: 'improvement', unlocked: false, nameKey: 'achievementDefs.improved_20.name', descriptionKey: 'achievementDefs.improved_20.description' },
  ];
}

/**
 * Calculate progress percentage for an achievement
 */
export function getAchievementProgress(achievement: Achievement): number {
  if (!achievement.progress || !achievement.maxProgress) {
    return achievement.unlocked ? 100 : 0;
  }
  return Math.min(Math.round((achievement.progress / achievement.maxProgress) * 100), 100);
}
