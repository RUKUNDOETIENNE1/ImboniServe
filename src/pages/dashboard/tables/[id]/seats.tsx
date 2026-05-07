import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { ArrowLeft, Plus, QrCode, Edit2, Trash2, Check, X, MapPin, Loader2 } from 'lucide-react'
import Link from 'next/link'

type Seat = {
  id: string
  seatNumber: number
  seatLabel: string | null
  qrCode: string | null
  position: { x: number; y: number; edge: string } | null
  isActive: boolean
  _count?: {
    sales: number
    tips: number
  }
}

type Table = {
  id: string
  number: string
  capacity: number
  status: string
}

export default function TableSeatsPage() {
  const router = useRouter()
  const { id: tableId } = router.query
  const { data: session } = useSession()

  const [table, setTable] = useState<Table | null>(null)
  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')

  useEffect(() => {
    if (tableId && typeof tableId === 'string') {
      loadTableAndSeats()
    }
  }, [tableId])

  const loadTableAndSeats = async () => {
    if (!tableId || typeof tableId !== 'string') return
    setLoading(true)
    try {
      const [tableRes, seatsRes] = await Promise.all([
        fetch(`/api/tables/${tableId}`),
        fetch(`/api/tables/${tableId}/seats`)
      ])

      if (tableRes.ok) {
        const tableData = await tableRes.json()
        setTable(tableData)
      }

      if (seatsRes.ok) {
        const seatsData = await seatsRes.json()
        setSeats(seatsData)
      }
    } catch (error) {
      console.error('Failed to load table/seats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAutoGenerate = async () => {
    if (!tableId || typeof tableId !== 'string') return
    setGenerating(true)
    try {
      const res = await fetch(`/api/tables/${tableId}/seats/generate`, {
        method: 'POST'
      })
      if (res.ok) {
        const data = await res.json()
        alert(`Generated ${data.count} seats`)
        loadTableAndSeats()
      } else {
        const err = await res.json().catch(() => ({}))
        alert(`Failed: ${err.error || res.statusText}`)
      }
    } catch (error) {
      console.error('Failed to generate seats:', error)
      alert('Failed to generate seats')
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateQR = async (seatId: string) => {
    try {
      const res = await fetch(`/api/seats/${seatId}/qr`, {
        method: 'POST'
      })
      if (res.ok) {
        alert('QR code generated')
        loadTableAndSeats()
      } else {
        const err = await res.json().catch(() => ({}))
        alert(`Failed: ${err.error || res.statusText}`)
      }
    } catch (error) {
      console.error('Failed to generate QR:', error)
      alert('Failed to generate QR code')
    }
  }

  const handleUpdateLabel = async (seatId: string, newLabel: string) => {
    try {
      const res = await fetch(`/api/seats/${seatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatLabel: newLabel })
      })
      if (res.ok) {
        setEditingId(null)
        setEditLabel('')
        loadTableAndSeats()
      } else {
        const err = await res.json().catch(() => ({}))
        alert(`Failed: ${err.error || res.statusText}`)
      }
    } catch (error) {
      console.error('Failed to update label:', error)
      alert('Failed to update label')
    }
  }

  const handleDeactivate = async (seatId: string) => {
    if (!confirm('Deactivate this seat?')) return
    try {
      const res = await fetch(`/api/seats/${seatId}/deactivate`, {
        method: 'POST'
      })
      if (res.ok) {
        loadTableAndSeats()
      } else {
        const err = await res.json().catch(() => ({}))
        alert(`Failed: ${err.error || res.statusText}`)
      }
    } catch (error) {
      console.error('Failed to deactivate seat:', error)
      alert('Failed to deactivate seat')
    }
  }

  const handleActivate = async (seatId: string) => {
    try {
      const res = await fetch(`/api/seats/${seatId}/activate`, {
        method: 'POST'
      })
      if (res.ok) {
        loadTableAndSeats()
      } else {
        const err = await res.json().catch(() => ({}))
        alert(`Failed: ${err.error || res.statusText}`)
      }
    } catch (error) {
      console.error('Failed to activate seat:', error)
      alert('Failed to activate seat')
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    )
  }

  if (!table) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-slate-600">Table not found</p>
          <Link href="/dashboard/tables" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to Tables
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/tables" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Tables
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Table {table.number} - Seats
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Capacity: {table.capacity} | Status: {table.status}
              </p>
            </div>
            <button
              onClick={handleAutoGenerate}
              disabled={generating}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Auto-Generate Seats
                </>
              )}
            </button>
          </div>
        </div>

        {/* Seats List */}
        {seats.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Seats Yet</h3>
            <p className="text-sm text-slate-500 mb-6">
              Auto-generate seats based on table capacity ({table.capacity} seats)
            </p>
            <button
              onClick={handleAutoGenerate}
              disabled={generating}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Seats
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Seat #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Label
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      QR Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {seats.map((seat) => (
                    <tr key={seat.id} className={!seat.isActive ? 'opacity-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {seat.seatNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {editingId === seat.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editLabel}
                              onChange={(e) => setEditLabel(e.target.value)}
                              className="px-2 py-1 border border-slate-300 rounded text-sm"
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdateLabel(seat.id, editLabel)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null)
                                setEditLabel('')
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span>{seat.seatLabel || '-'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {seat.position ? (
                          <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                            {(seat.position as any).edge}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {seat.qrCode ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            Generated
                          </span>
                        ) : (
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">
                            None
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {seat._count ? (
                          <div className="text-xs">
                            <div>{seat._count.sales} orders</div>
                            <div className="text-slate-400">{seat._count.tips} tips</div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {seat.isActive ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            Active
                          </span>
                        ) : (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          {editingId !== seat.id && (
                            <button
                              onClick={() => {
                                setEditingId(seat.id)
                                setEditLabel(seat.seatLabel || `Seat ${seat.seatNumber}`)
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit label"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {!seat.qrCode && (
                            <button
                              onClick={() => handleGenerateQR(seat.id)}
                              className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                              title="Generate QR"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          )}
                          {seat.isActive ? (
                            <button
                              onClick={() => handleDeactivate(seat.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Deactivate"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(seat.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Activate"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">About Seat Management</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Auto-generate creates seats based on table capacity</li>
            <li>• Each seat can have its own QR code for direct ordering</li>
            <li>• Seat labels can be customized (e.g., "Window Seat", "Seat A")</li>
            <li>• Deactivated seats are hidden from customers but preserved in history</li>
            <li>• Usage stats show orders and tips per seat</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}
