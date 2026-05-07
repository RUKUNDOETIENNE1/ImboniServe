import { useState } from 'react'
import FormModal from './FormModal'
import { useToast } from './Toast'
import { Save, UtensilsCrossed } from 'lucide-react'

interface TableManagementModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  table?: any
}

export default function TableManagementModal({ isOpen, onClose, onSuccess, table }: TableManagementModalProps) {
  const { showToast } = useToast()
  const [formData, setFormData] = useState({
    number: table?.number || '',
    capacity: table?.capacity || 4,
    status: table?.status || 'AVAILABLE'
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!formData.number || !formData.capacity) {
      showToast('error', 'Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const url = table ? `/api/tables/${table.id}` : '/api/tables'
      const method = table ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        showToast('success', table ? 'Table updated successfully!' : 'Table added successfully!')
        onSuccess()
        onClose()
      } else {
        const error = await res.json()
        showToast('error', error.error || 'Failed to save table')
      }
    } catch (error) {
      showToast('error', 'Failed to save table')
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={table ? 'Edit Table' : 'Add New Table'}
      size="sm"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Table Number</label>
          <input
            type="text"
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
            placeholder="e.g., 1, 2, 3..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Capacity (Seats)</label>
          <input
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
            min="1"
            max="20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
          >
            <option value="AVAILABLE">Available</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="RESERVED">Reserved</option>
            <option value="CLEANING">Cleaning</option>
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-imboni-green to-green-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-green-200 flex items-center justify-center transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : table ? 'Update Table' : 'Add Table'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </FormModal>
  )
}
