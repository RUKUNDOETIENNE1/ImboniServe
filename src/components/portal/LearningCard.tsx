/**
 * LearningCard — Displays a learning article with category and read time.
 */

import { BookOpen, Clock, ChevronRight } from 'lucide-react'

export interface LearningArticle {
  id: string
  title: string
  category: string
  readTime: string
  summary: string
}

interface LearningCardProps {
  article: LearningArticle
  onClick?: (id: string) => void
}

export default function LearningCard({ article, onClick }: LearningCardProps) {
  return (
    <button
      onClick={() => onClick?.(article.id)}
      className="w-full text-left bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-blue-600" aria-hidden="true" />
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300" aria-hidden="true" />
      </div>
      <h3 className="font-semibold text-slate-800 text-sm mb-1">{article.title}</h3>
      <p className="text-xs text-slate-500 mb-2 line-clamp-2">{article.summary}</p>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="font-medium text-blue-600">{article.category}</span>
        <span className="text-slate-300">•</span>
        <Clock className="w-3 h-3" aria-hidden="true" />
        <span>{article.readTime}</span>
      </div>
    </button>
  )
}
