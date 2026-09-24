import { FileText, Search } from 'lucide-react'

interface LedgerEntry {
  id: string
  businessId: string
  domain: string
  eventType: string
  amountCents: number
  currency: string
  netAmountCents?: number | null
  gateway?: string | null
  paymentMethod?: string | null
  status?: string | null
  invoiceNumber?: string | null
  occurredAt: string
}

interface LedgerTableProps {
  entries: LedgerEntry[]
  total: number
  page: number
  limit: number
  onPageChange?: (page: number) => void
}

function formatCurrency(cents: number, currency = 'RWF'): string {
  return `${(cents / 100).toLocaleString()} ${currency}`
}

function formatType(type: string): string {
  return type.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
}

export default function LedgerTable({ entries, total, page, limit, onPageChange }: LedgerTableProps) {
  const totalPages = Math.ceil(total / limit)

  if (!entries || entries.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 p-5">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Revenue Ledger</h3>
        </div>
        <p className="text-sm text-slate-400">No ledger entries found.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Revenue Ledger</h3>
        </div>
        <span className="text-xs text-slate-500">{total.toLocaleString()} entries</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table" aria-label="Revenue ledger entries">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
              <th scope="col" className="px-4 py-3 text-left font-medium">Date</th>
              <th scope="col" className="px-4 py-3 text-left font-medium">Type</th>
              <th scope="col" className="px-4 py-3 text-left font-medium">Domain</th>
              <th scope="col" className="px-4 py-3 text-left font-medium">Business</th>
              <th scope="col" className="px-4 py-3 text-left font-medium">Gateway</th>
              <th scope="col" className="px-4 py-3 text-left font-medium">Invoice</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Amount</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Net</th>
              <th scope="col" className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50/50 transition">
                <td className="px-4 py-2.5 text-xs text-slate-600">
                  {new Date(entry.occurredAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2.5 text-xs font-medium text-slate-700">
                  {formatType(entry.eventType)}
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-600">{entry.domain}</td>
                <td className="px-4 py-2.5 text-xs text-slate-600 font-mono">{entry.businessId.slice(-8)}</td>
                <td className="px-4 py-2.5 text-xs text-slate-600">{entry.gateway ?? '—'}</td>
                <td className="px-4 py-2.5 text-xs text-slate-600 font-mono">{entry.invoiceNumber ?? '—'}</td>
                <td className="px-4 py-2.5 text-right text-xs font-medium text-slate-700">
                  {formatCurrency(entry.amountCents, entry.currency)}
                </td>
                <td className="px-4 py-2.5 text-right text-xs text-slate-600">
                  {entry.netAmountCents ? formatCurrency(entry.netAmountCents, entry.currency) : '—'}
                </td>
                <td className="px-4 py-2.5 text-xs">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    entry.status === 'SUCCESS' ? 'bg-green-50 text-green-700'
                    : entry.status === 'FAILED' ? 'bg-red-50 text-red-700'
                    : entry.status === 'PENDING' || entry.status === 'PROCESSING' ? 'bg-amber-50 text-amber-700'
                    : 'bg-slate-50 text-slate-600'
                  }`}>
                    {entry.status ?? '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange?.(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded hover:bg-slate-200 transition disabled:opacity-50"
              aria-label="Previous page"
            >
              Prev
            </button>
            <button
              onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded hover:bg-slate-200 transition disabled:opacity-50"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
