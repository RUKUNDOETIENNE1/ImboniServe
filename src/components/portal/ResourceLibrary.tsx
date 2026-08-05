/**
 * ResourceLibrary — Downloadable marketing assets organized by category.
 */

import { Download, FileText, Image as ImageIcon, FolderOpen } from 'lucide-react'

export interface ResourceItem {
  id: string
  name: string
  type: string
  url: string
}

export interface ResourceCategory {
  id: string
  name: string
  items: ResourceItem[]
}

interface ResourceLibraryProps {
  categories: ResourceCategory[]
}

const typeIcons: Record<string, typeof FileText> = {
  image: ImageIcon,
  document: FileText,
}

export default function ResourceLibrary({ categories }: ResourceLibraryProps) {
  if (!categories || categories.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border border-slate-200/60 shadow-sm text-center">
        <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" aria-hidden="true" />
        <p className="text-sm text-slate-500">No resources available yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {categories.map((cat) => (
        <div key={cat.id}>
          <h3 className="font-semibold text-slate-800 mb-3">{cat.name}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cat.items.map((item) => {
              const Icon = typeIcons[item.type] || FileText
              return (
                <a
                  key={item.id}
                  href={item.url}
                  download
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200/60 hover:border-emerald-300 hover:shadow-sm transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                    <p className="text-xs text-slate-400 uppercase">{item.type}</p>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                </a>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
