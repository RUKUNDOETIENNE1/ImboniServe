/**
 * Action Priority Scoring System
 * 
 * Calculates priority scores for recommended actions based on
 * effort required and expected impact on revenue.
 */

export interface PrioritizedAction {
  action: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  estimatedROI: number; // 1-10 scale
  priority: number; // Calculated: impact/effort ratio (1-10)
  category: 'critical' | 'medium' | 'opportunity' | 'quick_win';
}

/**
 * Convert effort level to numeric value
 */
function effortToNumber(effort: 'low' | 'medium' | 'high'): number {
  switch (effort) {
    case 'low': return 1;
    case 'medium': return 3;
    case 'high': return 5;
  }
}

/**
 * Convert impact level to numeric value
 */
function impactToNumber(impact: 'low' | 'medium' | 'high'): number {
  switch (impact) {
    case 'low': return 3;
    case 'medium': return 6;
    case 'high': return 10;
  }
}

/**
 * Calculate priority score (higher is better)
 */
function calculatePriority(effort: 'low' | 'medium' | 'high', impact: 'low' | 'medium' | 'high'): number {
  const impactValue = impactToNumber(impact);
  const effortValue = effortToNumber(effort);
  return Math.round((impactValue / effortValue) * 2); // Scale 1-10
}

/**
 * Assign effort and impact levels to actions based on keywords and context
 */
export function scoreActions(
  actions: string[],
  category: 'critical' | 'medium' | 'opportunity' | 'quick_win',
  menuData: {
    total_items: number;
    items_without_images: number;
    items_without_descriptions: number;
  }
): PrioritizedAction[] {
  return actions.map(action => {
    let effort: 'low' | 'medium' | 'high' = 'medium';
    let impact: 'low' | 'medium' | 'high' = 'medium';

    const lowerAction = action.toLowerCase();

    // Determine effort based on action keywords
    if (
      lowerAction.includes('smartphone') ||
      lowerAction.includes('today') ||
      lowerAction.includes('now') ||
      lowerAction.includes('5 items') ||
      lowerAction.includes('quick')
    ) {
      effort = 'low';
    } else if (
      lowerAction.includes('all items') ||
      lowerAction.includes('professional') ||
      lowerAction.includes('reorganize') ||
      lowerAction.includes('rebuild')
    ) {
      effort = 'high';
    }

    // Determine impact based on category and action content
    if (category === 'critical') {
      impact = 'high';
    } else if (category === 'quick_win') {
      impact = lowerAction.includes('photo') ? 'high' : 'medium';
    } else if (category === 'opportunity') {
      impact = 'medium';
    }

    // Adjust impact based on scale
    if (menuData.items_without_images > 20 && lowerAction.includes('photo')) {
      impact = 'high';
    }
    if (menuData.items_without_descriptions > 20 && lowerAction.includes('description')) {
      impact = 'high';
    }

    // Calculate ROI estimate (1-10)
    const priority = calculatePriority(effort, impact);
    const estimatedROI = priority;

    return {
      action,
      effort,
      impact,
      estimatedROI,
      priority,
      category,
    };
  });
}

/**
 * Sort actions by priority (highest first)
 */
export function sortByPriority(actions: PrioritizedAction[]): PrioritizedAction[] {
  return [...actions].sort((a, b) => b.priority - a.priority);
}

/**
 * Get top N priority actions across all categories
 */
export function getTopPriorityActions(
  allActions: {
    critical: string[];
    medium: string[];
    opportunities: string[];
    quick_wins: string[];
  },
  menuData: {
    total_items: number;
    items_without_images: number;
    items_without_descriptions: number;
  },
  count: number = 5
): PrioritizedAction[] {
  const allPrioritized: PrioritizedAction[] = [
    ...scoreActions(allActions.critical, 'critical', menuData),
    ...scoreActions(allActions.medium, 'medium', menuData),
    ...scoreActions(allActions.opportunities, 'opportunity', menuData),
    ...scoreActions(allActions.quick_wins, 'quick_win', menuData),
  ];

  return sortByPriority(allPrioritized).slice(0, count);
}

/**
 * Get effort badge color
 */
export function getEffortColor(effort: 'low' | 'medium' | 'high'): string {
  switch (effort) {
    case 'low': return 'bg-green-100 text-green-700 border-green-300';
    case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    case 'high': return 'bg-red-100 text-red-700 border-red-300';
  }
}

/**
 * Get impact badge color
 */
export function getImpactColor(impact: 'low' | 'medium' | 'high'): string {
  switch (impact) {
    case 'low': return 'bg-gray-100 text-gray-700 border-gray-300';
    case 'medium': return 'bg-blue-100 text-blue-700 border-blue-300';
    case 'high': return 'bg-purple-100 text-purple-700 border-purple-300';
  }
}

/**
 * Get priority label
 */
export function getPriorityLabel(priority: number): string {
  if (priority >= 8) return 'Highest';
  if (priority >= 6) return 'High';
  if (priority >= 4) return 'Medium';
  return 'Low';
}
