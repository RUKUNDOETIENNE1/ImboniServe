'use client'

import type { ScoreDisplay } from '@/lib/service-intelligence/v2'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Props {
  score: ScoreDisplay
}

export function OverallScore({ score }: Props) {
  const TrendIcon = score.trend === 'improving'
    ? TrendingUp
    : score.trend === 'declining'
    ? TrendingDown
    : Minus

  const trendColor = score.trend === 'improving'
    ? 'text-green-600'
    : score.trend === 'declining'
    ? 'text-red-600'
    : 'text-gray-600'

  const scoreColor = score.overall >= 80
    ? 'text-green-600'
    : score.overall >= 60
    ? 'text-yellow-600'
    : 'text-red-600'

  const gradeColor = score.grade === 'A' || score.grade === 'B'
    ? 'bg-green-100 text-green-800'
    : score.grade === 'C'
    ? 'bg-yellow-100 text-yellow-800'
    : 'bg-red-100 text-red-800'

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Overall Service Score</h2>

      <div className="flex items-center justify-between mb-8">
        <div>
          <div className={`text-6xl font-bold ${scoreColor}`}>
            {score.overall}
            <span className="text-2xl text-gray-400">/100</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${gradeColor}`}>
              Grade {score.grade}
            </span>
            <div className={`flex items-center gap-1 ${trendColor}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm capitalize">{score.trend}</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-500">Confidence</div>
          <div className="text-2xl font-semibold text-gray-900">
            {(score.confidence * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Dimension Scores</h3>
        {score.dimensions.map((dim) => (
          <div key={dim.id} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">{dim.name}</span>
              <span className="text-gray-900">
                {dim.value} {dim.unit}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    dim.score >= 80 ? 'bg-green-500' :
                    dim.score >= 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${dim.score}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 w-12 text-right">
                {dim.score}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Benchmark: {dim.benchmark} {dim.unit}</span>
              <span className={
                dim.status === 'above' ? 'text-green-600' :
                dim.status === 'below' ? 'text-red-600' :
                'text-gray-600'
              }>
                {dim.status === 'above' ? '↑' : dim.status === 'below' ? '↓' : '='} {Math.abs(dim.deviation).toFixed(1)} {dim.unit}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
