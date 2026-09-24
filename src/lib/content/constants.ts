export type ArticleType =
  | 'Article'
  | 'FounderStory'
  | 'IndustryInsight'
  | 'ProductStory'
  | 'CaseStudy'
  | 'Guide'
  | 'Report'
  | 'Newsletter'
  | 'Announcement'
  | 'Resource'

export type ArticleStatus =
  | 'DRAFT'
  | 'REVIEW'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'UPDATED'
  | 'ARCHIVED'
  | 'REJECTED'

export type EditorialRole = 'EDITOR' | 'REVIEWER' | 'PUBLISHER'

export const ARTICLE_TYPES: ArticleType[] = [
  'Article',
  'FounderStory',
  'IndustryInsight',
  'ProductStory',
  'CaseStudy',
  'Guide',
  'Report',
  'Newsletter',
  'Announcement',
  'Resource',
]

export const ARTICLE_STATUSES: ArticleStatus[] = [
  'DRAFT',
  'REVIEW',
  'APPROVED',
  'SCHEDULED',
  'PUBLISHED',
  'UPDATED',
  'ARCHIVED',
  'REJECTED',
]

export const ARTICLE_TYPE_LABELS: Record<ArticleType, string> = {
  Article: 'Article',
  FounderStory: 'Founder Story',
  IndustryInsight: 'Industry Insight',
  ProductStory: 'Product Story',
  CaseStudy: 'Case Study',
  Guide: 'Guide',
  Report: 'Report',
  Newsletter: 'Newsletter',
  Announcement: 'Announcement',
  Resource: 'Resource',
}

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  DRAFT: 'Draft',
  REVIEW: 'In Review',
  APPROVED: 'Approved',
  SCHEDULED: 'Scheduled',
  PUBLISHED: 'Published',
  UPDATED: 'Being Updated',
  ARCHIVED: 'Archived',
  REJECTED: 'Rejected',
}

export const ARTICLE_STATUS_COLORS: Record<ArticleStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  REVIEW: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-green-100 text-green-700',
  SCHEDULED: 'bg-purple-100 text-purple-700',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  UPDATED: 'bg-yellow-100 text-yellow-700',
  ARCHIVED: 'bg-gray-200 text-gray-500',
  REJECTED: 'bg-red-100 text-red-700',
}

export function getTypePath(type: string): string {
  switch (type) {
    case 'Article':
    case 'Announcement':
      return 'blog'
    case 'FounderStory':
    case 'ProductStory':
    case 'CaseStudy':
      return 'stories'
    case 'IndustryInsight':
      return 'insights'
    case 'Guide':
      return 'guides'
    case 'Report':
      return 'reports'
    case 'Newsletter':
      return 'newsletter'
    case 'Resource':
      return 'resources'
    default:
      return 'blog'
  }
}

export function getRouteTypes(route: string): ArticleType[] {
  switch (route) {
    case 'blog':
      return ['Article', 'Announcement']
    case 'stories':
      return ['FounderStory', 'ProductStory', 'CaseStudy']
    case 'insights':
      return ['IndustryInsight']
    case 'guides':
      return ['Guide']
    default:
      return ['Article']
  }
}
