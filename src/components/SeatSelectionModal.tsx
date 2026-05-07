import { useState, useEffect } from 'react'
import { X, Users, CheckCircle, Loader2 } from 'lucide-react'

interface Seat {
  id: string
  seatNumber: number
  seatLabel: string
  position: any
  isAvailable: boolean
  state: 'available' | 'locked' | 'occupied'
}

interface SeatSelectionModalProps {
  tableId: string
  tempId: string
  tableSessionId?: string
  onSeatSelected: (seatId: string, sessionToken: string, seatLabel: string) => void
  onSkip: () => void
  onClose: () => void
}

export default function SeatSelectionModal({
  tableId,
  tempId,
  tableSessionId,
  onSeatSelected,
  onSkip,
  onClose
}: SeatSelectionModalProps) {
  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)
  const [locking, setLocking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null)

  useEffect(() => {
    loadSeats()
  }, [tableId])

  const loadSeats = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/seats/available?tableId=${tableId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load seats')
      }

      const data = await response.json()
      setSeats(data.seats || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load seats')
    } finally {
      setLoading(false)
    }
  }

  const handleSeatClick = async (seat: Seat) => {
    if (!seat.isAvailable || locking) return

    setSelectedSeatId(seat.id)
    setLocking(true)
    setError(null)

    try {
      const response = await fetch('/api/seats/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatId: seat.id,
          tempId,
          tableSessionId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === 'SEAT_TAKEN') {
          setError('This seat was just taken. Please choose another.')
          await loadSeats() // Refresh availability
        } else {
          throw new Error(data.error || 'Failed to lock seat')
        }
        return
      }

      // Success - seat locked
      onSeatSelected(seat.id, data.sessionToken, data.seatLabel)
    } catch (err: any) {
      setError(err.message || 'Failed to select seat')
    } finally {
      setLocking(false)
      setSelectedSeatId(null)
    }
  }

  const getSeatColor = (seat: Seat) => {
    if (seat.state === 'occupied') return 'bg-red-100 border-red-300 text-red-700 cursor-not-allowed'
    if (seat.state === 'locked') return 'bg-yellow-100 border-yellow-300 text-yellow-700 cursor-not-allowed'
    return 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200 cursor-pointer'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Select Your Seat</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading available seats...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700">{error}</p>
              <button
                onClick={loadSeats}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          ) : seats.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No seats available for this table.</p>
              <button
                onClick={onSkip}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Continue Without Seat
              </button>
            </div>
          ) : (
            <>
              {/* Legend */}
              <div className="flex gap-4 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                  <span className="text-gray-600">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                  <span className="text-gray-600">Reserved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                  <span className="text-gray-600">Occupied</span>
                </div>
              </div>

              {/* Seat Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {seats.map((seat) => (
                  <button
                    key={seat.id}
                    onClick={() => handleSeatClick(seat)}
                    disabled={!seat.isAvailable || locking}
                    className={`
                      relative p-6 rounded-lg border-2 transition-all
                      ${getSeatColor(seat)}
                      ${selectedSeatId === seat.id ? 'ring-4 ring-blue-300' : ''}
                      ${!seat.isAvailable ? 'opacity-60' : ''}
                    `}
                  >
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1">{seat.seatNumber}</div>
                      <div className="text-xs">{seat.seatLabel}</div>
                      {seat.isAvailable && (
                        <CheckCircle className="w-4 h-4 mx-auto mt-2 opacity-50" />
                      )}
                      {selectedSeatId === seat.id && locking && (
                        <Loader2 className="w-4 h-4 mx-auto mt-2 animate-spin" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            Select a seat to continue, or skip to order without seat assignment
          </p>
          <button
            onClick={onSkip}
            disabled={locking}
            className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium disabled:opacity-50"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
