import { Search, Loader2 } from 'lucide-react'
import { useState, useCallback } from 'react'

export interface SearchResult {
  type: string
  id: string
  title: string
  subtitle: string
  status?: string
  link: string
}

interface InvestigationSearchProps {
  onSearch: (query: string) => Promise<{ results: SearchResult[]; total: number } | null>
  onResultClick?: (result: SearchResult) => void
  placeholder?: string
}

const typeIcons: Record<string, string> = {
  partnership: '🤝',
  business: '🏪',
  code: '🎟️',
  campaign: '📣',
  commission: '💰',
  payout: '💸',
  application: '📋',
  agreement: '📄',
}

const typeLabels: Record<string, string> = {
  partnership: 'Partner',
  business: 'Business',
  code: 'Founder Code',
  campaign: 'Campaign',
  commission: 'Commission',
  payout: 'Payout',
  application: 'Application',
  agreement: 'Agreement',
}

export default function InvestigationSearch({
  onSearch,
  onResultClick,
  placeholder = 'Search by name, email, phone, code, ID...',
}: InvestigationSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = useCallback(async () => {
    if (query.trim().length < 2) return
    setLoading(true)
    setHasSearched(true)
    try {
      const res = await onSearch(query.trim())
      if (res) {
        setResults(res.results)
        setTotal(res.total)
      } else {
        setResults([])
        setTotal(0)
      }
    } catch {
      setResults([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [query, onSearch])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-9 pr-24 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Universal investigation search"
        />
        <button
          onClick={handleSearch}
          disabled={loading || query.trim().length < 2}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-md hover:bg-emerald-700 transition disabled:opacity-50"
          aria-label="Search"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
        </button>
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="mt-3">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No results found for &ldquo;{query}&rdquo;</p>
          ) : (
            <>
              <p className="text-xs text-slate-500 mb-2">{total} result{total !== 1 ? 's' : ''} found</p>
              <div className="space-y-1.5 max-h-80 overflow-y-auto" role="list" aria-label="Search results">
                {results.map((r) => (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => onResultClick?.(r)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition text-left border border-transparent hover:border-slate-200"
                    role="listitem"
                  >
                    <span className="text-lg flex-shrink-0" aria-hidden="true">
                      {typeIcons[r.type] ?? '🔍'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                          {typeLabels[r.type] ?? r.type}
                        </span>
                        {r.status && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {r.status}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-800 truncate">{r.title}</p>
                      <p className="text-xs text-slate-500 truncate">{r.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
